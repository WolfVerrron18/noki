// Профиль мастера: свой (создать, изменить) и публичный — по адресу ссылки.
import { Hono } from 'hono'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { AppDeps, AppEnv } from '~/app'
import { requireUser } from '~/auth/session'
import { masters } from '~/db/schema'
import { conflict, notFound, pgCode, PG_UNIQUE_VIOLATION } from '~/lib/errors'
import { masterColumns, toMaster } from '~/lib/mappers'
import { masterInput, masterPatch } from '~/lib/validation'
import { idParam, ownMaster, UUID_RE } from '~/routes/access'

/**
 * Занятый адрес или второй профиль у того же пользователя — 409.
 * @param e ошибка базы
 */
function uniqueToConflict(e: unknown): never {
  if (pgCode(e) === PG_UNIQUE_VIOLATION) throw conflict(String(e).includes('slug') ? 'slug_taken' : 'master_exists')
  throw e
}

/**
 * Маршруты профиля мастера.
 * @param deps зависимости приложения
 */
export function masterRoutes({ db }: AppDeps) {
  const r = new Hono<AppEnv>()

  // свой профиль; нет — null (ещё не мастер, пойдёт в онбординг)
  r.get('/api/masters/me', async (c) => {
    const user = requireUser(c)
    const [m] = await db.select().from(masters).where(eq(masters.userId, user.id))
    return c.json(m ? toMaster(m) : null)
  })

  // свободен ли адрес ссылки; except — свой профиль при правке
  r.get('/api/masters/slug-free', async (c) => {
    requireUser(c)
    const slug = c.req.query('slug') ?? ''
    const except = c.req.query('except')
    const where = except && UUID_RE.test(except) ? and(eq(masters.slug, slug), ne(masters.id, except)) : eq(masters.slug, slug)
    const [taken] = await db.select({ id: masters.id }).from(masters).where(where).limit(1)
    return c.json({ free: !taken })
  })

  // публичная страница мастера: её открывает клиентка по ссылке
  r.get('/api/masters/by-slug/:slug', async (c) => {
    const [m] = await db.select().from(masters).where(eq(masters.slug, c.req.param('slug')))
    if (!m) throw notFound('master_not_found')
    return c.json(toMaster(m))
  })

  r.post('/api/masters', async (c) => {
    const user = requireUser(c)
    const data = masterInput.parse(await c.req.json())
    const [m] = await db
      .insert(masters)
      .values({ ...(masterColumns(data) as typeof masters.$inferInsert), userId: user.id })
      .returning()
      .catch(uniqueToConflict)
    return c.json(toMaster(m), 201)
  })

  r.patch('/api/masters/:id', async (c) => {
    const user = requireUser(c)
    const id = idParam(c.req.param('id'))
    await ownMaster(db, id, user)
    const data = masterPatch.parse(await c.req.json())
    const [m] = await db
      .update(masters)
      .set({ ...masterColumns(data), updatedAt: sql`now()` })
      .where(eq(masters.id, id))
      .returning()
      .catch(uniqueToConflict)
    return c.json(toMaster(m))
  })

  return r
}
