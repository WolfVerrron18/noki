// Расчёт свободных слотов. Сервер (backend/src/lib/slots.ts) импортирует этот же файл,
// там же запись окончательно проверяется, а пересечения запрещает сама база.

import { EnumScheduleMode, EnumSlotMode, type Master, type Service, type TimeRange, type Weekday } from '@/api/types'
import dayjs from '@/utils/date'
import { toMinutes } from '@/utils/time'

/** Формат дня во всём приложении */
export const DAY_FORMAT = 'YYYY-MM-DD'

/** Занятый интервал, ISO в UTC */
export interface BusyRange {
  /** Начало */
  start_at: string
  /** Конец */
  end_at: string
}

/**
 * Местное время мастера → момент в UTC.
 * @param date день "YYYY-MM-DD" в поясе мастера
 * @param minutes минуты от начала этого дня
 * @param tz пояс мастера
 */
export function zonedToUtc(date: string, minutes: number, tz: string): Date {
  return dayjs.tz(date, DAY_FORMAT, tz).add(minutes, 'minute').toDate()
}

/**
 * День "YYYY-MM-DD" в поясе мастера для заданного момента (по умолчанию — сейчас).
 * @param tz пояс мастера
 * @param at момент времени
 */
export function todayIn(tz: string, at: Date = new Date()): string {
  return dayjs(at).tz(tz).format(DAY_FORMAT)
}

/**
 * День "YYYY-MM-DD" плюс n дней.
 * @param date исходный день
 * @param n сколько дней прибавить (может быть отрицательным)
 */
export function addDays(date: string, n: number): string {
  return dayjs.utc(date, DAY_FORMAT).add(n, 'day').format(DAY_FORMAT)
}

/**
 * День недели по ISO для "YYYY-MM-DD".
 * @param date день
 */
export function weekdayOf(date: string): Weekday {
  const js = dayjs.utc(date, DAY_FORMAT).day() // 0 — воскресенье
  return String(js === 0 ? 7 : js) as Weekday
}

/** Часть мастера, нужная для расчёта рабочих часов */
export type ScheduleSource = Pick<Master, 'schedule_mode' | 'work_hours' | 'day_overrides' | 'slot_mode' | 'work_slots' | 'slot_overrides'>

/**
 * Рабочие интервалы мастера на день: отметка на дату важнее шаблона;
 * в режиме «по датам» без отметки — выходной.
 * @param master график мастера
 * @param date день "YYYY-MM-DD"
 */
export function rangesFor(master: ScheduleSource, date: string): TimeRange[] {
  const override = master.day_overrides[date]
  if (override) return override
  return master.schedule_mode === EnumScheduleMode.Dates ? [] : (master.work_hours[weekdayOf(date)] ?? [])
}

/**
 * Точные времена начала записи на день (режим Fixed): отметка на дату важнее шаблона;
 * в режиме «по датам» без отметки — выходной.
 * @param master график мастера
 * @param date день "YYYY-MM-DD"
 */
export function startsFor(master: ScheduleSource, date: string): string[] {
  const override = master.slot_overrides[date]
  if (override) return override
  return master.schedule_mode === EnumScheduleMode.Dates ? [] : (master.work_slots[weekdayOf(date)] ?? [])
}

/**
 * Рабочий ли день — по часам или по точным временам, смотря как мастер принимает запись.
 * @param master график мастера
 * @param date день "YYYY-MM-DD"
 */
export function isWorkDay(master: ScheduleSource, date: string): boolean {
  return master.slot_mode === EnumSlotMode.Fixed ? startsFor(master, date).length > 0 : rangesFor(master, date).length > 0
}

/**
 * Момент по часам мастера. Собирается из строки, а не прибавлением минут к полуночи,
 * чтобы в день перевода часов 10:00 оставалось 10:00.
 * @param date день "YYYY-MM-DD" в поясе мастера
 * @param minutes минуты от начала дня по часам мастера
 * @param tz пояс мастера
 * @returns момент в мс UTC
 */
