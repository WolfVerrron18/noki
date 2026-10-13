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

/** Шаг времени в пикерах часов, минуты */
export const HOURS_STEP = 15

/**
 * Минуты от начала суток → "HH:MM".
 * @param m минуты
 */
function fromMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Перерывы по времени начала.
 * @param pauses перерывы
 */
export function sortPauses(pauses: TimeRange[]): TimeRange[] {
  return [...pauses].sort((x, y) => toMinutes(x[0]) - toMinutes(y[0]))
}

/**
 * Предложить новый перерыв: в самом длинном рабочем отрезке дня, ближе к его середине, по сетке пикера.
 * Перерыв всегда проходит `validateDayHours`: внутри дня и не касается других перерывов.
 * @param h часы дня
 * @returns перерыв или null, если места для него нет
 */
export function suggestPause(h: DayHours): TimeRange | null {
  const start = toMinutes(h.from)
  const end = toMinutes(h.to)
  if (end <= start) return null
  // рабочие отрезки между перерывами
  const bounds = [start, ...sortPauses(h.pauses).flatMap(([a, b]) => [toMinutes(a), toMinutes(b)]), end]
  let best: [number, number] | null = null
  for (let i = 0; i < bounds.length; i += 2) {
    const seg: [number, number] = [bounds[i], bounds[i + 1]]
    if (!best || seg[1] - seg[0] > best[1] - best[0]) best = seg
  }
  if (!best) return null
  // перерыв строго внутри отрезка: с каждой стороны остаётся хотя бы один шаг работы
  const lo = Math.ceil((best[0] + 1) / HOURS_STEP) * HOURS_STEP
  const hi = Math.floor((best[1] - 1) / HOURS_STEP) * HOURS_STEP
  const room = hi - lo
  if (room < 2 * HOURS_STEP) return null
  const duration = room >= 60 ? 60 : 30
  const mid = (lo + hi - duration) / 2
  // ровный час, если он помещается, иначе ближайшее деление сетки
  const hour = Math.round(mid / 60) * 60
  const a = hour >= lo && hour + duration <= hi ? hour : Math.max(lo, Math.round(mid / HOURS_STEP) * HOURS_STEP)
  return [fromMinutes(a), fromMinutes(a + duration)]
}

/**
 * DayHours → интервалы для хранения.
 * @param h часы дня
 */
export function toRanges(h: DayHours): TimeRange[] {
  const pauses = sortPauses(h.pauses)
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
  const sorted = sortPauses(h.pauses)
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

/** Длительность перерыва, если у старого перерыва она неверная (конец не позже начала) */
const FALLBACK_PAUSE_MIN = 30

/**
 * Поставить в перерыв новое время. Начало переносит весь перерыв с той же длительностью
 * (так перерыв можно передвинуть через соседний), конец меняет длительность.
 * @param pause перерыв
 * @param side какой край меняется: 0 — начало, 1 — конец
 * @param v время "HH:MM"
 */
export function setPauseEdge(pause: TimeRange, side: 0 | 1, v: string): TimeRange {
  if (side === 1) return [pause[0], v]
  const length = toMinutes(pause[1]) - toMinutes(pause[0])
  return [v, fromMinutes(toMinutes(v) + (length > 0 ? length : FALLBACK_PAUSE_MIN))]
}

/**
 * Можно ли поставить время в поле так, чтобы не нарушить правила `validateDayHours`.
 * Проверяются только связи самого поля. Перерывы, которые уже пересекаются с редактируемым
 * (старые ошибочные данные), не блокируют выбор, иначе такой перерыв было бы не исправить.
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
  const [oa, ob] = pauses[field.pause]
  const next = setPauseEdge(h.pauses[field.pause], field.side, v)
  const a = toMinutes(next[0])
  const b = toMinutes(next[1])
  if (a <= from || b >= to || b <= a) return false
  // касание тоже считается пересечением — как в validateDayHours
  const touches = (pa: number, pb: number, x: number, y: number) => !(y < pa || x > pb)
  return pauses.every(([pa, pb], j) => j === field.pause || touches(pa, pb, oa, ob) || !touches(pa, pb, a, b))
}
