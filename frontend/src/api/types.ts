import type { NokiLook } from '@/components/mascot/look'
import type { EnumServiceCategory } from '@/components/services/category'
import type { EnumPalette } from '@/styles/palettes'

/** День недели по ISO: '1' — понедельник … '7' — воскресенье */
export type Weekday = '1' | '2' | '3' | '4' | '5' | '6' | '7'

/** Все дни недели по порядку, с понедельника */
export const WEEKDAYS: Weekday[] = ['1', '2', '3', '4', '5', '6', '7']

/** Интервал работы в локальном времени мастера: [начало, конец] в формате "HH:MM" */
export type TimeRange = [from: string, to: string]

/**
 * Рабочие часы по дням недели.
 * Нет ключа или пустой массив — выходной. Массив оставлен под перерывы в будущем.
 */
export type WorkHours = Partial<Record<Weekday, TimeRange[]>>

/** Как задан график работы */
export enum EnumScheduleMode {
  /** Каждую неделю одинаково: шаблон по дням недели (work_hours) */
  Weekly = 'weekly',
  /** По датам: мастер отмечает рабочие дни в календаре (day_overrides) */
  Dates = 'dates',
}

/**
 * Часы на конкретные даты "YYYY-MM-DD" в поясе мастера. Пустой массив — выходной.
 * В режиме Dates рабочие только даты с часами; в Weekly — исключения из шаблона.
 */
export type DayOverrides = Partial<Record<string, TimeRange[]>>

/** Шаблон рабочего дня, который мастер сохранила себе для применения в одно касание */
export interface DayTemplate {
  /** id шаблона (локальный, для списка и удаления) */
  id: string
  /** Интервалы дня — промежутки между ними перерывы */
  ranges: TimeRange[]
}

/** Как клиентки выбирают время */
export enum EnumSlotMode {
  /** Свободная сетка: рабочие часы + шаг записи, начало — любое деление сетки */
  Grid = 'grid',
  /** Точное время: мастер сама задаёт времена начала записи (10:30, 12:30, …) */
  Fixed = 'fixed',
}

/** Времена начала записи по дням недели, "HH:MM" по возрастанию. Нет ключа — выходной (режим Fixed) */
export type WorkSlots = Partial<Record<Weekday, string[]>>

/** Времена начала записи на конкретные даты "YYYY-MM-DD" (режим Fixed): рабочие дни в Dates, исключения в Weekly */
export type SlotOverrides = Partial<Record<string, string[]>>

/** Шаблон дня с точным временем, который мастер сохранила себе */
export interface SlotTemplate {
  /** id шаблона (локальный, для списка и удаления) */
  id: string
  /** Времена начала записи по возрастанию */
  times: string[]
}

/** Профиль мастера */
export interface Master {
  /** id записи в коллекции masters */
  id: string
  /** Имя, которое видят клиентки */
  name: string
  /** Адрес для ссылки записи (startapp), латиница, цифры, _ и - */
  slug: string
  /** Часовой пояс IANA, например Europe/Moscow */
  timezone: string
  /** Как задан график */
  schedule_mode: EnumScheduleMode
  /** Шаблон часов по дням недели (режим Weekly) */
  work_hours: WorkHours
  /** Часы на конкретные даты: рабочие дни в режиме Dates, исключения в Weekly */
  day_overrides: DayOverrides
  /** Свои шаблоны рабочего дня мастера */
  hour_templates: DayTemplate[]
  /** Как клиентки выбирают время: сетка по часам или точные времена */
  slot_mode: EnumSlotMode
  /** Точные времена по дням недели (режим Fixed + Weekly) */
  work_slots: WorkSlots
  /** Точные времена на даты (режим Fixed): рабочие дни в Dates, исключения в Weekly */
  slot_overrides: SlotOverrides
  /** Свои шаблоны дня с точным временем */
  slot_templates: SlotTemplate[]
  /** Шаг начала записи в минутах */
  slot_step_min: 15 | 30
  /** Внешность Ноки из конструктора, её видят клиентки */
  mascot: NokiLook
  /** Цветовая тема: в ней мастер видит кабинет, а клиентки — страницу записи */
  theme: EnumPalette
}

/** Данные для создания или обновления профиля мастера */
export type MasterInput = Omit<Master, 'id'>

/** Услуга мастера */
export interface Service {
  /** id записи в коллекции services */
  id: string
  /** id мастера-владельца */
  master: string
  /** Название, например «Вечерний макияж» */
  name: string
  /** Длительность в минутах, 5–600 */
  duration_min: number
  /** Цена, 0 — бесплатно */
  price: number
  /** Показывать ли клиенткам. Услуги не удаляем, а скрываем */
  is_active: boolean
  /** Что входит в услугу, до 300 символов; пусто — без описания */
  description: string
  /** Вид услуги из справочника, по нему клиентка видит группы */
  category: EnumServiceCategory
  /** Место в списке: меньше — выше. Меняется только через reorderServices */
  sort: number
}

/** Данные для создания или обновления услуги */
export type ServiceInput = Omit<Service, 'id' | 'master' | 'sort'>

/** Статус записи */
export enum EnumAppointmentStatus {
  Booked = 'booked',
  Cancelled = 'cancelled',
  Done = 'done',
}

/** Кто создал запись */
export enum EnumAppointmentSource {
  /** Клиентка сама через приложение */
  Client = 'client',
  /** Мастер вручную */
  Manual = 'manual',
}

