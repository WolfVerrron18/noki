// Точное время записи: день — это список времён начала "HH:MM" по возрастанию (режим EnumSlotMode.Fixed).

import type { TimeRange } from '@/api/types'
import { shortTime } from '@/utils/hours'
import { toMinutes } from '@/utils/time'

/** Времена по умолчанию для нового дня */
export const DEFAULT_TIMES: string[] = ['10:00', '12:00', '14:00', '16:00']

/** Последнее время, которое можно предложить */
const LAST_MIN = 23 * 60 + 45

/** Шаг до следующего предложенного времени, минуты */
const SUGGEST_GAP_MIN = 120

/**
 * Минуты от начала суток → "HH:MM".
 * @param m минуты
 */
function fromMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Времена по возрастанию, без повторов.
 * @param times времена "HH:MM"
 */
export function sortTimes(times: string[]): string[] {
  return [...new Set(times)].sort()
}

/**
 * Предложить следующее время: через два часа после последнего (или 10:00 для пустого дня).
 * @param times уже заданные времена
 * @returns время или null, если до конца суток места нет
 */
export function suggestTime(times: string[]): string | null {
  if (!times.length) return DEFAULT_TIMES[0]
  const next = Math.max(...times.map(toMinutes)) + SUGGEST_GAP_MIN
  if (next <= LAST_MIN) return fromMinutes(next)
  // после последнего места нет — ближайший свободный час с начала дня
  for (let m = 8 * 60; m <= LAST_MIN; m += 60) {
    const v = fromMinutes(m)
    if (!times.includes(v)) return v
  }
  return null
}

/**
 * Подпись дня в календаре: «10:30 +3».
 * @param times времена дня
 */
export function timesCellLabel(times: string[]): string {
  return times.length > 1 ? `${shortTime(times[0])} +${times.length - 1}` : shortTime(times[0] ?? '')
}

/**
 * Подпись шаблона: «10:30, 12:30, 15».
 * @param times времена
 */
export function timesLabel(times: string[]): string {
  return times.map(shortTime).join(', ')
}

/**
 * Ключ для сравнения одинаковых наборов времён.
 * @param times времена
 */
export function timesKey(times: string[]): string {
  return sortTimes(times).join('|')
}

/**
 * Первое приближение точного времени из рабочих часов: каждые два часа, пока до конца интервала есть хотя бы час.
 * Нужно, чтобы при переходе на точное время у мастера сразу был заполненный график, а не одни выходные.
 * @param ranges рабочие интервалы дня
 */
export function timesFromRanges(ranges: TimeRange[] | undefined): string[] {
  const times: string[] = []
  for (const [a, b] of ranges ?? []) {
    for (let m = toMinutes(a); m + 60 <= toMinutes(b); m += SUGGEST_GAP_MIN) times.push(fromMinutes(m))
  }
  return sortTimes(times)
}