function localMs(date: string, minutes: number, tz: string): number {
  const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return dayjs.tz(`${date} ${hhmm}`, `${DAY_FORMAT} HH:mm`, tz).valueOf()
}

/** За сколько минут до начала клиентка ещё может записаться сама */
export const MIN_LEAD_MIN = 60

/** Настройки расчёта слотов */
export interface FreeSlotsOptions {
  /** Текущий момент; по умолчанию — сейчас */
  now?: Date
  /** Начало не раньше чем через столько минут от now; 0 — ручная запись мастера */
  leadMin?: number
  /**
   * Длительность самой короткой активной услуги мастера. В каждом свободном окне остаются только
   * начала, после которых рядом теряется меньше всего минут: окно короче этой услуги уже никто
   * не займёт. Не задано — показываем всю сетку.
   */
  minServiceMin?: number
}

/**
 * Свободные начала записи на день: рабочие часы (или точные времена мастера) минус занятые интервалы
 * с учётом длительности услуги.
 * @param master мастер (пояс, рабочие часы, шаг)
 * @param service услуга (длительность)
 * @param date день "YYYY-MM-DD" в поясе мастера
 * @param busy занятые интервалы (записи со статусом booked)
 * @param options момент «сейчас», запас до начала, фильтр пустых окон
 * @returns начала свободных слотов, ISO в UTC, по возрастанию
 */
export function freeSlots(master: Master, service: Service, date: string, busy: BusyRange[], options: FreeSlotsOptions = {}): string[] {
  const { now = new Date(), leadMin = 0, minServiceMin = 0 } = options
  const cutoff = now.getTime() + leadMin * 60000
  const duration = service.duration_min * 60000
  const minGap = minServiceMin * 60000
  const busyMs = busy.map((b) => [Date.parse(b.start_at), Date.parse(b.end_at)] as const)

  // точное время: начала задала мастер, остаются те, что не прошли и не пересекаются с записями.
  // Фильтр пустых окон не нужен — между точными временами окна мастер выбрала сама
  if (master.slot_mode === EnumSlotMode.Fixed) {
    return startsFor(master, date)
      .map((hhmm) => localMs(date, toMinutes(hhmm), master.timezone))
      .filter((s) => s >= cutoff && !busyMs.some(([bs, be]) => s < be && bs < s + duration))
      .map((ms) => new Date(ms).toISOString())
  }

  // потерянные минуты: окно, куда не влезет даже самая короткая услуга
  const dead = (gap: number) => (gap > 0 && gap < minGap ? gap : 0)
  const result: number[] = []

  for (const [from, to] of rangesFor(master, date)) {
    const rangeStart = localMs(date, toMinutes(from), master.timezone)
    const rangeEnd = localMs(date, toMinutes(to), master.timezone)
    // начало свободного окна, в котором лежит момент s: конец предыдущей записи или начало интервала
    const windowStart = (s: number) => Math.max(rangeStart, ...busyMs.filter(([, be]) => be <= s).map(([, be]) => be))
    const windowEnd = (e: number) => Math.min(rangeEnd, ...busyMs.filter(([bs]) => bs >= e).map(([bs]) => bs))
    const candidates: { start: number; window: number; waste: number }[] = []

    for (let t = toMinutes(from); ; t += master.slot_step_min) {
      const s = localMs(date, t, master.timezone)
      const e = s + duration
      if (e > rangeEnd) break
      if (s < cutoff || busyMs.some(([bs, be]) => s < be && bs < e)) continue
      const window = windowStart(s)
      // время до cutoff уже не продать, его не считаем потерей
      const left = window < cutoff ? 0 : s - window
      candidates.push({ start: s, window, waste: dead(left) + dead(windowEnd(e) - e) })
    }

    const best = new Map<number, number>()
    for (const c of candidates) best.set(c.window, Math.min(best.get(c.window) ?? Infinity, c.waste))
    for (const c of candidates) if (c.waste === best.get(c.window)) result.push(c.start)
  }
  return result.map((ms) => new Date(ms).toISOString())
}
