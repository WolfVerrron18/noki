// Сообщения бота о записях: только сборка текста и кнопок, без отправки
import { displayPhone } from '@/utils/phone'
import { EnumStartParam, appLink } from '@/utils/appLink'
import type { AppointmentRow, MasterRow } from '~/db/schema'
import type { BotMessage } from '~/bot/api'
import { formatWhen } from '~/bot/format'
import { bt, type BotLang } from '~/bot/i18n'

/** Куда ведут кнопки: мини-апп бота */
export interface AppLinks {
  /** Имя бота без @ */
  bot: string
  /** Короткое имя мини-аппа */
  app: string
}

/** Запись и мастер — всё, что нужно для текста */
export interface BookingContext {
  /** Запись */
  appointment: AppointmentRow
  /** Мастер записи */
  master: MasterRow
}

/**
 * Строки о записи: услуга и время в поясе мастера.
 * @param ctx запись и мастер
 * @param lang язык получателя
 */
const what = ({ appointment: a, master: m }: BookingContext, lang: BotLang) => [a.serviceName, formatWhen(a.startAt, m.timezone, lang)]

/**
 * Мастеру: новая запись от клиентки.
 * @param ctx запись и мастер
 * @param lang язык мастера
 * @param links ссылки на мини-апп
 */
export function masterBooked(ctx: BookingContext, lang: BotLang, links: AppLinks): BotMessage {
  const a = ctx.appointment
  return {
    title: bt(lang, 'master.booked'),
    lines: [
      ...what(ctx, lang),
      a.clientName,
      a.clientPhone && bt(lang, 'field.phone', { phone: displayPhone(a.clientPhone) }),
      a.note && bt(lang, 'field.note', { note: a.note }),
    ],
    buttons: [{ text: bt(lang, 'master.schedule'), url: appLink(links.bot, links.app, EnumStartParam.Schedule) }],
  }
}

/**
 * Мастеру: клиентка отменила запись.
 * @param ctx запись и мастер
 * @param lang язык мастера
 * @param links ссылки на мини-апп
 */
export function masterCancelled(ctx: BookingContext, lang: BotLang, links: AppLinks): BotMessage {
  return {
    title: bt(lang, 'master.cancelledByClient'),
    lines: [...what(ctx, lang), ctx.appointment.clientName],
    buttons: [{ text: bt(lang, 'master.schedule'), url: appLink(links.bot, links.app, EnumStartParam.Schedule) }],
  }
}

/**
 * Клиентке: запись подтверждена.
 * @param ctx запись и мастер
 * @param lang язык клиентки
 * @param links ссылки на мини-апп
 */
export function clientBooked(ctx: BookingContext, lang: BotLang, links: AppLinks): BotMessage {
  return {
    title: bt(lang, 'client.booked'),
    lines: [bt(lang, 'field.master', { master: ctx.master.name }), ...what(ctx, lang), '', bt(lang, 'client.cancelHint')],
    buttons: [{ text: bt(lang, 'client.my'), url: appLink(links.bot, links.app, EnumStartParam.My) }],
  }
}

/**
 * Клиентке: мастер отменила запись — можно выбрать другое время.
 * @param ctx запись и мастер
 * @param lang язык клиентки
 * @param links ссылки на мини-апп
 */
export function clientCancelled(ctx: BookingContext, lang: BotLang, links: AppLinks): BotMessage {
  return {
    title: bt(lang, 'client.cancelledByMaster'),
    lines: [bt(lang, 'field.master', { master: ctx.master.name }), ...what(ctx, lang)],
    buttons: [{ text: bt(lang, 'client.rebook'), url: appLink(links.bot, links.app, ctx.master.slug) }],
  }
}

/**
 * Клиентке: напоминание о записи.
 * @param ctx запись и мастер
 * @param lang язык клиентки
 * @param links ссылки на мини-апп
 */
export function clientReminder(ctx: BookingContext, lang: BotLang, links: AppLinks): BotMessage {
  return {
    title: bt(lang, 'client.reminder'),
    lines: [bt(lang, 'field.master', { master: ctx.master.name }), ...what(ctx, lang), '', bt(lang, 'client.cancelHint')],
    buttons: [{ text: bt(lang, 'client.my'), url: appLink(links.bot, links.app, EnumStartParam.My) }],
  }
}
