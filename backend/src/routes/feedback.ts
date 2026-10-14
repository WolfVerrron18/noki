// Отзывы: сохраняем и пересылаем разработчику через бота.
import { Hono } from 'hono'
import type { AppDeps, AppEnv } from '~/app'
import { requireUser } from '~/auth/session'
import { feedback } from '~/db/schema'
import { feedbackInput } from '~/lib/validation'

/**
 * Маршруты отзывов.
 * @param deps зависимости приложения
 */
export function feedbackRoutes({ db, config, notify }: AppDeps) {
  const r = new Hono<AppEnv>()

  r.post('/api/feedback', async (c) => {
    const user = requireUser(c)
    const { text, role } = feedbackInput.parse(await c.req.json())
    await db.insert(feedback).values({ authorTelegramId: user.telegramId, role, text })
    // сообщение разработчику — служебное, на русском, без словарей бота
    await notify(config.feedbackChatId, `Отзыв (${role === 'master' ? 'мастер' : 'клиентка'}, tg ${user.telegramId}):\n\n${text}`)
    return c.body(null, 204)
  })

  return r
}
