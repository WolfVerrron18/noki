// Услуги мастера: список, создание, правка, удаление, порядок
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'
import type { Service } from '@/api/types'

export const servicesApi: Pick<
  Repo,
  'listServices' | 'listActiveServices' | 'createService' | 'updateService' | 'deleteService' | 'reorderServices'
> = {
  listServices: (masterId) => api<Service[]>(`/api/masters/${masterId}/services`),

  listActiveServices: (masterId) => api<Service[]>(`/api/masters/${masterId}/services/active`),

  createService: (masterId, data) => api<Service>(`/api/masters/${masterId}/services`, { method: 'POST', body: data }),

  updateService: (id, data) => api<Service>(`/api/services/${id}`, { method: 'PATCH', body: data }),

  deleteService: (id) => api<void>(`/api/services/${id}`, { method: 'DELETE' }),

  // порядок меняется целиком одной транзакцией; мастер — из токена
  async reorderServices(ids) {
    if (ids.length) await api<void>('/api/services/order', { method: 'PUT', body: { ids } })
  },
}
