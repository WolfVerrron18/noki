import { createI18n } from 'vue-i18n'
import ru from '@/i18n/locales/ru'
import en from '@/i18n/locales/en'
import { tg } from '@/telegram'

/** Структура словаря. Эталон — ru, остальные локали обязаны ей соответствовать */
export type Messages = typeof ru
/** Поддерживаемые языки интерфейса */
export const SUPPORTED_LOCALES = ['ru', 'en'] as const
/** Код поддерживаемого языка */
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** Язык: ?lang= в адресе (для проверки), затем профиль Telegram, затем браузер; по умолчанию — ru */
function detectLocale(): Locale {
  const raw =
    new URLSearchParams(location.search).get('lang') || tg?.initDataUnsafe.user?.language_code || navigator.language || 'ru'
  const code = raw.slice(0, 2).toLowerCase()
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? (code as Locale) : 'ru'
}

/** Русские формы: 0 — «нет», 1 — «услуга», 2 — «услуги», 3 — «услуг» */
function ruPlural(n: number): number {
  if (n === 0) return 0
  const d10 = n % 10
  const d100 = n % 100
  if (d10 === 1 && d100 !== 11) return 1
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return 2
  return 3
}

export const i18n = createI18n<[Messages], Locale, false>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'ru',
  messages: { ru, en },
  pluralRules: { ru: ruPlural },
})
