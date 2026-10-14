// Данные с нашего сервера (backend/). Запросы разложены по разделам в @/api/services/*, здесь они собираются в Repo.
import type { Repo } from '@/api/repo'
import { mastersApi } from '@/api/services/masters'
import { servicesApi } from '@/api/services/services'
import { slotsApi } from '@/api/services/slots'
import { appointmentsApi } from '@/api/services/appointments'
import { feedbackApi } from '@/api/services/feedback'

export const apiRepo: Repo = {
  ...mastersApi,
  ...servicesApi,
  ...slotsApi,
  ...appointmentsApi,
  ...feedbackApi,
}
