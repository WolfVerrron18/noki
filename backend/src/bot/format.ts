// Дата и время записи в сообщениях — в поясе мастера и на языке получателя
import dayjs from '@/utils/date'
import type { BotLang } from '~/bot/i18n'

/**
 * «чт, 15 октября, 11:00» — момент в поясе мастера.
 * @param at момент
 * @param tz пояс мастера
 * @param lang язык получателя
 */
export function formatWhen(at: Date, tz: string, lang: BotLang): string {
  return dayjs(at).tz(tz).locale(lang).format(lang === 'ru' ? 'dd, D MMMM, HH:mm' : 'ddd, D MMMM, HH:mm')
}
