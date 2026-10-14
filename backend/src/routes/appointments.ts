// Записи: свободные слоты, запись клиентки, ручная запись мастера, отмена, «выполнено», списки.
// Создаются и меняются записи только здесь — с проверкой времени и пересечений.
import { Hono } from 'hono'
import { and, asc, eq, gt, gte, lt, sql } from 'drizzle-orm'
import { EnumAppointmentSource, isCancellable, isCompletable } from '@/api/types'
import { normalizePhone, phoneCountry } from '@/utils/phone'
import { todayIn } from '@/utils/slots'
import type { AppDeps, AppEnv, AuthUser } from '~/app'
import { requireUser } from '~/auth/session'
import { appointments, masters } from '~/db/schema'
import { badRequest, conflict, forbidden, notFound, pgCode, PG_EXCLUSION_VIOLATION } from '~/lib/errors'
import { toAppointment } from '~/lib/mappers'
import { slotsFor } from '~/lib/slots'
import { bookingInput, periodQuery, slotsQuery } from '~/lib/validation'
import { CLIENT_DOCS } from '@/legal/documents'
import { findMaster, findService, idParam, ownMaster, requireDocs } from '~/routes/access'

/**
 * Маршруты записей.
 * @param deps зависимости приложения
 */
export function appointmentRoutes({ db, now }: AppDeps) {
  const r = new Hono<AppEnv>()

  /**
   * Создать запись: время должно быть среди свободных слотов с теми же настройками, что видит человек.
   * @param raw тело запроса
   * @param user кто записывает
   * @param source клиентка сама или мастер вручную
   */
  async function create(raw: unknown, user: AuthUser, source: EnumAppointmentSource) {
    const input = bookingInput.parse(raw)
    const manual = source === EnumAppointmentSource.Manual
    const master = manual ? await ownMaster(db, input.masterId, user) : await findMaster(db, input.masterId)
    const service = await findService(db, master.id, input.serviceId)
    // скрытую услугу клиентка выбрать не может, мастер вручную — может
    if (!manual && !service.isActive) throw notFound('service_not_found')
    // клиентка записывается, только приняв документы; за согласие клиентки при ручной записи отвечает мастер
    if (!manual) await requireDocs(db, user.id, CLIENT_DOCS)

    // телефон — в E.164; клиентке обязателен, мастер может записать без него
    let phone = ''
    if (input.clientPhone) {
      phone = normalizePhone(input.clientPhone, phoneCountry(master.timezone)) ?? ''
      if (!phone) throw badRequest('phone_invalid')
    } else if (!manual) {
      throw badRequest('phone_required')
    }

    const start = new Date(input.startAt)
    const date = todayIn(master.timezone, start)
    const slots = await slotsFor(db, { master, service, date, manual, now: now() })
    if (!slots.some((s) => Date.parse(s) === start.getTime())) throw conflict('slot_taken')

    const end = new Date(start.getTime() + service.durationMin * 60000)
    try {
      const [row] = await db
        .insert(appointments)
        .values({
          masterId: master.id,
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          currency: master.currency,
          durationMin: service.durationMin,
          clientName: input.clientName,
          clientPhone: phone,
          clientTelegramId: manual ? null : user.telegramId,
          note: input.note,
          startAt: start,
          endAt: end,
          source,
        })
        .returning()
      return toAppointment(row, master)
    } catch (e) {
      // два запроса на одно время одновременно: второе отбивает сама база
      if (pgCode(e) === PG_EXCLUSION_VIOLATION) throw conflict('slot_taken')
      throw e
    }
  }

  /**
   * Запись с мастером и правами: клиентка — своя, мастер — к ней.
   * @param id id записи
   * @param user кто спрашивает
   * @returns запись, мастер и роль спрашивающего
   * @throws 404 — нет такой или чужая
   */
  async function accessible(id: string, user: AuthUser) {
    const [row] = await db
      .select({ a: appointments, m: masters })
      .from(appointments)
      .innerJoin(masters, eq(masters.id, appointments.masterId))
      .where(eq(appointments.id, id))
    if (!row) throw notFound()
    const isMaster = row.m.userId === user.id
    const isClient = row.a.clientTelegramId === user.telegramId
    if (!isMaster && !isClient) throw notFound()
    return { ...row, isMaster, isClient }
  }

  // GET /api/slots?master&service&date[&manual=1] — manual только владелице
  r.get('/api/slots', async (c) => {
    const q = slotsQuery.parse(c.req.query())
    const manual = q.manual === '1' || q.manual === 'true'
    const master = manual ? await ownMaster(db, q.master, requireUser(c)) : await findMaster(db, q.master)
    const service = await findService(db, master.id, q.service)
    if (!manual && !service.isActive) throw notFound('service_not_found')
    return c.json({ slots: await slotsFor(db, { master, service, date: q.date, manual, now: now() }) })
  })

  r.post('/api/bookings', async (c) => c.json(await create(await c.req.json(), requireUser(c), EnumAppointmentSource.Client), 201))

  r.post('/api/appointments/manual', async (c) => c.json(await create(await c.req.json(), requireUser(c), EnumAppointmentSource.Manual), 201))

  // будущие записи клиентки ко всем мастерам
  r.get('/api/bookings/my', async (c) => {
    const user = requireUser(c)
    const rows = await db
      .select({ a: appointments, m: masters })
      .from(appointments)
      .innerJoin(masters, eq(masters.id, appointments.masterId))
      .where(and(eq(appointments.clientTelegramId, user.telegramId), eq(appointments.status, 'booked'), gt(appointments.endAt, now())))
      .orderBy(asc(appointments.startAt))
    return c.json(rows.map(({ a, m }) => toAppointment(a, m)))
  })

  // записи мастера за период, включая отменённые
  r.get('/api/masters/:id/appointments', async (c) => {
    const master = await ownMaster(db, idParam(c.req.param('id')), requireUser(c))
    const { from, to } = periodQuery.parse(c.req.query())
    const rows = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.masterId, master.id), gte(appointments.startAt, new Date(from)), lt(appointments.startAt, new Date(to))))
      .orderBy(asc(appointments.startAt))
    return c.json(rows.map((a) => toAppointment(a, master)))
  })

  // отменить: клиентка — свою, мастер — к себе; только пока не началась
  r.post('/api/appointments/:id/cancel', async (c) => {
    const user = requireUser(c)
    const { a, m, isClient } = await accessible(idParam(c.req.param('id')), user)
    if (!isCancellable(toAppointment(a, m), now())) throw conflict('not_cancellable')
    const [row] = await db
      .update(appointments)
      .set({ status: 'cancelled', cancelledBy: isClient ? 'client' : 'master', cancelledAt: now(), updatedAt: sql`now()` })
      .where(and(eq(appointments.id, a.id), eq(appointments.status, 'booked')))
      .returning()
    if (!row) throw conflict('not_cancellable')
    return c.json(toAppointment(row, m))
  })

  // отметить выполненной: только мастер и только после начала
  r.post('/api/appointments/:id/done', async (c) => {
    const user = requireUser(c)
    const { a, m, isMaster } = await accessible(idParam(c.req.param('id')), user)
    if (!isMaster) throw forbidden()
    if (!isCompletable(toAppointment(a, m), now())) throw conflict('not_completable')
    const [row] = await db
      .update(appointments)
      .set({ status: 'done', doneAt: now(), updatedAt: sql`now()` })
      .where(and(eq(appointments.id, a.id), eq(appointments.status, 'booked')))
      .returning()
    if (!row) throw conflict('not_completable')
    return c.json(toAppointment(row, m))
  })

  return r
}
