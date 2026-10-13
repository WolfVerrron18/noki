import type { NokiLook } from '@/components/mascot/look'
import type { EnumServiceCategory } from '@/components/services/category'

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
  /** Шаг начала записи в минутах */
  slot_step_min: 15 | 30
  /** Внешность Ноки из конструктора, её видят клиентки */
  mascot: NokiLook
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
}

/**
 * Привести график из базы к типам: старые записи без режима — недельный график.
 * @param raw запись мастера
 */
export function normalizeSchedule(raw: { schedule_mode?: unknown; day_overrides?: unknown; hour_templates?: unknown }): {
  schedule_mode: EnumScheduleMode
  day_overrides: DayOverrides
  hour_templates: DayTemplate[]
} {
  const mode = Object.values(EnumScheduleMode).includes(raw.schedule_mode as EnumScheduleMode)
    ? (raw.schedule_mode as EnumScheduleMode)
    : EnumScheduleMode.Weekly
  const overrides = raw.day_overrides && typeof raw.day_overrides === 'object' ? (raw.day_overrides as DayOverrides) : {}
  const templates = Array.isArray(raw.hour_templates)
    ? (raw.hour_templates as DayTemplate[]).filter((t) => t && typeof t.id === 'string' && Array.isArray(t.ranges) && t.ranges.length)
    : []
  return { schedule_mode: mode, day_overrides: overrides, hour_templates: templates }
}
