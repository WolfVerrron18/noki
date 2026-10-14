// Настройки сервера из переменных окружения (.env.example — список с пояснениями)

/** Как бот получает сообщения: off — никак, polling — сам спрашивает Telegram (разработка), webhook — Telegram присылает на наш адрес */
export type BotMode = 'off' | 'polling' | 'webhook'

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
  /** Имя бота без @: ссылки на мини-апп в сообщениях */
  botUsername: string
  /** Короткое имя мини-аппа из BotFather (t.me/<бот>/<имя>) */
  appShortName: string
  /** Как бот получает сообщения */
  botMode: BotMode
  /** Публичный адрес сервиса (https://…): вебхук и кнопка меню бота */
  publicUrl: string
  /** Секрет вебхука: Telegram присылает его в заголовке, чужие запросы отбрасываем */
  webhookSecret: string
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
 * @throws Error, если на проде не хватает обязательных настроек
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const mode = env.BOT_MODE
  const config: Config = {
    port: Number(env.PORT) || 8090,
    databaseUrl: env.DATABASE_URL ?? '',
    dataDir: env.PGLITE_DIR || './data/pglite',
    jwtSecret: env.JWT_SECRET || DEV_JWT_SECRET,
    botToken: env.TELEGRAM_BOT_TOKEN ?? '',
    botUsername: (env.BOT_USERNAME ?? 'nidoki_bot').replace(/^@/, ''),
    appShortName: env.APP_SHORT_NAME || 'app',
    botMode: mode === 'polling' || mode === 'webhook' ? mode : 'off',
    publicUrl: (env.PUBLIC_URL ?? '').replace(/\/$/, ''),
    webhookSecret: env.TELEGRAM_WEBHOOK_SECRET ?? '',
    feedbackChatId: env.FEEDBACK_CHAT_ID ?? '',
    devAuth: env.NIDOKI_DEV_AUTH === '1',
  }
  // на проде (своя база) — только настоящий секрет
  if (config.databaseUrl && (config.jwtSecret === DEV_JWT_SECRET || config.jwtSecret === 'change-me')) {
    throw new Error('JWT_SECRET не задан: на проде нужен свой длинный секрет')
  }
  if (config.botMode !== 'off' && !config.botToken) throw new Error(`BOT_MODE=${config.botMode}, но TELEGRAM_BOT_TOKEN не задан`)
  if (config.botMode === 'webhook' && (!config.publicUrl.startsWith('https://') || config.webhookSecret.length < 16)) {
    throw new Error('BOT_MODE=webhook: нужны PUBLIC_URL (https://…) и TELEGRAM_WEBHOOK_SECRET (от 16 символов)')
  }
  return config
}
