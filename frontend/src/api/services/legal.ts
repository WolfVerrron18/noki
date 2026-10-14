// Принятые документы: соглашение, политика, согласия на обработку персональных данных
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'
import type { AcceptedDoc } from '@/api/types'

export const legalApi: Pick<Repo, 'acceptedDocuments' | 'acceptDocuments'> = {
  acceptedDocuments: () => api<AcceptedDoc[]>('/api/legal/consents'),

  acceptDocuments: (docs) => api<AcceptedDoc[]>('/api/legal/consents', { method: 'POST', body: { documents: docs } }),
}
