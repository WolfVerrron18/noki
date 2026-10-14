// Напоминания клиенткам. Записалась заранее — напоминаем за сутки, в тот же день — за 2 часа
// (если до записи осталось меньше 2 часов, подтверждение и так свежее — не напоминаем).
// Запускается по таймеру; каждая запись «забирается» атомарно, поэтому напоминание уходит один раз.
import { and, eq, gt, isNotNull, lte, or, sql } from 'drizzle-orm'
import type { Db } from '~/db/client'
import { appointments, masters } from '~/db/schema'
import type { Notifications } from '~/bot/notify'

/** Записалась минимум за столько минут — напоминаем за сутки */
export const REMINDER_DAY_MIN = 24 * 60
/** Иначе — за столько минут до начала */
export const REMINDER_SOON_MIN = 2 * 60

const minutes = (n: number) => sql.raw(`interval '${n} minutes'`)

/**
 * Отправить напоминания, которым пришло время.
 * @param db база
 * @param notify уведомления
 * @param now текущий момент
 * @returns сколько напоминаний отправлено
 */
export async function sendReminders(db: Db, notify: Notifications, now: Date): Promise<number> {
  const at = (min: number) => new Date(now.getTime() + min * 60000)
  const lead = sql`${appointments.startAt} - ${appointments.createdAt}`
  const due = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.status, 'booked'),
        eq(appointments.reminderSent, false),
        isNotNull(appointments.clientTelegramId),
        gt(appointments.startAt, now),
        or(
          and(sql`${lead} >= ${minutes(REMINDER_DAY_MIN)}`, lte(appointments.startAt, at(REMINDER_DAY_MIN))),
          and(sql`${lead} < ${minutes(REMINDER_DAY_MIN)}`, sql`${lead} > ${minutes(REMINDER_SOON_MIN)}`, lte(appointments.startAt, at(REMINDER_SOON_MIN))),
        ),
      ),
    )

  let sent = 0
  for (const { id } of due) {
    // забрать запись: если другой запуск уже отправил, строка не обновится
    const [claimed] = await db
      .update(appointments)
      .set({ reminderSent: true })
      .where(and(eq(appointments.id, id), eq(appointments.reminderSent, false)))
      .returning()
    if (!claimed) continue
    const [master] = await db.select().from(masters).where(eq(masters.id, claimed.masterId))
    if (master && (await notify.reminder(claimed, master))) sent++
  }
  return sent
}
