import type { Repo } from '@/api/repo'
import {
  EnumAppointmentSource,
  EnumAppointmentStatus,
  isCancellable,
  normalizeSchedule,
  isCompletable,
  type Appointment,
  type BookingInput,
  type EnumFeedbackRole,
  type Master,
  type Service,
} from '@/api/types'
import { freeSlots, MIN_LEAD_MIN, todayIn } from '@/utils/slots'
import { normalizeLook } from '@/components/mascot/look'
import { normalizeCategory } from '@/components/services/category'

// Хранилище для режима просмотра без бэкенда. Только для разработки.
const KEY = 'nidoki.mock.v1'

/** Содержимое тестового хранилища */
interface Db {
  /** Профили мастеров с id владельца */
  masters: (Master & {
    /** id пользователя-владельца */
    user: string
  })[]
  /** Все услуги всех мастеров */
  services: Service[]
  /** Все записи */
  appointments: Appointment[]
  /** Отзывы: в режиме просмотра никуда не отправляются */
  feedback: {
    /** Текст */
    text: string
    /** Кто писал */
    role: EnumFeedbackRole
    /** Когда, ISO */
    created: string
  }[]
}

/** Telegram id тестовой клиентки — тот же, что у тестового пользователя в режиме просмотра */
const PREVIEW_TELEGRAM_ID = 1000001

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // нет доступа к localStorage — работаем в памяти
  }
  return { masters: [], services: [], appointments: [], feedback: [] }
}

const db = load()
// старые тестовые данные без записей
db.appointments ??= []
db.feedback ??= []
// старые тестовые услуги без описания, категории и порядка
db.services.forEach((s, i) => {
  s.description ??= ''
  s.category = normalizeCategory(s.category)
  s.sort ??= i
})

/** Услуги мастера в его порядке */
const servicesOf = (masterId: string) => db.services.filter((s) => s.master === masterId).sort((a, b) => a.sort - b.sort)

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // не критично
  }
}

const id = () => Math.random().toString(36).slice(2, 12)

/** Ошибка как у Pocketbase: экраны различают её по status */
function httpError(status: number): Error {
  return Object.assign(new Error(String(status)), { status })
}

const booked = (masterId: string) =>
  db.appointments.filter((a) => a.master === masterId && a.status === EnumAppointmentStatus.Booked)

/**
 * Свободные слоты так же, как их будет считать сервер.
 * @param master мастер из хранилища
 * @param service услуга
 * @param date день "YYYY-MM-DD" в поясе мастера
 * @param manual ручная запись мастером: без запаса до начала и без фильтра окон
 */
function slotsFor(master: Db['masters'][number], service: Service, date: string, manual: boolean): string[] {
  const active = db.services.filter((s) => s.master === master.id && s.is_active).map((s) => s.duration_min)
  return freeSlots(strip(master), service, date, booked(master.id), {
    leadMin: manual ? 0 : MIN_LEAD_MIN,
    minServiceMin: manual || !active.length ? undefined : Math.min(...active),
  })
}

/** Создать запись: время должно быть среди свободных слотов — как это будет проверять сервер */
function createAppointment(input: BookingInput, source: EnumAppointmentSource): Appointment {
  const master = db.masters.find((m) => m.id === input.masterId)
  const service = db.services.find((s) => s.id === input.serviceId)
  if (!master || !service) throw httpError(404)
  const manual = source === EnumAppointmentSource.Manual
  if (!manual && !service.is_active) throw httpError(404)
  const start = Date.parse(input.startAt)
  const end = start + service.duration_min * 60000
  const date = todayIn(master.timezone, new Date(start))
  if (!slotsFor(master, service, date, manual).some((s) => Date.parse(s) === start)) throw httpError(409)
  const a: Appointment = {
    id: id(),
    master: master.id,
    service: service.id,
    service_name: service.name,
    master_name: master.name,
    master_timezone: master.timezone,
    client_name: input.clientName,
    client_phone: input.clientPhone,
    client_telegram_id: source === EnumAppointmentSource.Client ? PREVIEW_TELEGRAM_ID : null,
    start_at: new Date(start).toISOString(),
    end_at: new Date(end).toISOString(),
    status: EnumAppointmentStatus.Booked,
    source,
  }
  db.appointments.push(a)
  save()
  return { ...a }
}

