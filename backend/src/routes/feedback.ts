// Отзывы: сохраняем и пересылаем разработчику через бота.
import { Hono } from 'hono'
import type { AppContext, AppEnv } from '~/app'
import { requireUser } from '~/auth/session'
import { feedback } from '~/db/schema'
import { feedbackInput } from '~/lib/validation'
import { bt } from '~/bot/i18n'

/**
 * Маршруты отзывов.
 * @param deps зависимости приложения
 */
export function feedbackRoutes({ db, config, bot }: AppContext) {
  const r = new Hono<AppEnv>()

  r.post('/api/feedback', async (c) => {
    const user = requireUser(c)
    const { text, role } = feedbackInput.parse(await c.req.json())
    await db.insert(feedback).values({ authorTelegramId: user.telegramId, role, text })
    // сообщение разработчику — служебное, на русском
    if (config.feedbackChatId) {
      await bot.send(config.feedbackChatId, { title: bt('ru', 'feedback', { role: bt('ru', `role.${role}`), tg: user.telegramId }), lines: [text] })
    }
    return c.body(null, 204)
  })

  return r
}
