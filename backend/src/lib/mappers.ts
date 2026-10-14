// Строки базы → типы фронта (@/api/types). Сервер отдаёт ровно то, что ждут экраны.
import { normalizeSchedule, type Appointment, type EnumAppointmentSource, type EnumAppointmentStatus, type Master, type Service } from '@/api/types'
import { normalizeLook } from '@/components/mascot/look'
import { normalizeCategory } from '@/components/services/category'
import { normalizePalette } from '@/styles/palettes'
import type { AppointmentRow, MasterRow, ServiceRow } from '~/db/schema'

/**
 * Мастер для фронта: график и внешность проходят те же нормализации, что и на фронте.
 * @param r строка masters
 */
export function toMaster(r: MasterRow): Master {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    timezone: r.timezone,
    work_hours: (r.workHours ?? {}) as Master['work_hours'],
    ...normalizeSchedule({
      schedule_mode: r.scheduleMode,
      day_overrides: r.dayOverrides,
      hour_templates: r.hourTemplates,
      slot_mode: r.slotMode,
      work_slots: r.workSlots,
      slot_overrides: r.slotOverrides,
      slot_templates: r.slotTemplates,
    }),
    slot_step_min: r.slotStepMin === 15 ? 15 : 30,
    mascot: normalizeLook(r.mascot),
    theme: normalizePalette(r.theme),
  }
}

/**
 * Услуга для фронта.
 * @param r строка services
 */
export function toService(r: ServiceRow): Service {
  return {
    id: r.id,
    master: r.masterId,
    name: r.name,
    duration_min: r.durationMin,
    price: r.price,
    is_active: r.isActive,
    description: r.description,
    category: normalizeCategory(r.category),
    sort: r.sort,
  }
}

/**
 * Запись для фронта.
 * @param r строка appointments
 * @param master имя и пояс мастера: время записи показывается в его поясе
 */
export function toAppointment(r: AppointmentRow, master: Pick<MasterRow, 'name' | 'timezone'>): Appointment {
  return {
    id: r.id,
    master: r.masterId,
    service: r.serviceId,
    service_name: r.serviceName,
    master_name: master.name,
    master_timezone: master.timezone,
    client_name: r.clientName,
    client_phone: r.clientPhone,
    note: r.note,
    client_telegram_id: r.clientTelegramId ?? null,
    start_at: r.startAt.toISOString(),
    end_at: r.endAt.toISOString(),
    status: r.status as EnumAppointmentStatus,
    source: r.source as EnumAppointmentSource,
  }
}

/**
 * Поля мастера с фронта (snake_case) → колонки Drizzle.
 * @param data проверенные поля MasterInput (все или часть)
 */
export function masterColumns(data: Partial<Omit<Master, 'id'>>): Partial<MasterRow> {
  const map: Record<string, keyof MasterRow> = {
    name: 'name',
    slug: 'slug',
    timezone: 'timezone',
    slot_step_min: 'slotStepMin',
    schedule_mode: 'scheduleMode',
    work_hours: 'workHours',
    day_overrides: 'dayOverrides',
    hour_templates: 'hourTemplates',
    slot_mode: 'slotMode',
    work_slots: 'workSlots',
    slot_overrides: 'slotOverrides',
    slot_templates: 'slotTemplates',
    mascot: 'mascot',
    theme: 'theme',
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) if (k in map && v !== undefined) out[map[k]] = v
  return out as Partial<MasterRow>
}

/**
 * Поля услуги с фронта → колонки Drizzle.
 * @param data проверенные поля ServiceInput (все или часть)
 */
export function serviceColumns(data: Partial<Omit<Service, 'id' | 'master' | 'sort'>>): Partial<ServiceRow> {
  const out: Partial<ServiceRow> = {}
  if (data.name !== undefined) out.name = data.name
  if (data.duration_min !== undefined) out.durationMin = data.duration_min
  if (data.price !== undefined) out.price = data.price
  if (data.is_active !== undefined) out.isActive = data.is_active
  if (data.description !== undefined) out.description = data.description
  if (data.category !== undefined) out.category = data.category
  return out
}
