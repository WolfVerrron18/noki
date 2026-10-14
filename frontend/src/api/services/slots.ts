// Свободное время для записи: сервер считает тем же freeSlots(), что и фронт
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'

export const slotsApi: Pick<Repo, 'getFreeSlots'> = {
  async getFreeSlots(masterId, serviceId, date, manual = false) {
    const res = await api<{ slots: string[] }>('/api/slots', { query: { master: masterId, service: serviceId, date, manual: manual ? 1 : undefined } })
    return res.slots
  },
}
