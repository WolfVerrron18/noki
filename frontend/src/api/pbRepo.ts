import type { RecordModel } from 'pocketbase'
import { pb } from '@/api/pb'
import type { Repo } from '@/api/repo'
import { normalizeSchedule, type Appointment, type Master, type Service } from '@/api/types'
import { normalizeLook } from '@/components/mascot/look'
import { normalizeCategory } from '@/components/services/category'
import { normalizePalette } from '@/styles/palettes'

const toMaster = (r: RecordModel): Master => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  timezone: r.timezone,
  work_hours: r.work_hours ?? {},
  ...normalizeSchedule({
    schedule_mode: r.schedule_mode,
    day_overrides: r.day_overrides,
    hour_templates: r.hour_templates,
    slot_mode: r.slot_mode,
    work_slots: r.work_slots,
    slot_overrides: r.slot_overrides,
    slot_templates: r.slot_templates,
  }),
  slot_step_min: r.slot_step_min,
  mascot: normalizeLook(r.mascot),
  theme: normalizePalette(r.theme),
})

const toService = (r: RecordModel): Service => ({
  id: r.id,
  master: r.master,
  name: r.name,
  duration_min: r.duration_min,
  price: r.price ?? 0,
  is_active: r.is_active,
  description: r.description ?? '',
  category: normalizeCategory(r.category),
  sort: r.sort ?? 0,
})

const toAppointment = (r: RecordModel): Appointment => ({
  id: r.id,
  master: r.master,
  service: r.service,
  service_name: r.expand?.service?.name ?? '',
  master_name: r.expand?.master?.name ?? '',
  master_timezone: r.expand?.master?.timezone ?? 'UTC',
  client_name: r.client_name,
  client_phone: r.client_phone ?? '',
  client_telegram_id: r.client_telegram_id || null,
  start_at: new Date(r.start_at).toISOString(),
  end_at: new Date(r.end_at).toISOString(),
  status: r.status,
  source: r.source,
})

const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404

export const pbRepo: Repo = {
  async getMyMaster(userId) {
    try {
      return toMaster(await pb.collection('masters').getFirstListItem(pb.filter('user = {:u}', { u: userId })))
    } catch (e) {
      if (isNotFound(e)) return null
      throw e
    }
  },

  async isSlugFree(slug, exceptMasterId) {
    const filter = exceptMasterId
      ? pb.filter('slug = {:s} && id != {:id}', { s: slug, id: exceptMasterId })
      : pb.filter('slug = {:s}', { s: slug })
    const res = await pb.collection('masters').getList(1, 1, { filter, skipTotal: true })
    return res.items.length === 0
  },

  async getMasterBySlug(slug) {
    try {
      return toMaster(await pb.collection('masters').getFirstListItem(pb.filter('slug = {:s}', { s: slug })))
    } catch (e) {
      if (isNotFound(e)) return null
      throw e
    }
  },

  async createMaster(userId, data) {
    return toMaster(await pb.collection('masters').create({ ...data, user: userId }))
  },

  async updateMaster(id, data) {
    return toMaster(await pb.collection('masters').update(id, data))
  },

  async listServices(masterId) {
    const list = await pb.collection('services').getFullList({
      filter: pb.filter('master = {:m} && archived != true', { m: masterId }),
      sort: 'sort,created',
    })
    return list.map(toService)
  },

  async createService(masterId, data) {
    // новая услуга — в конец списка
    const last = await pb.collection('services').getList(1, 1, { filter: pb.filter('master = {:m}', { m: masterId }), sort: '-sort', skipTotal: true })
    const sort = (last.items[0]?.sort ?? -1) + 1
    return toService(await pb.collection('services').create({ ...data, sort, master: masterId }))
  },

  async updateService(id, data) {
    return toService(await pb.collection('services').update(id, data))
  },

  async deleteService(id) {
    await pb.collection('services').update(id, { archived: true })
  },

  async reorderServices(ids) {
    await Promise.all(ids.map((id, sort) => pb.collection('services').update(id, { sort })))
  },

  async listActiveServices(masterId) {
    const list = await pb.collection('services').getFullList({
      filter: pb.filter('master = {:m} && is_active = true && archived != true', { m: masterId }),
      sort: 'sort,created',
    })
    return list.map(toService)
  },

  // Слоты, запись и отмена — серверные эндпоинты (pb_hooks), там же проверка пересечений
  async getFreeSlots(masterId, serviceId, date, manual = false) {
    const res = await pb.send<{ slots: string[] }>('/api/nidoki/slots', {
      query: { master: masterId, service: serviceId, date, ...(manual ? { manual: 1 } : {}) },
    })
    return res.slots
  },

  async book(input) {
    return toAppointment(await pb.send('/api/nidoki/book', { method: 'POST', body: input }))
  },

  async addManualAppointment(input) {
    return toAppointment(await pb.send('/api/nidoki/appointments', { method: 'POST', body: input }))
  },

  async listMyBookings() {
    const list = await pb.collection('appointments').getFullList({
      filter: pb.filter('status = "booked" && end_at > {:now}', { now: new Date().toISOString() }),
      sort: 'start_at',
      expand: 'service,master',
    })
    return list.map(toAppointment)
  },

  async listMasterAppointments(masterId, from, to) {
    const list = await pb.collection('appointments').getFullList({
      filter: pb.filter('master = {:m} && start_at >= {:from} && start_at < {:to}', { m: masterId, from, to }),
      sort: 'start_at',
      expand: 'service,master',
    })
    return list.map(toAppointment)
  },

  async cancelAppointment(id) {
    return toAppointment(await pb.send(`/api/nidoki/appointments/${id}/cancel`, { method: 'POST' }))
  },

  async completeAppointment(id) {
    return toAppointment(await pb.send(`/api/nidoki/appointments/${id}/done`, { method: 'POST' }))
  },

  async sendFeedback(text, role) {
    await pb.send('/api/nidoki/feedback', { method: 'POST', body: { text, role } })
  },
}
