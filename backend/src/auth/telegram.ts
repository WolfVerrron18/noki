// Проверка initData мини-аппа: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Сколько живёт initData: старые данные не принимаем */
export const INIT_DATA_MAX_AGE_SEC = 24 * 60 * 60

/** Пользователь Telegram из initData */
export interface TelegramUser {
  /** Telegram id */
  id: number
  /** Имя */
  first_name?: string
  /** Фамилия */
  last_name?: string
  /** Язык интерфейса Telegram, например "ru" */
  language_code?: string
}

/** Проверенные данные входа */
export interface InitData {
  /** Кто вошёл */
  user: TelegramUser
  /** Параметр startapp из ссылки: адрес мастера */
  startParam: string
}

/**
 * Проверить подпись и срок initData.
 * @param initData строка Telegram.WebApp.initData как есть
 * @param botToken токен бота
 * @param nowSec текущее время в секундах
 * @returns данные входа
 * @throws Error, если подпись неверная, данные устарели или нет пользователя
 */
export function validateInitData(initData: string, botToken: string, nowSec: number): InitData {
  if (!initData || !botToken) throw new Error('empty initData or bot token')
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('no hash')
  params.delete('hash')

  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expected = createHmac('sha256', secret).update(dataCheck).digest()
  const given = Buffer.from(hash, 'hex')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new Error('bad signature')

  const authDate = Number(params.get('auth_date'))
  if (!authDate || nowSec - authDate > INIT_DATA_MAX_AGE_SEC) throw new Error('initData expired')

  const user = JSON.parse(params.get('user') ?? 'null') as TelegramUser | null
  if (!user?.id) throw new Error('no user')
  return { user, startParam: params.get('start_param') ?? '' }
}

/**
 * Подписать initData как Telegram — для тестов.
 * @param fields поля initData (user — объектом)
 * @param botToken токен бота
 * @returns строка initData
 */
export function signInitData(fields: Record<string, string | object>, botToken: string): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(fields)) params.set(k, typeof v === 'string' ? v : JSON.stringify(v))
  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  params.set('hash', createHmac('sha256', secret).update(dataCheck).digest('hex'))
  return params.toString()
}
