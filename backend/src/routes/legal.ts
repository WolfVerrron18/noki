// Принятые документы: что пользователь уже принял и приём новых. Принять можно только текущую редакцию —
// значит, человек видел именно тот текст, что сейчас действует.
import { Hono } from 'hono'
import { LEGAL_VERSIONS } from '@/legal/documents'
import type { AppContext, AppEnv } from '~/app'
import { requireUser } from '~/auth/session'
import { consents } from '~/db/schema'
import { conflict } from '~/lib/errors'
import { consentsInput } from '~/lib/validation'
import { acceptedDocs } from '~/routes/access'

/**
 * Маршруты документов.
 * @param deps зависимости приложения
 */
export function legalRoutes({ db, now }: AppContext) {
  const r = new Hono<AppEnv>()

  r.get('/api/legal/consents', async (c) => c.json(await acceptedDocs(db, requireUser(c).id)))

  r.post('/api/legal/consents', async (c) => {
    const user = requireUser(c)
    const { documents } = consentsInput.parse(await c.req.json())
    // показали старую редакцию — пусть фронт загрузит новую и покажет её
    if (documents.some((d) => LEGAL_VERSIONS[d.document] !== d.version)) throw conflict('version_outdated')
    await db
      .insert(consents)
      .values(documents.map((d) => ({ userId: user.id, document: d.document, version: d.version, acceptedAt: now() })))
      .onConflictDoNothing()
    return c.json(await acceptedDocs(db, user.id))
  })

  return r
}