const byStart = (a: Appointment, b: Appointment) => a.start_at.localeCompare(b.start_at)
// старые тестовые данные могли сохраниться без mascot
const strip = ({ user: _user, ...m }: Master & { user: string }): Master => ({
  ...m,
  ...normalizeSchedule(m),
  mascot: normalizeLook(m.mascot),
})

export const mockRepo: Repo = {
  async getMyMaster(userId) {
    const m = db.masters.find((x) => x.user === userId)
    return m ? strip(m) : null
  },

  async isSlugFree(slug, exceptMasterId) {
    return !db.masters.some((m) => m.slug === slug && m.id !== exceptMasterId)
  },

  async getMasterBySlug(slug) {
    const m = db.masters.find((x) => x.slug === slug)
    return m ? strip(m) : null
  },

  async createMaster(userId, data) {
    const m = { ...data, id: id(), user: userId }
    db.masters.push(m)
    save()
    return strip(m)
  },

  async updateMaster(masterId, data) {
    const m = db.masters.find((x) => x.id === masterId)
    if (!m) throw new Error('not found')
    Object.assign(m, data)
    save()
    return strip(m)
  },

  async listServices(masterId) {
    return servicesOf(masterId).map((s) => ({ ...s }))
  },

  async createService(masterId, data) {
    const sort = Math.max(-1, ...servicesOf(masterId).map((x) => x.sort)) + 1
    const s = { ...data, sort, id: id(), master: masterId }
    db.services.push(s)
    save()
    return { ...s }
  },

  async updateService(serviceId, data) {
    const s = db.services.find((x) => x.id === serviceId)
    if (!s) throw new Error('not found')
    Object.assign(s, data)
    save()
    return { ...s }
  },

  async reorderServices(ids) {
    ids.forEach((serviceId, sort) => {
      const s = db.services.find((x) => x.id === serviceId)
      if (s) s.sort = sort
    })
    save()
  },

  async listActiveServices(masterId) {
    return servicesOf(masterId).filter((s) => s.is_active).map((s) => ({ ...s }))
  },

  async getFreeSlots(masterId, serviceId, date, manual = false) {
    const m = db.masters.find((x) => x.id === masterId)
    const s = db.services.find((x) => x.id === serviceId)
    if (!m || !s) return []
    return slotsFor(m, s, date, manual)
  },

  async book(input) {
    return createAppointment(input, EnumAppointmentSource.Client)
  },

  async addManualAppointment(input) {
    return createAppointment(input, EnumAppointmentSource.Manual)
  },

  async listMyBookings() {
    const now = Date.now()
    return db.appointments
      .filter((a) => a.client_telegram_id === PREVIEW_TELEGRAM_ID && a.status === EnumAppointmentStatus.Booked && Date.parse(a.end_at) > now)
      .sort(byStart)
      .map((a) => ({ ...a }))
  },

  async listMasterAppointments(masterId, from, to) {
    return db.appointments
      .filter((a) => a.master === masterId && a.start_at >= from && a.start_at < to)
      .sort(byStart)
      .map((a) => ({ ...a }))
  },

  async cancelAppointment(appointmentId) {
    const a = db.appointments.find((x) => x.id === appointmentId)
    if (!a) throw httpError(404)
    if (!isCancellable(a)) throw httpError(409)
    a.status = EnumAppointmentStatus.Cancelled
    save()
    return { ...a }
  },

  async completeAppointment(appointmentId) {
    const a = db.appointments.find((x) => x.id === appointmentId)
    if (!a) throw httpError(404)
    if (!isCompletable(a)) throw httpError(409)
    a.status = EnumAppointmentStatus.Done
    save()
    return { ...a }
  },

  async sendFeedback(text, role) {
    db.feedback.push({ text, role, created: new Date().toISOString() })
    save()
  },
}
