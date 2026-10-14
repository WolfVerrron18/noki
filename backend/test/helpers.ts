// Тестовое приложение: PGlite в памяти, свои часы, бот-заглушка, вход подписанным initData.
import { createApp } from '~/app'
import type { Config } from '~/config'
import { migrate, openDatabase, type Database } from '~/db/client'
import { signInitData } from '~/auth/telegram'
import type { Bot, BotMessage } from '~/bot/api'
import type { EnumLegalDoc } from '@/api/types'
import { currentVersions } from '@/legal/documents'

export const BOT_TOKEN = 'test-bot-token'
export const WEBHOOK_SECRET = 'test-webhook-secret-123'

/** Тестовое окружение */
export interface TestEnv {
  /** Открытая база */
  database: Database
  /** Запрос к API: тело — объектом, ответ — статус и JSON */
  call: (method: string, path: string, opts?: { token?: string; body?: unknown; headers?: Record<string, string> }) => Promise<{ status: number; body: any }>
  /** Войти пользователем Telegram, вернуть токен */
  login: (telegramId: number, firstName?: string, extra?: { language_code?: string; allows_write_to_pm?: boolean }) => Promise<string>
  /** Принять документы в текущей редакции */
  accept: (token: string, docs: EnumLegalDoc[]) => Promise<void>
  /** Перевести часы */
  setNow: (iso: string) => void
  /** Отправленные ботом сообщения */
  sent: { chatId: string | number; message: BotMessage }[]
}

/**
 * Поднять приложение с чистой базой.
 * @param nowIso начальный момент «сейчас»
 */
export async function testEnv(nowIso: string): Promise<TestEnv> {
  const database = await openDatabase(undefined)
  await migrate(database)
  let now = new Date(nowIso)
  const sent: TestEnv['sent'] = []
  const config: Config = {
    port: 0,
    databaseUrl: '',
    dataDir: '',
    jwtSecret: 'test-secret',
    botToken: BOT_TOKEN,
    botUsername: 'nidoki_bot',
    appShortName: 'app',
    botMode: 'webhook',
    publicUrl: 'https://nidoki.test',
    webhookSecret: WEBHOOK_SECRET,
    feedbackChatId: '42',
    devAuth: true,
  }
  const bot: Bot = { send: async (chatId, message) => (sent.push({ chatId, message }), true) }
  const app = createApp({ db: database.db, config, now: () => now, bot })

  const call: TestEnv['call'] = async (method, path, { token, body, headers: extraHeaders } = {}) => {
    const headers: Record<string, string> = { ...extraHeaders }
    if (token) headers.Authorization = `Bearer ${token}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await app.request(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
  }

  const login: TestEnv['login'] = async (telegramId, firstName = 'User', extra = {}) => {
    const initData = signInitData({ auth_date: String(Math.floor(now.getTime() / 1000)), user: { id: telegramId, first_name: firstName, ...extra } }, BOT_TOKEN)
    const res = await call('POST', '/api/auth/telegram', { body: { initData } })
    if (res.status !== 200) throw new Error(`login failed: ${res.status}`)
    return res.body.token
  }

  const accept: TestEnv['accept'] = async (token, docs) => {
    const res = await call('POST', '/api/legal/consents', { token, body: { documents: currentVersions(docs) } })
    if (res.status !== 200) throw new Error(`accept failed: ${res.status}`)
  }

  return { database, call, login, accept, setNow: (iso) => (now = new Date(iso)), sent }
}

/** Профиль мастера для тестов: Москва, пн–пт 10–19, сетка 30 минут */
export const MASTER = {
  name: 'Анна',
  slug: 'anna',
  timezone: 'Europe/Moscow',
  slot_step_min: 30,
  schedule_mode: 'weekly',
  work_hours: { 1: [['10:00', '19:00']], 2: [['10:00', '19:00']], 3: [['10:00', '19:00']], 4: [['10:00', '19:00']], 5: [['10:00', '19:00']] },
  day_overrides: {},
  hour_templates: [],
  slot_mode: 'grid',
  work_slots: {},
  slot_overrides: {},
  slot_templates: [],
  mascot: { head: 'crown' },
  theme: 'lavender',
}

/** Услуга для тестов: час, 1800 */
export const SERVICE = { name: 'Брови', duration_min: 60, price: 1800, is_active: true, description: '', category: 'brows' }
