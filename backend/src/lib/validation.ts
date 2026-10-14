// Проверка тел запросов. Всё, что пришло от клиента, проходит через эти схемы — фронту не доверяем.
import { z } from 'zod'
import { EnumLegalDoc, EnumScheduleMode, EnumSlotMode, NOTE_MAX, WEEKDAYS } from '@/api/types'
import { SLUG_RE } from '@/utils/slug'
import { normalizeLook } from '@/components/mascot/look'
import { normalizeCategory } from '@/components/services/category'
import { EnumPalette } from '@/styles/palettes'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
/** Сколько дат с особыми часами храним: с запасом на год вперёд и историю */
const MAX_DATES = 800
/** Сколько своих шаблонов дня */
const MAX_TEMPLATES = 30
/** Интервалов за день (перерывы — промежутки между ними) */
const MAX_RANGES = 12
/** Точных времён за день */
const MAX_TIMES = 48

/**
 * Пояс IANA, который знает сервер.
 * @param tz строка пояса
 */
function isTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const time = z.string().regex(TIME_RE)
const range = z.tuple([time, time])

/** Интервалы дня: начало раньше конца, по порядку, не пересекаются; пустой — выходной */
const dayRanges = z
  .array(range)
  .max(MAX_RANGES)
  .refine((rs) => rs.every(([a, b], i) => a < b && (i === 0 || rs[i - 1][1] <= a)), 'ranges_invalid')

/** Времена начала: по возрастанию, без повторов */
const dayTimes = z
  .array(time)
  .max(MAX_TIMES)
  .refine((ts) => ts.every((t, i) => i === 0 || ts[i - 1] < t), 'times_invalid')

const weekdayKey = z.enum(WEEKDAYS as [string, ...string[]])
const dateKey = z.string().regex(DATE_RE)
const templateId = z.string().min(1).max(40)

/**
 * Словарь с ограничением на число ключей.
 * @param key схема ключа
 * @param value схема значения
 * @param max сколько ключей можно
 */
const recordOf = <V extends z.ZodTypeAny>(key: z.ZodString | z.ZodEnum<[string, ...string[]]>, value: V, max: number) =>
  z.record(key, value).refine((r) => Object.keys(r).length <= max, 'too_many_keys')

/** Профиль мастера целиком (создание) */
export const masterInput = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().regex(SLUG_RE),
  timezone: z.string().min(1).max(64).refine(isTimezone, 'timezone_invalid'),
  slot_step_min: z.union([z.literal(15), z.literal(30)]),
  schedule_mode: z.nativeEnum(EnumScheduleMode),
  work_hours: recordOf(weekdayKey, dayRanges, 7),
  day_overrides: recordOf(dateKey, dayRanges, MAX_DATES),
  hour_templates: z.array(z.object({ id: templateId, ranges: dayRanges.refine((r) => r.length > 0) })).max(MAX_TEMPLATES),
  slot_mode: z.nativeEnum(EnumSlotMode),
  work_slots: recordOf(weekdayKey, dayTimes, 7),
  slot_overrides: recordOf(dateKey, dayTimes, MAX_DATES),
  slot_templates: z.array(z.object({ id: templateId, times: dayTimes.refine((t) => t.length > 0) })).max(MAX_TEMPLATES),
  // неизвестные детали Ноки не ломают профиль — приводим к известным
  mascot: z.unknown().transform(normalizeLook),
  theme: z.nativeEnum(EnumPalette),
})

/** Изменённые поля профиля мастера */
export const masterPatch = masterInput.partial()

/** Услуга целиком (создание) */
export const serviceInput = z.object({
  name: z.string().trim().min(1).max(120),
  duration_min: z.number().int().min(5).max(600),
  price: z.number().int().min(0).max(10_000_000),
  is_active: z.boolean(),
  description: z.string().trim().max(300),
  category: z.string().max(40).transform(normalizeCategory),
})

/** Изменённые поля услуги */
export const servicePatch = serviceInput.partial()

/** Новый порядок услуг */
export const reorderInput = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) })

/** Новая запись (клиентка или мастер) — как BookingInput на фронте */
export const bookingInput = z.object({
  masterId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startAt: z.string().datetime({ offset: true }),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: z.string().trim().max(40),
  note: z.string().trim().max(NOTE_MAX),
})

/** Отзыв */
export const feedbackInput = z.object({
  text: z.string().trim().min(1).max(2000),
  role: z.enum(['master', 'client']),
})

/** Вход */
export const authInput = z.object({ initData: z.string().min(1).max(8000) })

/** Запрос свободных слотов */
export const slotsQuery = z.object({
  master: z.string().uuid(),
  service: z.string().uuid(),
  date: z.string().regex(DATE_RE),
  manual: z.enum(['1', '0', 'true', 'false']).optional(),
})

/** Период записей мастера */
export const periodQuery = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
})

/** Принятые документы: какой и в какой редакции */
export const consentsInput = z.object({
  documents: z
    .array(z.object({ document: z.nativeEnum(EnumLegalDoc), version: z.string().min(1).max(20) }))
    .min(1)
    .max(10),
})
