// Отзывы: идеи и ошибки, сервер пересылает их разработчику
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'

export const feedbackApi: Pick<Repo, 'sendFeedback'> = {
  sendFeedback: (text, role) => api<void>('/api/feedback', { method: 'POST', body: { text, role } }),
}
