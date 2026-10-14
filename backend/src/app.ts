// Сборка HTTP-приложения: зависимости передаются снаружи, поэтому тесты подставляют свою базу и часы.
import { Hono } from 'hono'
import { ZodError } from 'zod'
import type { Config } from '~/config'
import type { Db } from '~/db/client'
import { HttpError } from '~/lib/errors'
import { readUser } from '~/auth/session'
import type { Notifier } from '~/lib/bot'
import { authRoutes } from '~/routes/auth'
import { masterRoutes } from '~/routes/masters'
import { serviceRoutes } from '~/routes/services'
import { appointmentRoutes } from '~/routes/appointments'
import { feedbackRoutes } from '~/routes/feedback'
import { legalRoutes } from '~/routes/legal'

/** Всё, что нужно обработчикам */
export interface AppDeps {
  /** База */
  db: Db
  /** Настройки */
  config: Config
  /** Текущий момент: в тестах — подменённые часы */
  now: () => Date
  /** Сообщения от бота */
  notify: Notifier
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
 * Создать приложение.
 * @param deps база, настройки, часы, бот
 */
export function createApp(deps: AppDeps): Hono<AppEnv> {
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
  app.route('/', authRoutes(deps))
  app.route('/', masterRoutes(deps))
  app.route('/', serviceRoutes(deps))
  app.route('/', appointmentRoutes(deps))
  app.route('/', feedbackRoutes(deps))
  app.route('/', legalRoutes(deps))
  return app
}
