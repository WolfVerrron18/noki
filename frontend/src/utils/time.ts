import type { SelectOption } from '@/components/ui/types'

// Часовые пояса России + текущий пояс устройства
const RU_TIMEZONES = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Novosibirsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
]

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
  } catch {
    return 'Europe/Moscow'
  }
}

/** Смещение пояса относительно UTC в минутах на текущий момент */
function offsetMinutes(tz: string): number {
  const now = new Date()
  const local = new Date(now.toLocaleString('en-US', { timeZone: tz }))
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  return Math.round((local.getTime() - utc.getTime()) / 60000)
}

function formatOffset(min: number): string {
  const sign = min >= 0 ? '+' : '-'
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`
}

/** Список поясов для выбора, отсортирован по смещению */
export function timezoneOptions(locale: string): SelectOption[] {
  const zones = Array.from(new Set([...RU_TIMEZONES, deviceTimezone()]))
  return zones
    .map((tz) => ({ tz, off: offsetMinutes(tz) }))
    .sort((a, b) => a.off - b.off)
    .map(({ tz, off }) => {
      let city = tz.split('/').pop()!.replace(/_/g, ' ')
      try {
        // название города на языке интерфейса, если браузер умеет
        const name = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'longGeneric' })
          .formatToParts(new Date())
          .find((p) => p.type === 'timeZoneName')?.value
        if (name) city = name
      } catch {
        // остаётся название из идентификатора
      }
      return { value: tz, label: `${formatOffset(off)} · ${city}` }
    })
}

/** "HH:MM" → минуты от начала суток */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
