// Бот: тексты, уведомления о записях, напоминания, /start через вебхук. Сообщения ловит бот-заглушка.
import { beforeAll, describe, expect, it } from 'vitest'
import { CLIENT_DOCS, MASTER_DOCS } from '@/legal/documents'
import { escapeHtml, renderMessage } from '~/bot/api'
import { formatWhen } from '~/bot/format'
import { botLang, bt } from '~/bot/i18n'
import { notifications } from '~/bot/notify'
import { sendReminders } from '~/bot/reminders'
import type { Bot } from '~/bot/api'
import { MASTER, SERVICE, WEBHOOK_SECRET, testEnv, type TestEnv } from './helpers'

describe('тексты бота', () => {
  it('язык: английский для en*, иначе русский', () => {
    expect(botLang('en-GB')).toBe('en')
    expect(botLang('de')).toBe('ru')
    expect(botLang(undefined)).toBe('ru')
  })

  it('подставляет параметры', () => {
    expect(bt('ru', 'startMaster.text', { master: 'Анна' })).toBe('Запись к мастеру: Анна')
    expect(bt('en', 'field.note', { note: 'x' })).toBe('Note: x')
  })

  it('время — в поясе мастера', () => {
    const at = new Date('2026-10-15T08:00:00Z')
    expect(formatWhen(at, 'Europe/Moscow', 'ru')).toBe('чт, 15 октября, 11:00')
    expect(formatWhen(at, 'Asia/Yekaterinburg', 'en')).toBe('Thu, 15 October, 13:00')
  })

  it('экранирует то, что ввели люди, и пропускает пустые строки', () => {
    expect(escapeHtml('<b>&')).toBe('&lt;b&gt;&amp;')
    expect(renderMessage({ title: 'A<', lines: ['x', '', null, false, 'y>'] })).toBe('<b>A&lt;</b>\nx\ny&gt;')
  })
})

// понедельник 19 октября 2026, 09:00 по Москве
const NOW = '2026-10-19T06:00:00.000Z'

describe('уведомления о записях', () => {
  let env: TestEnv
  let master: string
  let client: string
  let englishClient: string
  let masterId: string
  let serviceId: string

  const book = (token: string, startAt: string) =>
    env.call('POST', '/api/bookings', {
      token,
      body: { masterId, serviceId, startAt, clientName: 'Мария <3', clientPhone: '+7 927 057-60-65', note: 'Потемнее' },
    })
  const last = () => env.sent.splice(0)

  beforeAll(async () => {
    env = await testEnv(NOW)
    // мастер боту ещё не разрешила писать, клиентки — разрешили в мини-аппе
    master = await env.login(111, 'Анна')
    client = await env.login(222, 'Мария', { allows_write_to_pm: true, language_code: 'ru' })
    englishClient = await env.login(333, 'Kate', { allows_write_to_pm: true, language_code: 'en' })
    await env.accept(master, MASTER_DOCS)
    await env.accept(client, CLIENT_DOCS)
    await env.accept(englishClient, CLIENT_DOCS)
    masterId = (await env.call('POST', '/api/masters', { token: master, body: MASTER })).body.id
    serviceId = (await env.call('POST', `/api/masters/${masterId}/services`, { token: master, body: SERVICE })).body.id
  })

  it('мастеру без разрешения не пишем, клиентке — подтверждение', async () => {
    expect((await book(client, '2026-10-19T07:00:00.000Z')).status).toBe(201)
    const sent = last()
    expect(sent).toHaveLength(1)
    expect(sent[0].chatId).toBe(222)
    expect(sent[0].message.title).toBe('Запись подтверждена')
    expect(sent[0].message.lines).toContain('пн, 19 октября, 10:00')
    expect(sent[0].message.buttons?.[0].url).toBe('https://t.me/nidoki_bot/app?startapp=my')
  })

  it('разрешила в мини-аппе — мастер получает новую запись', async () => {
    const res = await env.call('POST', '/api/me/bot-access', { token: master, body: { allowed: true } })
    expect(res.body.write_access).toBe(true)
    expect((await book(englishClient, '2026-10-19T09:00:00.000Z')).status).toBe(201)
    const sent = last()
    const toMaster = sent.find((s) => s.chatId === 111)!
    expect(toMaster.message.title).toBe('Новая запись')
    expect(toMaster.message.lines).toEqual(expect.arrayContaining(['Брови', 'пн, 19 октября, 12:00', 'Мария <3', 'Телефон: +7 927 057 60 65', 'Заметка: Потемнее']))
    expect(toMaster.message.buttons?.[0].url).toBe('https://t.me/nidoki_bot/app?startapp=sc')
    // клиентке — на её языке
    expect(sent.find((s) => s.chatId === 333)!.message.title).toBe('Booking confirmed')
  })

  it('ручная запись сообщений не шлёт', async () => {
    const res = await env.call('POST', '/api/appointments/manual', {
      token: master,
      body: { masterId, serviceId, startAt: '2026-10-19T11:00:00.000Z', clientName: 'Ольга', clientPhone: '', note: '' },
    })
    expect(res.status).toBe(201)
    expect(last()).toHaveLength(0)
  })

  it('отменила клиентка — пишем мастеру', async () => {
    const id = (await book(client, '2026-10-19T13:00:00.000Z')).body.id
    last()
    await env.call('POST', `/api/appointments/${id}/cancel`, { token: client })
    const sent = last()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ chatId: 111, message: { title: 'Клиентка отменила запись' } })
  })

  it('отменила мастер — пишем клиентке, кнопка — выбрать другое время', async () => {
    const id = (await book(client, '2026-10-19T14:00:00.000Z')).body.id
    last()
    await env.call('POST', `/api/appointments/${id}/cancel`, { token: master })
    const sent = last()
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ chatId: 222, message: { title: 'Запись отменена мастером' } })
    expect(sent[0].message.buttons?.[0].url).toBe('https://t.me/nidoki_bot/app?startapp=anna')
  })
})

