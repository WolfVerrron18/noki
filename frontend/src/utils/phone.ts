import { AsYouType, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'

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

/** Номер, разобранный на код страны и номер внутри страны */
export interface PhoneParts {
  /** Код страны без «+»: «7» */
  code: string
  /** Цифры номера внутри страны, без кода: «9270576065» */
  national: string
}

/** Длиннее номеров не бывает (E.164 — до 15 цифр вместе с кодом) */
const MAX_DIGITS = 15

/**
 * Разобрать номер в любой записи на код страны и номер внутри страны.
 * Понимает вставку «89270576065», «79270576065», «+7 (927) 057-60-65», «8-(927)-057-60-65», «007 927…»
 * и набор по цифре: пока номер неполный, цифры остаются как есть.
 * @param value введённый или вставленный текст
 * @param country страна по умолчанию: её код, если в номере нет своего
 */
export function splitPhone(value: string, country: CountryCode): PhoneParts {
  const fallback = getCountryCallingCode(country)
  let digits = value.replace(/\D/g, '')
  let plus = value.trim().startsWith('+')
  // «00» — международный выход, то же, что «+»
  if (!plus && digits.startsWith('00')) {
    digits = digits.slice(2)
    plus = true
  }
  digits = digits.slice(0, MAX_DIGITS)
  if (!digits) return { code: fallback, national: '' }

  if (plus) {
    const parsed = parsePhoneNumberFromString(`+${digits}`)
    if (parsed) return { code: parsed.countryCallingCode, national: digits.slice(parsed.countryCallingCode.length) }
    // код ещё не набран целиком («+7» или «+3»): считаем, что это наш
    return { code: fallback, national: digits.startsWith(fallback) ? digits.slice(fallback.length) : digits }
  }

  // без «+»: «8 927…» и «7 927…» для России, просто номер — по стране по умолчанию
  const parsed = parsePhoneNumberFromString(digits, country)
  if (parsed?.isValid()) return { code: parsed.countryCallingCode, national: parsed.nationalNumber }
  return { code: fallback, national: digits.slice(0, MAX_DIGITS - fallback.length) }
}

/**
 * Номер внутри страны с маской: «927 057 60 65».
 * @param parts код и цифры номера
 */
export function formatNational({ code, national }: PhoneParts): string {
  if (!national) return ''
  const full = new AsYouType().input(`+${code}${national}`)
  // маска рассчитана на номер целиком: отрезаем «+7» спереди
  return full.startsWith(`+${code}`) ? full.slice(code.length + 1).trim() : national
}

/**
 * Номер целиком для показа и отправки: «+7 927 057 60 65»; пустой — пустая строка.
 * @param parts код и цифры номера
 */
export function joinPhone(parts: PhoneParts): string {
  return parts.national ? `+${parts.code} ${formatNational(parts)}` : ''
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
