import { AsYouType, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'

// Телефон: ввод с маской по мере набора, проверка и хранение в E.164 (+79001234567).
// Номер без «+» читается по стране по умолчанию: для России это «8 900 …» и «900 …».

/** Страна по умолчанию, если пояс мастера не подсказал */
const FALLBACK_COUNTRY: CountryCode = 'RU'

/** Пояса, по которым понятна страна */
const TZ_COUNTRY: Record<string, CountryCode> = {
  'Europe/Kaliningrad': 'RU',
  'Europe/Moscow': 'RU',
  'Europe/Samara': 'RU',
  'Asia/Yekaterinburg': 'RU',
  'Asia/Omsk': 'RU',
  'Asia/Novosibirsk': 'RU',
  'Asia/Krasnoyarsk': 'RU',
  'Asia/Irkutsk': 'RU',
  'Asia/Yakutsk': 'RU',
  'Asia/Vladivostok': 'RU',
  'Asia/Magadan': 'RU',
  'Asia/Kamchatka': 'RU',
  'Europe/Minsk': 'BY',
  'Asia/Almaty': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Tbilisi': 'GE',
  'Asia/Yerevan': 'AM',
  'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA',
}

/**
 * Страна для номеров без «+»: клиентки обычно из той же страны, что и мастер.
 * @param tz часовой пояс мастера
 */
export function phoneCountry(tz: string | undefined): CountryCode {
  return (tz && TZ_COUNTRY[tz]) || FALLBACK_COUNTRY
}

/**
 * Отформатировать номер по мере ввода: «89001234567» → «8 (900) 123-45-67».
 * @param value введённый текст
 * @param country страна по умолчанию
 */
export function formatPhoneInput(value: string, country: CountryCode): string {
  // оставляем только то, из чего состоит номер, иначе форматтер сбивается
  const raw = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  if (!raw) return ''
  return new AsYouType(country).input(raw)
}

/**
 * Номер в E.164 или null, если номер неверный.
 * @param value введённый текст
 * @param country страна по умолчанию
 */
export function normalizePhone(value: string, country: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(value.trim(), country)
  return parsed?.isValid() ? parsed.number : null
}

/**
 * Номер из E.164 для показа: «+79001234567» → «+7 900 123 45 67». Неразборчивый — как есть.
 * @param value номер из базы
 */
export function displayPhone(value: string): string {
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value
}