describe('напоминания', () => {
  let env: TestEnv
  let masterId: string
  let serviceId: string
  let client: string
  const reminders: { chatId: string | number; title: string }[] = []
  const bot: Bot = { send: async (chatId, m) => (reminders.push({ chatId, title: m.title }), true) }

  beforeAll(async () => {
    env = await testEnv(NOW)
    const master = await env.login(111, 'Анна')
    client = await env.login(222, 'Мария', { allows_write_to_pm: true })
    await env.accept(master, MASTER_DOCS)
    await env.accept(client, CLIENT_DOCS)
    masterId = (await env.call('POST', '/api/masters', { token: master, body: MASTER })).body.id
    serviceId = (await env.call('POST', `/api/masters/${masterId}/services`, { token: master, body: SERVICE })).body.id
  })

  const run = (iso: string) => {
    reminders.length = 0
    return sendReminders(env.database.db, notifications(env.database.db, bot, { bot: 'nidoki_bot', app: 'app' }), new Date(iso))
  }
  const book = (startAt: string) =>
    env.call('POST', '/api/bookings', { token: client, body: { masterId, serviceId, startAt, clientName: 'Мария', clientPhone: '+79270576065', note: '' } })

  it('заранее — за сутки, один раз', async () => {
    // понедельник 09:00 записалась на среду 10:00
    expect((await book('2026-10-21T07:00:00.000Z')).status).toBe(201)
    expect(await run('2026-10-20T06:59:00.000Z')).toBe(0)
    expect(await run('2026-10-20T07:01:00.000Z')).toBe(1)
    expect(reminders[0]).toEqual({ chatId: 222, title: 'Напоминаем о записи' })
    expect(await run('2026-10-20T08:00:00.000Z')).toBe(0)
  })

  it('в тот же день — за 2 часа', async () => {
    // понедельник 09:00 записалась на 16:00 того же дня
    expect((await book('2026-10-19T13:00:00.000Z')).status).toBe(201)
    expect(await run('2026-10-19T10:30:00.000Z')).toBe(0)
    expect(await run('2026-10-19T11:05:00.000Z')).toBe(1)
  })

  it('меньше чем за 2 часа — не напоминаем, отменённые — тоже', async () => {
    // 10:00 при «сейчас» 09:00: до записи час — напоминание не нужно
    const soon = (await book('2026-10-19T07:00:00.000Z')).body.id
    const cancelled = (await book('2026-10-22T07:00:00.000Z')).body.id
    await env.call('POST', `/api/appointments/${cancelled}/cancel`, { token: client })
    expect(soon).toBeTruthy()
    expect(await run('2026-10-19T06:30:00.000Z')).toBe(0)
    expect(await run('2026-10-21T07:30:00.000Z')).toBe(0)
  })
})

describe('вебхук и /start', () => {
  let env: TestEnv

  beforeAll(async () => {
    env = await testEnv(NOW)
    const master = await env.login(111, 'Анна')
    await env.accept(master, MASTER_DOCS)
    await env.call('POST', '/api/masters', { token: master, body: MASTER })
  })

  const update = (text: string, from = { id: 555, first_name: 'Лена', language_code: 'ru' }) => ({ update_id: 1, message: { text, from } })
  const hook = (body: unknown, secret = WEBHOOK_SECRET) =>
    env.call('POST', '/api/telegram/webhook', { body, headers: { 'X-Telegram-Bot-Api-Secret-Token': secret } })

  it('без секрета — 404', async () => {
    expect((await hook(update('/start'), 'wrong')).status).toBe(404)
    expect(env.sent).toHaveLength(0)
  })

  it('/start — приветствие и кнопки, писать теперь можно', async () => {
    expect((await hook(update('/start'))).status).toBe(200)
    const msg = env.sent.splice(0)[0]
    expect(msg.chatId).toBe(555)
    expect(msg.message.title).toBe('Привет! Я Nidoki')
    expect(msg.message.buttons?.map((b) => b.url)).toEqual(['https://t.me/nidoki_bot/app', 'https://t.me/nidoki_bot/app?startapp=my'])
    // после /start вход в мини-апп сообщает, что бот может писать
    const login = await env.call('POST', '/api/auth/telegram', { body: { initData: 'dev' } })
    expect(login.body.write_access).toBe(false)
  })

  it('/start <адрес мастера> — кнопка записи к ней', async () => {
    await hook(update('/start anna', { id: 556, first_name: 'Kate', language_code: 'en' }))
    const msg = env.sent.splice(0)[0]
    expect(msg.message.title).toBe('Book with Анна')
    expect(msg.message.buttons?.[0].url).toBe('https://t.me/nidoki_bot/app?startapp=anna')
  })

  it('другие сообщения бот не трогает', async () => {
    await hook(update('привет'))
    expect(env.sent).toHaveLength(0)
  })
})
