// Уведомления о записях: кому и что отправить. Пишем только тем, кто разрешил боту писать (users.write_access),
// на языке получателя. Ручные записи мастера уведомлений не шлют: клиентка без Telegram, мастер всё знает сама.
import { eq } from 'drizzle-orm'
import type { Db } from '~/db/client'
import { users, type AppointmentRow, type MasterRow } from '~/db/schema'
import type { Bot, BotMessage } from '~/bot/api'
import { botLang, type BotLang } from '~/bot/i18n'
import { clientBooked, clientCancelled, clientReminder, masterBooked, masterCancelled, type AppLinks, type BookingContext } from '~/bot/messages'

/** Уведомления о событиях записи */
export interface Notifications {
  /**
   * Клиентка записалась: мастеру — новая запись, клиентке — подтверждение.
   * @param appointment запись
   * @param master мастер
   */
  booked(appointment: AppointmentRow, master: MasterRow): Promise<void>
  /**
   * Запись отменили: клиентка — пишем мастеру, мастер — пишем клиентке.
   * @param appointment отменённая запись
   * @param master мастер
   */
  cancelled(appointment: AppointmentRow, master: MasterRow): Promise<void>
  /**
   * Напоминание клиентке.
   * @param appointment запись
   * @param master мастер
   * @returns отправлено ли
   */
  reminder(appointment: AppointmentRow, master: MasterRow): Promise<boolean>
}

/** Получатель: куда и на каком языке */
interface Recipient {
  /** Telegram id */
  chatId: number
  /** Язык */
  lang: BotLang
}

/**
 * Уведомления поверх бота.
 * @param db база
 * @param bot бот
 * @param links ссылки на мини-апп для кнопок
 */
export function notifications(db: Db, bot: Bot, links: AppLinks): Notifications {
  /**
   * Получатель, если ему можно писать.
   * @param where пользователь по id или по Telegram id
   */
  async function recipient(where: { id: string } | { telegramId: number }): Promise<Recipient | null> {
    const cond = 'id' in where ? eq(users.id, where.id) : eq(users.telegramId, where.telegramId)
    const [u] = await db.select().from(users).where(cond)
    return u?.writeAccess ? { chatId: u.telegramId, lang: botLang(u.languageCode) } : null
  }

  /**
   * Отправить, если получатель есть.
   * @param to получатель
   * @param build сообщение на его языке
   */
  async function send(to: Recipient | null, build: (lang: BotLang) => BotMessage): Promise<boolean> {
    return to ? bot.send(to.chatId, build(to.lang)) : false
  }

  const masterOf = (m: MasterRow) => recipient({ id: m.userId })
  const clientOf = (a: AppointmentRow) => (a.clientTelegramId ? recipient({ telegramId: a.clientTelegramId }) : Promise.resolve(null))

  return {
    async booked(appointment, master) {
      const ctx: BookingContext = { appointment, master }
      const [m, c] = await Promise.all([masterOf(master), clientOf(appointment)])
      await Promise.all([send(m, (l) => masterBooked(ctx, l, links)), send(c, (l) => clientBooked(ctx, l, links))])
    },

    async cancelled(appointment, master) {
      const ctx: BookingContext = { appointment, master }
      if (appointment.cancelledBy === 'client') await send(await masterOf(master), (l) => masterCancelled(ctx, l, links))
      else await send(await clientOf(appointment), (l) => clientCancelled(ctx, l, links))
    },

    async reminder(appointment, master) {
      return send(await clientOf(appointment), (l) => clientReminder({ appointment, master }, l, links))
    },
  }
}
