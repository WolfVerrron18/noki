// Проверки доступа, общие для маршрутов: чей мастер, чья услуга.
import { and, eq } from 'drizzle-orm'
import type { AuthUser } from '~/app'
import type { Db } from '~/db/client'
import { masters, services, type MasterRow, type ServiceRow } from '~/db/schema'
import { forbidden, notFound } from '~/lib/errors'

/**
 * Мастер по id.
 * @param db база
 * @param id id мастера (уже проверенный uuid)
 * @throws 404, если нет
 */
export async function findMaster(db: Db, id: string): Promise<MasterRow> {
  const [m] = await db.select().from(masters).where(eq(masters.id, id))
  if (!m) throw notFound('master_not_found')
  return m
}

/**
 * Мастер, которым владеет пользователь.
 * @param db база
 * @param id id мастера
 * @param user кто спрашивает
 * @throws 404 — нет такого, 403 — чужой
 */
export async function ownMaster(db: Db, id: string, user: AuthUser): Promise<MasterRow> {
  const m = await findMaster(db, id)
  if (m.userId !== user.id) throw forbidden('not_your_master')
  return m
}

/**
 * Услуга мастера (не удалённая).
 * @param db база
 * @param masterId id мастера
 * @param serviceId id услуги
 * @throws 404, если нет, чужая или удалена
 */
export async function findService(db: Db, masterId: string, serviceId: string): Promise<ServiceRow> {
  const [s] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.masterId, masterId), eq(services.archived, false)))
  if (!s) throw notFound('service_not_found')
  return s
}

/** uuid в адресе: кривой id — сразу 404, а не ошибка базы */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Проверить id из адреса.
 * @param id параметр маршрута
 * @throws 404, если это не uuid
 */
export function idParam(id: string): string {
  if (!UUID_RE.test(id)) throw notFound()
  return id
}
