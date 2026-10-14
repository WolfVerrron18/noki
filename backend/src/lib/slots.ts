// Свободные слоты на сервере: тот же freeSlots(), что на фронте (@/utils/slots), с данными из базы.
import { and, eq, gt, lt, min } from 'drizzle-orm'
import { MIN_LEAD_MIN, addDays, freeSlots, zonedToUtc } from '@/utils/slots'
import type { Db } from '~/db/client'
import { appointments, services, type MasterRow, type ServiceRow } from '~/db/schema'
import { toMaster, toService } from '~/lib/mappers'

/** Настройки расчёта */
export interface SlotsRequest {
  /** Мастер */
  master: MasterRow
  /** Услуга */
  service: ServiceRow
  /** День "YYYY-MM-DD" в поясе мастера */
  date: string
  /** Ручная запись мастером: вся свободная сетка, без запаса до начала и фильтра окон */
  manual: boolean
  /** Текущий момент */
  now: Date
}

/**
 * Свободные начала записи на день — так же, как их показывает фронт.
 * @param db база (или транзакция)
 * @param req мастер, услуга, день, режим
 * @returns начала, ISO в UTC
 */
export async function slotsFor(db: Db, { master, service, date, manual, now }: SlotsRequest): Promise<string[]> {
  // записи, которые могут задеть этот день: с запасом в сутки по краям (пояс мастера, ночные смены)
  const from = zonedToUtc(addDays(date, -1), 0, master.timezone)
  const to = zonedToUtc(addDays(date, 2), 0, master.timezone)
  const busy = await db
    .select({ start: appointments.startAt, end: appointments.endAt })
    .from(appointments)
    .where(and(eq(appointments.masterId, master.id), eq(appointments.status, 'booked'), lt(appointments.startAt, to), gt(appointments.endAt, from)))

  let minServiceMin: number | undefined
  if (!manual) {
    const [row] = await db
      .select({ shortest: min(services.durationMin) })
      .from(services)
      .where(and(eq(services.masterId, master.id), eq(services.isActive, true), eq(services.archived, false)))
    minServiceMin = row?.shortest ?? undefined
  }

  return freeSlots(
    toMaster(master),
    toService(service),
    date,
    busy.map((b) => ({ start_at: b.start.toISOString(), end_at: b.end.toISOString() })),
    { now, leadMin: manual ? 0 : MIN_LEAD_MIN, minServiceMin },
  )
}
