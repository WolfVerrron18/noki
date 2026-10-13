// Часы одного рабочего дня в понятном мастеру виде: начало, конец и перерывы.
// В данных это массив интервалов: [[10:00,13:00],[14:00,17:00],[17:30,20:00]] — день с двумя перерывами.

import type { TimeRange } from '@/api/types'
import { toMinutes } from '@/utils/time'

/** Часы рабочего дня */
export interface DayHours {
  /** Начало дня "HH:MM" */
  from: string
  /** Конец дня "HH:MM" */
  to: string
  /** Перерывы [начало, конец] по порядку; пусто — без перерывов */
  pauses: TimeRange[]
}

/** Часы по умолчанию для нового дня */
export const DEFAULT_HOURS: DayHours = { from: '10:00', to: '19:00', pauses: [] }

/**
 * Предложить следующий перерыв: час после последнего перерыва (или в середине дня), в пределах дня.
 * @param h часы дня
 */
export function suggestPause(h: DayHours): TimeRange {
  const start = toMinutes(h.from)
  const end = toMinutes(h.to)
  const after = h.pauses.length ? toMinutes(h.pauses[h.pauses.length - 1][1]) + 60 : Math.round((start + end) / 2 / 60) * 60
  const a = Math.min(Math.max(after, start + 30), end - 60)
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  return [fmt(a), fmt(Math.min(a + 60, end - 30))]
}

/**
 * DayHours → интервалы для хранения.
 * @param h часы дня
 */
export function toRanges(h: DayHours): TimeRange[] {
  const pauses = [...h.pauses].sort((x, y) => toMinutes(x[0]) - toMinutes(y[0]))
  const ranges: TimeRange[] = []
  let cursor = h.from
  for (const [a, b] of pauses) {
    ranges.push([cursor, a])
    cursor = b
  }
  ranges.push([cursor, h.to])
  return ranges
}

/**
 * Интервалы из данных → DayHours: промежутки между интервалами — перерывы.
 * @param ranges интервалы дня
 * @returns часы или null, если день выходной
 */
export function fromRanges(ranges: TimeRange[] | undefined): DayHours | null {
  if (!ranges?.length) return null
  const pauses: TimeRange[] = []
  for (let i = 1; i < ranges.length; i++) pauses.push([ranges[i - 1][1], ranges[i][0]])
  return { from: ranges[0][0], to: ranges[ranges.length - 1][1], pauses }
}

/** Что не так с часами дня — ключ i18n, или null, если всё хорошо */
export type DayHoursError = 'onboarding.hours.invalid' | 'hours.pauseInvalid' | 'hours.pauseOverlap' | null

/**
 * Проверить часы: конец позже начала, каждый перерыв внутри дня, перерывы не пересекаются.
 * @param h часы дня
 */
export function validateDayHours(h: DayHours): DayHoursError {
  if (!h.from || !h.to || toMinutes(h.to) <= toMinutes(h.from)) return 'onboarding.hours.invalid'
  const start = toMinutes(h.from)
  const end = toMinutes(h.to)
  const sorted = [...h.pauses].sort((x, y) => toMinutes(x[0]) - toMinutes(y[0]))
  for (const [a, b] of sorted) {
    if (!a || !b || toMinutes(a) <= start || toMinutes(b) >= end || toMinutes(b) <= toMinutes(a)) return 'hours.pauseInvalid'
  }
  for (let i = 1; i < sorted.length; i++) {
    if (toMinutes(sorted[i][0]) <= toMinutes(sorted[i - 1][1])) return 'hours.pauseOverlap'
  }
  return null
}

/**
 * «09:30» → «9:30», «10:00» → «10».
 * @param v время "HH:MM"
 */
export function shortTime(v: string): string {
  return v.replace(/^0(?=\d)/, '').replace(/:00$/, '')
}

/**
 * «10–19» для интервала.
 * @param range интервал
 */
export function shortRange([a, b]: TimeRange): string {
  return `${shortTime(a)}–${shortTime(b)}`
}

/**
 * Ключ для сравнения одинаковых дней.
 * @param ranges интервалы дня
 */
export function rangesKey(ranges: TimeRange[]): string {
  return ranges.map((r) => r.join('-')).join('|')
}

/** Какое поле часов дня редактируется: начало, конец или край перерыва с индексом */
export type HoursField = 'from' | 'to' | { pause: number; side: 0 | 1 }

/**
 * Можно ли поставить время в поле так, чтобы не нарушить правила `validateDayHours`.
 * Проверяются только связи самого поля, поэтому уже ошибочные соседние перерывы не блокируют всё подряд.
 * @param h часы дня
 * @param field редактируемое поле
 * @param v время "HH:MM"
 */
export function allowedTime(h: DayHours, field: HoursField, v: string): boolean {
  const m = toMinutes(v)
  const from = toMinutes(h.from)
  const to = toMinutes(h.to)
  const pauses = h.pauses.map(([a, b]) => [toMinutes(a), toMinutes(b)] as const)
  if (field === 'from') return m < to && pauses.every(([a]) => a > m)
  if (field === 'to') return m > from && pauses.every(([, b]) => b < m)
  const own = pauses[field.pause]
  const [a, b] = field.side === 0 ? [m, own[1]] : [own[0], m]
  if (a <= from || b >= to || b <= a) return false
  // касание тоже считается пересечением — как в validateDayHours
  return pauses.every(([pa, pb], j) => j === field.pause || b < pa || a > pb)
}
