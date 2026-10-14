// Запуск сервера: настройки, база и миграции, бот, HTTP.
import { serve } from '@hono/node-server'
import { createApp, linksOf } from '~/app'
import { loadConfig } from '~/config'
import { migrate, openDatabase } from '~/db/client'
import { botApi, telegramBot } from '~/bot/api'
import { notifications } from '~/bot/notify'
import { sendReminders } from '~/bot/reminders'
import { REMINDER_TICK_MS, setupBot, startPolling } from '~/bot/runtime'
import { handleUpdate } from '~/bot/updates'

const config = loadConfig()
const database = await openDatabase(config.databaseUrl || undefined, config.databaseUrl ? undefined : config.dataDir)
const applied = await migrate(database)
if (applied.length) console.log('migrations applied:', applied.join(', '))
if (!config.databaseUrl) console.log(`PGlite: ${config.dataDir} (DATABASE_URL не задан — только для разработки)`)
if (config.devAuth) console.warn('NIDOKI_DEV_AUTH=1: вход тестовым пользователем без Telegram. На проде не включать')

// без токена бот молчит: сообщения не отправляются, приложение работает как обычно
const call = config.botToken ? botApi(config.botToken) : null
const bot = telegramBot(call)
const links = linksOf(config)
const db = database.db
const now = () => new Date()

const app = createApp({ db, config, now, bot })
const server = serve({ fetch: app.fetch, port: config.port, hostname: '127.0.0.1' }, ({ port }) => {
  console.log(`nidoki backend: http://127.0.0.1:${port}`)
})

let stopPolling = () => {}
if (call && config.botMode !== 'off') {
  try {
    await setupBot(call, config)
    console.log(`bot: ${config.botMode}`)
    if (config.botMode === 'polling') stopPolling = startPolling(call, (u) => handleUpdate(u, { db, bot, links }))
  } catch (e) {
    console.error('bot setup failed:', (e as Error).message)
  }
}

// напоминания клиенткам — раз в минуту; бот не настроен — уведомления просто не отправляются
const notify = notifications(db, bot, links)
const reminderTimer = setInterval(() => {
  sendReminders(db, notify, now()).catch((e) => console.error('reminders failed', e))
}, REMINDER_TICK_MS)

/** Аккуратная остановка: опрос, таймер, HTTP, база */
async function shutdown() {
  stopPolling()
  clearInterval(reminderTimer)
  server.close()
  await database.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
