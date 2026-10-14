// Запуск сервера: настройки, база и миграции, HTTP.
import { serve } from '@hono/node-server'
import { createApp } from '~/app'
import { loadConfig } from '~/config'
import { migrate, openDatabase } from '~/db/client'
import { telegramNotifier } from '~/lib/bot'

const config = loadConfig()
const database = await openDatabase(config.databaseUrl || undefined, config.databaseUrl ? undefined : config.dataDir)
const applied = await migrate(database)
if (applied.length) console.log('migrations applied:', applied.join(', '))
if (!config.databaseUrl) console.log(`PGlite: ${config.dataDir} (DATABASE_URL не задан — только для разработки)`)
if (config.devAuth) console.warn('NIDOKI_DEV_AUTH=1: вход тестовым пользователем без Telegram. На проде не включать')

const app = createApp({ db: database.db, config, now: () => new Date(), notify: telegramNotifier(config.botToken) })
const server = serve({ fetch: app.fetch, port: config.port, hostname: '127.0.0.1' }, ({ port }) => {
  console.log(`nidoki backend: http://127.0.0.1:${port}`)
})

/** Аккуратная остановка: дождаться запросов и закрыть базу */
async function shutdown() {
  server.close()
  await database.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