/** Запись к мастеру */
export interface Appointment {
  /** id записи в коллекции appointments */
  id: string
  /** id мастера */
  master: string
  /** id услуги */
  service: string
  /** Название услуги на момент показа (для списков) */
  service_name: string
  /** Имя мастера (для списка «Мои записи» у клиентки) */
  master_name: string
  /** Пояс мастера: время записи показывается в нём */
  master_timezone: string
  /** Имя клиентки */
  client_name: string
  /** Телефон клиентки */
  client_phone: string
  /** Заметка к записи: «записываю маму», пожелания. Пусто — нет */
  note: string
  /** Telegram id клиентки, если записалась сама */
  client_telegram_id: number | null
  /** Начало, ISO в UTC */
  start_at: string
  /** Конец, ISO в UTC */
  end_at: string
  /** Статус */
  status: EnumAppointmentStatus
  /** Кто создал */
  source: EnumAppointmentSource
}

/** Кто оставил отзыв */
export enum EnumFeedbackRole {
  Master = 'master',
  Client = 'client',
}

/**
 * Можно ли ещё отменить запись: только пока она не началась.
 * @param a запись
 * @param now текущий момент
 */
export function isCancellable(a: Appointment, now = new Date()): boolean {
  return a.status === EnumAppointmentStatus.Booked && Date.parse(a.start_at) > now.getTime()
}

/**
 * Можно ли отметить запись выполненной: она уже началась и не отменена.
 * @param a запись
 * @param now текущий момент
 */
export function isCompletable(a: Appointment, now = new Date()): boolean {
  return a.status === EnumAppointmentStatus.Booked && Date.parse(a.start_at) <= now.getTime()
}

/** Данные новой записи */
export interface BookingInput {
  /** id мастера */
  masterId: string
  /** id услуги */
  serviceId: string
  /** Начало, ISO в UTC — одно из значений getFreeSlots */
  startAt: string
  /** Имя клиентки */
  clientName: string
  /** Телефон клиентки */
  clientPhone: string
  /** Заметка к записи, до NOTE_MAX символов; пусто — нет */
  note: string
}

/** Длина заметки к записи — как в базе (appointments.note) */
export const NOTE_MAX = 300

/** Сырые поля графика из базы */
interface RawSchedule {
  /** masters.schedule_mode */
  schedule_mode?: unknown
  /** masters.day_overrides */
  day_overrides?: unknown
  /** masters.hour_templates */
  hour_templates?: unknown
  /** masters.slot_mode */
  slot_mode?: unknown
  /** masters.work_slots */
  work_slots?: unknown
  /** masters.slot_overrides */
  slot_overrides?: unknown
  /** masters.slot_templates */
  slot_templates?: unknown
}

/** Поля графика после проверки */
type Schedule = Pick<Master, 'schedule_mode' | 'day_overrides' | 'hour_templates' | 'slot_mode' | 'work_slots' | 'slot_overrides' | 'slot_templates'>

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Список времён "HH:MM": только верные, без повторов, по возрастанию.
 * @param raw значение из базы
 */
function cleanTimes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((v): v is string => typeof v === 'string' && TIME_RE.test(v)))].sort()
}

/**
 * Словарь «ключ → времена» без пустых и неверных значений.
 * @param raw значение из базы
 */
function cleanTimesMap(raw: unknown): Partial<Record<string, string[]>> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Partial<Record<string, string[]>> = {}
  for (const [k, v] of Object.entries(raw)) {
    const times = cleanTimes(v)
    if (times.length) out[k] = times
  }
  return out
}

/**
 * Привести график из базы к типам: старые записи без режима — недельный график со свободной сеткой.
 * @param raw запись мастера
 */
export function normalizeSchedule(raw: RawSchedule): Schedule {
  const mode = Object.values(EnumScheduleMode).includes(raw.schedule_mode as EnumScheduleMode)
    ? (raw.schedule_mode as EnumScheduleMode)
    : EnumScheduleMode.Weekly
  const overrides = raw.day_overrides && typeof raw.day_overrides === 'object' ? (raw.day_overrides as DayOverrides) : {}
  const templates = Array.isArray(raw.hour_templates)
    ? (raw.hour_templates as DayTemplate[]).filter((t) => t && typeof t.id === 'string' && Array.isArray(t.ranges) && t.ranges.length)
    : []
  const slotMode = Object.values(EnumSlotMode).includes(raw.slot_mode as EnumSlotMode) ? (raw.slot_mode as EnumSlotMode) : EnumSlotMode.Grid
  const slotTemplates = Array.isArray(raw.slot_templates)
    ? (raw.slot_templates as SlotTemplate[])
        .filter((t) => t && typeof t.id === 'string')
        .map((t) => ({ id: t.id, times: cleanTimes(t.times) }))
        .filter((t) => t.times.length)
    : []
  return {
    schedule_mode: mode,
    day_overrides: overrides,
    hour_templates: templates,
    slot_mode: slotMode,
    work_slots: cleanTimesMap(raw.work_slots) as WorkSlots,
    slot_overrides: cleanTimesMap(raw.slot_overrides),
    slot_templates: slotTemplates,
  }
}

/** Текущий пользователь после входа */
export interface Me {
  /** id пользователя на сервере */
  id: string
  /** Telegram id */
  telegram_id: number
  /** Имя из профиля Telegram */
  name: string
}
