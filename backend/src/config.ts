// Настройки сервера из переменных окружения (.env.example — список с пояснениями)

/** Настройки сервера */
export interface Config {
  /** Порт HTTP */
  port: number
  /** Адрес PostgreSQL; пусто — PGlite в dataDir */
  databaseUrl: string
  /** Папка PGlite для разработки */
  dataDir: string
  /** Секрет подписи токенов входа */
  jwtSecret: string
  /** Токен бота: проверка initData и сообщения */
  botToken: string
  /** Чат разработчика для пересылки отзывов; пусто — не пересылаем */
  feedbackChatId: string
  /** Вход тестовым пользователем без Telegram (initData = "dev") */
  devAuth: boolean
}

/** Секрет по умолчанию: годится только для разработки, на проде сервер с ним не стартует */
export const DEV_JWT_SECRET = 'nidoki-dev-secret'

/**
 * Прочитать настройки.
 * @param env переменные окружения
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const config: Config = {
    port: Number(env.PORT) || 8090,
    databaseUrl: env.DATABASE_URL ?? '',
    dataDir: env.PGLITE_DIR || './data/pglite',
    jwtSecret: env.JWT_SECRET || DEV_JWT_SECRET,
    botToken: env.TELEGRAM_BOT_TOKEN ?? '',
    feedbackChatId: env.FEEDBACK_CHAT_ID ?? '',
    devAuth: env.NIDOKI_DEV_AUTH === '1',
  }
  // на проде (своя база) — только настоящий секрет и без тестового входа
  if (config.databaseUrl && (config.jwtSecret === DEV_JWT_SECRET || config.jwtSecret === 'change-me')) {
    throw new Error('JWT_SECRET не задан: на проде нужен свой длинный секрет')
  }
  return config
}
