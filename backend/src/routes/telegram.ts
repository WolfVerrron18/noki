// Связь с Telegram: вебхук бота и разрешение писать пользователю.
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { AppContext, AppEnv } from '~/app'
import { requireUser } from '~/auth/session'
import { users } from '~/db/schema'
import { notFound } from '~/lib/errors'
import { handleUpdate, type TelegramUpdate } from '~/bot/updates'

/** Ответ мини-аппа на запрос requestWriteAccess */
const botAccessInput = z.object({ allowed: z.boolean() })

/**
 * Маршруты Telegram.
 * @param ctx контекст приложения
 */
export function telegramRoutes({ db, config, bot, links }: AppContext) {
  const r = new Hono<AppEnv>()

  // вебхук: Telegram присылает секрет в заголовке — без него запрос не от Telegram
  r.post('/api/telegram/webhook', async (c) => {
    if (config.botMode !== 'webhook' || c.req.header('X-Telegram-Bot-Api-Secret-Token') !== config.webhookSecret) throw notFound()
    const update = (await c.req.json()) as TelegramUpdate
    try {
      await handleUpdate(update, { db, bot, links })
    } catch (e) {
      // ответ 200 в любом случае: иначе Telegram будет присылать то же обновление снова
      console.error('telegram update failed', e)
    }
    return c.json({ ok: true })
  })

  // пользователь ответил на «Разрешить боту писать?» в мини-аппе
  r.post('/api/me/bot-access', async (c) => {
    const user = requireUser(c)
    const { allowed } = botAccessInput.parse(await c.req.json())
    await db.update(users).set({ writeAccess: allowed }).where(eq(users.id, user.id))
    return c.json({ write_access: allowed })
  })

  return r
}
