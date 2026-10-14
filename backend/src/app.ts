// Сборка HTTP-приложения: зависимости передаются снаружи, поэтому тесты подставляют свою базу, часы и бота.
import { Hono } from 'hono'
import { ZodError } from 'zod'
import type { Config } from '~/config'
import type { Db } from '~/db/client'
import { HttpError } from '~/lib/errors'
import { readUser } from '~/auth/session'
import type { Bot } from '~/bot/api'
import type { AppLinks } from '~/bot/messages'
import { notifications, type Notifications } from '~/bot/notify'
import { authRoutes } from '~/routes/auth'
import { masterRoutes } from '~/routes/masters'
import { serviceRoutes } from '~/routes/services'
import { appointmentRoutes } from '~/routes/appointments'
import { feedbackRoutes } from '~/routes/feedback'
import { legalRoutes } from '~/routes/legal'
import { telegramRoutes } from '~/routes/telegram'

/** Внешние зависимости приложения */
export interface AppDeps {
  /** База */
  db: Db
  /** Настройки */
  config: Config
  /** Текущий момент: в тестах — подменённые часы */
  now: () => Date
  /** Бот: в тестах — заглушка, которая запоминает сообщения */
  bot: Bot
}

/** Всё, что нужно обработчикам: зависимости и собранные из них сервисы */
export interface AppContext extends AppDeps {
  /** Уведомления о записях */
  notify: Notifications
  /** Ссылки на мини-апп для кнопок бота */
  links: AppLinks
}

/** Кто делает запрос: из токена входа */
export interface AuthUser {
  /** id в users */
  id: string
  /** Telegram id */
  telegramId: number
}

/** Типы контекста Hono */
export interface AppEnv {
  Variables: {
    /** Пользователь из токена; null — без входа */
    user: AuthUser | null
  }
}

/**
 * Ссылки на мини-апп из настроек.
 * @param config настройки
 */
export const linksOf = (config: Config): AppLinks => ({ bot: config.botUsername, app: config.appShortName })

/**
 * Создать приложение.
 * @param deps база, настройки, часы, бот
 */
export function createApp(deps: AppDeps): Hono<AppEnv> {
  const links = linksOf(deps.config)
  const ctx: AppContext = { ...deps, links, notify: notifications(deps.db, deps.bot, links) }
  const app = new Hono<AppEnv>()

  app.onError((err, c) => {
    if (err instanceof HttpError) return c.json({ error: err.code }, err.status)
    if (err instanceof ZodError) return c.json({ error: 'invalid', issues: err.issues.map((i) => i.path.join('.') + ': ' + i.message) }, 400)
    if (err instanceof SyntaxError) return c.json({ error: 'bad_json' }, 400)
    console.error(err)
    return c.json({ error: 'internal' }, 500)
  })
  app.notFound((c) => c.json({ error: 'not_found' }, 404))

  app.use('/api/*', readUser(deps.config.jwtSecret, deps.now))
  app.get('/api/health', (c) => c.json({ ok: true }))
  app.route('/', authRoutes(ctx))
  app.route('/', masterRoutes(ctx))
  app.route('/', serviceRoutes(ctx))
  app.route('/', appointmentRoutes(ctx))
  app.route('/', feedbackRoutes(ctx))
  app.route('/', legalRoutes(ctx))
  app.route('/', telegramRoutes(ctx))
  return app
}
