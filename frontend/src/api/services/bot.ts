// Связь с ботом: разрешение писать пользователю (уведомления о записях, напоминания)
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'

export const botApi: Pick<Repo, 'setBotAccess'> = {
  async setBotAccess(allowed) {
    await api('/api/me/bot-access', { method: 'POST', body: { allowed } })
  },
}
