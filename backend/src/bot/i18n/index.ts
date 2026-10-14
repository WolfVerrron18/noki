// Словари бота: язык — из Telegram пользователя (users.language_code), по умолчанию русский
import ru from '~/bot/i18n/ru'
import en from '~/bot/i18n/en'

/** Структура словаря. Эталон — ru */
export type BotMessages = typeof ru

/** Языки бота */
export type BotLang = 'ru' | 'en'

const DICTS: Record<BotLang, BotMessages> = { ru, en }

/**
 * Язык бота по коду Telegram: английский для en*, иначе русский.
 * @param code language_code из Telegram
 */
export function botLang(code: string | null | undefined): BotLang {
  return code?.toLowerCase().startsWith('en') ? 'en' : 'ru'
}

/** Ключи-листья словаря: 'master.booked', 'field.note' … */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** Ключ текста бота */
export type BotKey = Leaves<BotMessages>

/**
 * Текст бота.
 * @param lang язык
 * @param key ключ
 * @param params значения для {параметров}
 */
export function bt(lang: BotLang, key: BotKey, params: Record<string, string | number> = {}): string {
  const raw = key.split('.').reduce<unknown>((node, k) => (node as Record<string, unknown>)?.[k], DICTS[lang]) as string
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}
