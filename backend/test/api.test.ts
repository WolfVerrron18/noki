// Сценарий целиком на настоящем Postgres (PGlite): мастер, услуги, слоты, запись, отмена, «выполнено».
import { beforeAll, describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { MASTER, SERVICE, testEnv, type TestEnv } from './helpers'

// понедельник 19 октября 2026, 09:00 по Москве
const MONDAY_9 = '2026-10-19T06:00:00.000Z'
const AT_10 = '2026-10-19T07:00:00.000Z'
const AT_11 = '2026-10-19T08:00:00.000Z'
const AT_12 = '2026-10-19T09:00:00.000Z'

const MASTER_TG = 111
const CLIENT_TG = 222
const STRANGER_TG = 333

describe('API', () => {
  let env: TestEnv
  let master: string
  let client: string
  let stranger: string
  let masterId: string
  let serviceId: string
  let bookingId: string

  const book = (startAt: string, extra: object = {}, token = client) =>
    env.call('POST', '/api/bookings', {
      token,
      body: { masterId, serviceId, startAt, clientName: 'Мария', clientPhone: '8 927 057-60-65', note: 'Потемнее', ...extra },
    })

  beforeAll(async () => {
    env = await testEnv(MONDAY_9)
    master = await env.login(MASTER_TG, 'Анна')
    client = await env.login(CLIENT_TG, 'Мария')
    stranger = await env.login(STRANGER_TG, 'Чужая')
  })

  describe('вход и профиль', () => {
    it('без токена — 401, с битым токеном — 401', async () => {
      expect((await env.call('GET', '/api/masters/me')).status).toBe(401)
      expect((await env.call('GET', '/api/masters/me', { token: 'x.y.z' })).status).toBe(401)
    })

    it('тестовый вход dev работает при NIDOKI_DEV_AUTH', async () => {
      const res = await env.call('POST', '/api/auth/telegram', { body: { initData: 'dev' } })
      expect(res.status).toBe(200)
      expect(res.body.user.telegram_id).toBe(1000001)
    })

    it('неподписанный initData — 401', async () => {
      expect((await env.call('POST', '/api/auth/telegram', { body: { initData: 'user=%7B%22id%22%3A1%7D' } })).status).toBe(401)
    })

    it('ещё не мастер — null', async () => {
      const res = await env.call('GET', '/api/masters/me', { token: master })
      expect(res.status).toBe(200)
      expect(res.body).toBeNull()
    })

    it('неверные часы не принимаются', async () => {
      const res = await env.call('POST', '/api/masters', { token: master, body: { ...MASTER, work_hours: { 1: [['19:00', '10:00']] } } })
      expect(res.status).toBe(400)
    })

    it('создаёт профиль, второй — 409', async () => {
      const res = await env.call('POST', '/api/masters', { token: master, body: MASTER })
      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ slug: 'anna', theme: 'lavender', mascot: { head: 'crown' } })
      masterId = res.body.id
      expect((await env.call('POST', '/api/masters', { token: master, body: { ...MASTER, slug: 'anna2' } })).status).toBe(409)
    })

    it('занятый адрес — 409 и slug-free = false', async () => {
      expect((await env.call('POST', '/api/masters', { token: stranger, body: MASTER })).status).toBe(409)
      expect((await env.call('GET', '/api/masters/slug-free?slug=anna', { token: stranger })).body.free).toBe(false)
      expect((await env.call('GET', `/api/masters/slug-free?slug=anna&except=${masterId}`, { token: master })).body.free).toBe(true)
    })

    it('при входе возвращается id профиля', async () => {
      const res = await env.call('POST', '/api/auth/telegram', { body: { initData: 'dev' } })
      expect(res.body.master).toBeNull()
      expect((await env.call('GET', '/api/masters/me', { token: master })).body.id).toBe(masterId)
    })

    it('страница по адресу открыта всем, чужой профиль менять нельзя', async () => {
      expect((await env.call('GET', '/api/masters/by-slug/anna')).body.name).toBe('Анна')
      expect((await env.call('GET', '/api/masters/by-slug/nobody')).status).toBe(404)
      expect((await env.call('PATCH', `/api/masters/${masterId}`, { token: stranger, body: { name: 'X' } })).status).toBe(403)
      const res = await env.call('PATCH', `/api/masters/${masterId}`, { token: master, body: { name: 'Анна Брови' } })
      expect(res.body.name).toBe('Анна Брови')
    })
  })

  describe('услуги', () => {
    it('создаёт по порядку, чужой список закрыт', async () => {
      const a = await env.call('POST', `/api/masters/${masterId}/services`, { token: master, body: SERVICE })
      const b = await env.call('POST', `/api/masters/${masterId}/services`, { token: master, body: { ...SERVICE, name: 'Ресницы', duration_min: 90, price: 2500 } })
      const hidden = await env.call('POST', `/api/masters/${masterId}/services`, { token: master, body: { ...SERVICE, name: 'Скрытая', is_active: false } })
      expect([a.status, b.status, hidden.status]).toEqual([201, 201, 201])
      expect([a.body.sort, b.body.sort, hidden.body.sort]).toEqual([0, 1, 2])
      serviceId = a.body.id
      expect((await env.call('GET', `/api/masters/${masterId}/services`, { token: stranger })).status).toBe(403)
    })

    it('клиенткам — только видимые, мастеру — все', async () => {
      const active = await env.call('GET', `/api/masters/${masterId}/services/active`)
      expect(active.body.map((s: { name: string }) => s.name)).toEqual(['Брови', 'Ресницы'])
      const all = await env.call('GET', `/api/masters/${masterId}/services`, { token: master })
      expect(all.body).toHaveLength(3)
    })

    it('меняет порядок целиком', async () => {
      const all = (await env.call('GET', `/api/masters/${masterId}/services`, { token: master })).body as { id: string }[]
      const ids = all.map((s) => s.id).reverse()
      // чужая не может переставить, у неё нет этих услуг
      expect((await env.call('PUT', '/api/services/order', { token: stranger, body: { ids } })).status).toBe(404)
      expect((await env.call('PUT', '/api/services/order', { token: master, body: { ids } })).status).toBe(204)
      const after = (await env.call('GET', `/api/masters/${masterId}/services`, { token: master })).body as { id: string }[]
      expect(after.map((s) => s.id)).toEqual(ids)
    })

    it('удаление прячет услугу, чужую удалить нельзя', async () => {
      const all = (await env.call('GET', `/api/masters/${masterId}/services`, { token: master })).body as { id: string; name: string }[]
      const hidden = all.find((s) => s.name === 'Скрытая')!
      expect((await env.call('DELETE', `/api/services/${hidden.id}`, { token: stranger })).status).toBe(404)
      expect((await env.call('DELETE', `/api/services/${hidden.id}`, { token: master })).status).toBe(204)
      expect((await env.call('GET', `/api/masters/${masterId}/services`, { token: master })).body).toHaveLength(2)
    })
  })

  describe('слоты и запись', () => {
    it('клиентке — не раньше чем через час', async () => {
      const res = await env.call('GET', `/api/slots?master=${masterId}&service=${serviceId}&date=2026-10-19`)
      expect(res.status).toBe(200)
      expect(res.body.slots[0]).toBe(AT_10)
    })

    it('ручные слоты — только мастеру', async () => {
      const q = `/api/slots?master=${masterId}&service=${serviceId}&date=2026-10-19&manual=1`
      expect((await env.call('GET', q)).status).toBe(401)
      expect((await env.call('GET', q, { token: stranger })).status).toBe(403)
      expect((await env.call('GET', q, { token: master })).body.slots[0]).toBe(AT_10)
    })

    it('телефон обязателен клиентке и приводится к E.164', async () => {
      expect((await book(AT_10, { clientPhone: '' })).status).toBe(400)
      expect((await book(AT_10, { clientPhone: '123' })).status).toBe(400)
      const res = await book(AT_10)
      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ client_phone: '+79270576065', client_telegram_id: CLIENT_TG, service_name: 'Брови', status: 'booked', source: 'client' })
      bookingId = res.body.id
    })

    it('занятое время — 409', async () => {
      expect((await book(AT_10)).status).toBe(409)
      // 10:30 пересекается с записью 10:00–11:00
      expect((await book('2026-10-19T07:30:00.000Z')).status).toBe(409)
    })

    it('время не из сетки — 409', async () => {
      expect((await book('2026-10-19T08:10:00.000Z')).status).toBe(409)
    })

    it('одновременные запросы на одно время — проходит один', async () => {
      const results = await Promise.all([book(AT_12), book(AT_12, {}, stranger)])
      expect(results.map((r) => r.status).sort()).toEqual([201, 409])
    })

    it('цена записи не меняется вместе с услугой', async () => {
      await env.call('PATCH', `/api/services/${serviceId}`, { token: master, body: { price: 2000, name: 'Брови люкс' } })
      const rows = await env.database.db.execute(sql`select price, service_name from appointments where id = ${bookingId}`)
      const row = (Array.isArray(rows) ? rows : (rows as { rows: unknown[] }).rows)[0] as { price: number; service_name: string }
      expect(row).toEqual({ price: 1800, service_name: 'Брови' })
    })

    it('база сама не даёт пересечь записи', async () => {
      await expect(
        env.database.db.execute(sql`
          insert into appointments (master_id, service_id, service_name, duration_min, client_name, start_at, end_at, source)
          values (${masterId}, ${serviceId}, 'x', 60, 'x', ${'2026-10-19T07:15:00Z'}, ${'2026-10-19T08:15:00Z'}, 'manual')`),
      ).rejects.toMatchObject({ code: '23P01' })
    })

    it('ручная запись: без телефона можно, чужому мастеру нельзя', async () => {
      const body = { masterId, serviceId, startAt: AT_11, clientName: 'Ольга', clientPhone: '', note: '' }
      expect((await env.call('POST', '/api/appointments/manual', { token: stranger, body })).status).toBe(403)
      const res = await env.call('POST', '/api/appointments/manual', { token: master, body })
      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ source: 'manual', client_telegram_id: null, client_phone: '' })
    })

    it('«Мои записи» клиентки и записи мастера за день', async () => {
      const my = await env.call('GET', '/api/bookings/my', { token: client })
      expect(my.body.map((a: { start_at: string }) => a.start_at)).toContain(AT_10)
      expect(my.body[0]).toMatchObject({ master_name: 'Анна Брови', master_timezone: 'Europe/Moscow' })
      const day = await env.call('GET', `/api/masters/${masterId}/appointments?from=2026-10-18T21:00:00.000Z&to=2026-10-19T21:00:00.000Z`, { token: master })
      expect(day.body).toHaveLength(3)
      expect((await env.call('GET', `/api/masters/${masterId}/appointments?from=2026-10-18T21:00:00.000Z&to=2026-10-19T21:00:00.000Z`, { token: client })).status).toBe(403)
    })
  })

  describe('отмена и «выполнено»', () => {
    it('чужую запись не видно', async () => {
      expect((await env.call('POST', `/api/appointments/${bookingId}/cancel`, { token: stranger })).status).toBe(404)
    })

    it('«выполнено» — только мастер и только после начала', async () => {
      expect((await env.call('POST', `/api/appointments/${bookingId}/done`, { token: master })).status).toBe(409)
      expect((await env.call('POST', `/api/appointments/${bookingId}/done`, { token: client })).status).toBe(403)
    })

    it('клиентка отменяет свою, время освобождается', async () => {
      const res = await env.call('POST', `/api/appointments/${bookingId}/cancel`, { token: client })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('cancelled')
      expect((await env.call('POST', `/api/appointments/${bookingId}/cancel`, { token: client })).status).toBe(409)
      const again = await book(AT_10)
      expect(again.status).toBe(201)
      bookingId = again.body.id
    })

    it('после начала: отменить нельзя, отметить выполненной можно', async () => {
      env.setNow('2026-10-19T07:10:00.000Z')
      expect((await env.call('POST', `/api/appointments/${bookingId}/cancel`, { token: client })).status).toBe(409)
      const res = await env.call('POST', `/api/appointments/${bookingId}/done`, { token: master })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('done')
    })
  })

  it('отзыв сохраняется и уходит разработчику', async () => {
    const res = await env.call('POST', '/api/feedback', { token: client, body: { text: 'Хочу тёмную тему', role: 'client' } })
    expect(res.status).toBe(204)
    expect(env.sent.at(-1)).toMatchObject({ chatId: '42' })
    expect(env.sent.at(-1)!.text).toContain('Хочу тёмную тему')
  })
})
