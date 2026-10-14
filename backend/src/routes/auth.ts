// Вход: фронт присылает initData из Telegram, сервер проверяет подпись и выдаёт токен.
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { AppDeps, AppEnv } from '~/app'
import { validateInitData, type TelegramUser } from '~/auth/telegram'
import { issueToken } from '~/auth/session'
import { masters, users } from '~/db/schema'
import { unauthorized } from '~/lib/errors'
import { authInput } from '~/lib/validation'

/** Тестовый пользователь режима просмотра (NIDOKI_DEV_AUTH=1): тот же id, что у мока на фронте */
export const DEV_USER: TelegramUser = { id: 1000001, first_name: 'Preview', language_code: 'ru' }

/**
 * Маршруты входа.
 * @param deps зависимости приложения
 */
export function authRoutes({ db, config, now }: AppDeps) {
  const r = new Hono<AppEnv>()

  // POST /api/auth/telegram { initData } → { token, user, master }
  r.post('/api/auth/telegram', async (c) => {
    const { initData } = authInput.parse(await c.req.json())
    let tgUser: TelegramUser
    if (initData === 'dev' && config.devAuth) {
      tgUser = DEV_USER
    } else {
      try {
        tgUser = validateInitData(initData, config.botToken, Math.floor(now().getTime() / 1000)).user
      } catch {
        throw unauthorized('init_data_invalid')
      }
    }

    const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').slice(0, 100)
    const languageCode = (tgUser.language_code ?? '').slice(0, 10)
    // имя и язык обновляем при каждом входе: человек мог сменить их в Telegram
    const [user] = await db
      .insert(users)
      .values({ telegramId: tgUser.id, name, languageCode })
      .onConflictDoUpdate({ target: users.telegramId, set: { name, languageCode } })
      .returning()
    const [master] = await db.select({ id: masters.id }).from(masters).where(eq(masters.userId, user.id))

    return c.json({
      token: await issueToken({ id: user.id, telegramId: user.telegramId }, config.jwtSecret, now()),
      user: { id: user.id, telegram_id: user.telegramId, name: user.name },
      master: master?.id ?? null,
    })
  })

  return r
}
