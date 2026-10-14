// Записи: запись клиентки, ручная запись мастера, списки, отмена и «выполнено»
import { api } from '@/api/http'
import type { Repo } from '@/api/repo'
import type { Appointment } from '@/api/types'

export const appointmentsApi: Pick<
  Repo,
  'book' | 'addManualAppointment' | 'listMyBookings' | 'listMasterAppointments' | 'cancelAppointment' | 'completeAppointment'
> = {
  book: (input) => api<Appointment>('/api/bookings', { method: 'POST', body: input }),

  addManualAppointment: (input) => api<Appointment>('/api/appointments/manual', { method: 'POST', body: input }),

  listMyBookings: () => api<Appointment[]>('/api/bookings/my'),

  listMasterAppointments: (masterId, from, to) => api<Appointment[]>(`/api/masters/${masterId}/appointments`, { query: { from, to } }),

  cancelAppointment: (id) => api<Appointment>(`/api/appointments/${id}/cancel`, { method: 'POST' }),

  completeAppointment: (id) => api<Appointment>(`/api/appointments/${id}/done`, { method: 'POST' }),
}
