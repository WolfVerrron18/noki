// Профиль мастера: свой и публичный по адресу ссылки
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'
import type { Master } from '@/api/types'

export const mastersApi: Pick<Repo, 'getMyMaster' | 'isSlugFree' | 'getMasterBySlug' | 'createMaster' | 'updateMaster'> = {
  getMyMaster: () => api<Master | null>('/api/masters/me'),

  async isSlugFree(slug, exceptMasterId) {
    const res = await api<{ free: boolean }>('/api/masters/slug-free', { query: { slug, except: exceptMasterId } })
    return res.free
  },

  async getMasterBySlug(slug) {
    try {
      return await api<Master>(`/api/masters/by-slug/${encodeURIComponent(slug)}`)
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null
      throw e
    }
  },

  // владельца сервер берёт из токена
  createMaster: (_userId, data) => api<Master>('/api/masters', { method: 'POST', body: data }),

  updateMaster: (id, data) => api<Master>(`/api/masters/${id}`, { method: 'PATCH', body: data }),
}
