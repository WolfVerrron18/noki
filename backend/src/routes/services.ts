// Услуги мастера: список, создание, правка, мягкое удаление и порядок.
import { Hono } from 'hono'
import { and, asc, eq, inArray, max } from 'drizzle-orm'
import type { AppContext, AppEnv } from '~/app'
import { requireUser } from '~/auth/session'
import { masters, services } from '~/db/schema'
import { badRequest, notFound } from '~/lib/errors'
import { serviceColumns, toService } from '~/lib/mappers'
import { reorderInput, serviceInput, servicePatch } from '~/lib/validation'
import { findMaster, idParam, ownMaster } from '~/routes/access'

/**
 * Маршруты услуг.
 * @param deps зависимости приложения
 */
export function serviceRoutes({ db }: AppContext) {
  const r = new Hono<AppEnv>()

  /**
   * Услуга мастера-владельца (не удалённая).
   * @param id id услуги
   * @param userId кто спрашивает
   * @throws 404 — нет такой или чужая
   */
  async function ownService(id: string, userId: string) {
    const [row] = await db
      .select({ service: services })
      .from(services)
      .innerJoin(masters, eq(masters.id, services.masterId))
      .where(and(eq(services.id, id), eq(services.archived, false), eq(masters.userId, userId)))
    if (!row) throw notFound('service_not_found')
    return row.service
  }

  // все услуги мастера, включая скрытые, — только ему
  r.get('/api/masters/:id/services', async (c) => {
    const id = idParam(c.req.param('id'))
    await ownMaster(db, id, requireUser(c))
    const rows = await db
      .select()
      .from(services)
      .where(and(eq(services.masterId, id), eq(services.archived, false)))
      .orderBy(asc(services.sort), asc(services.createdAt))
    return c.json(rows.map(toService))
  })

  // видимые клиенткам — всем
  r.get('/api/masters/:id/services/active', async (c) => {
    const id = idParam(c.req.param('id'))
    await findMaster(db, id)
    const rows = await db
      .select()
      .from(services)
      .where(and(eq(services.masterId, id), eq(services.archived, false), eq(services.isActive, true)))
      .orderBy(asc(services.sort), asc(services.createdAt))
    return c.json(rows.map(toService))
  })

  // новая услуга — в конец списка
  r.post('/api/masters/:id/services', async (c) => {
    const id = idParam(c.req.param('id'))
    await ownMaster(db, id, requireUser(c))
    const data = serviceInput.parse(await c.req.json())
    const [{ last }] = await db.select({ last: max(services.sort) }).from(services).where(eq(services.masterId, id))
    const [row] = await db
      .insert(services)
      .values({ ...(serviceColumns(data) as typeof services.$inferInsert), masterId: id, sort: (last ?? -1) + 1 })
      .returning()
    return c.json(toService(row), 201)
  })

  r.patch('/api/services/:id', async (c) => {
    const id = idParam(c.req.param('id'))
    await ownService(id, requireUser(c).id)
    const data = servicePatch.parse(await c.req.json())
    const [row] = await db.update(services).set(serviceColumns(data)).where(eq(services.id, id)).returning()
    return c.json(toService(row))
  })

  // удаление мягкое: на услугу ссылаются записи, она только пропадает из списков
  r.delete('/api/services/:id', async (c) => {
    const id = idParam(c.req.param('id'))
    await ownService(id, requireUser(c).id)
    await db.update(services).set({ archived: true }).where(eq(services.id, id))
    return c.body(null, 204)
  })

  // порядок услуг своего мастера — целиком и одной транзакцией: не бывает «половины» нового порядка
  r.put('/api/services/order', async (c) => {
    const user = requireUser(c)
    const [own] = await db.select({ id: masters.id }).from(masters).where(eq(masters.userId, user.id))
    if (!own) throw notFound('master_not_found')
    const id = own.id
    const { ids } = reorderInput.parse(await c.req.json())
    if (new Set(ids).size !== ids.length) throw badRequest('duplicate_ids')
    await db.transaction(async (tx) => {
      const own = await tx
        .select({ id: services.id })
        .from(services)
        .where(and(eq(services.masterId, id), inArray(services.id, ids)))
      if (own.length !== ids.length) throw notFound('service_not_found')
      for (const [sort, serviceId] of ids.entries()) await tx.update(services).set({ sort }).where(eq(services.id, serviceId))
    })
    return c.body(null, 204)
  })

  return r
}
