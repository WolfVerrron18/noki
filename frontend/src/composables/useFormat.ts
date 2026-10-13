import { useI18n } from 'vue-i18n'

/**
 * Валюта цен. Пока одна на всё приложение;
 * когда появятся мастера из других стран — перенести в профиль мастера
 */
export const CURRENCY = 'RUB'

/** Форматирование длительности, цены, дат и времени по текущей локали */
export function useFormat() {
  const { t, locale } = useI18n()

  /**
   * Длительность: «45 мин», «1 ч», «1 ч 30 мин».
   * @param min минуты
   */
  function duration(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (!h) return t('duration.min', { m })
    if (!m) return t('duration.hours', { h })
    return t('duration.hoursMin', { h, m })
  }

  /**
   * Цена в валюте CURRENCY по правилам локали: «2 500 ₽», «RUB 2,500» — или «Бесплатно».
   * @param value цена
   */
  function price(value: number): string {
    if (!value) return t('price.free')
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(value)
  }

  /**
   * Время «10:30» в поясе мастера.
   * @param iso момент, ISO в UTC
   * @param tz пояс мастера
   */
  function time(iso: string, tz: string): string {
    return new Intl.DateTimeFormat(locale.value, { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
  }

  /**
   * Дата «понедельник, 12 октября» в поясе мастера.
   * @param iso момент, ISO в UTC
   * @param tz пояс мастера
   */
  function dateLong(iso: string, tz: string): string {
    return new Intl.DateTimeFormat(locale.value, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso))
  }

  /**
   * Подписи дня "YYYY-MM-DD" для полоски дат: «пн» и «12».
   * @param date день
   */
  function dayParts(date: string): { weekday: string; day: string; month: string } {
    const [y, m, d] = date.split('-').map(Number)
    const at = new Date(Date.UTC(y, m - 1, d, 12))
    const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', ...o }).format(at)
    return { weekday: fmt({ weekday: 'short' }), day: fmt({ day: 'numeric' }), month: fmt({ month: 'short' }) }
  }

  /**
   * Заголовок дня "YYYY-MM-DD": «Понедельник, 12 октября».
   * @param date день
   */
  function dayTitle(date: string): string {
    const [y, m, d] = date.split('-').map(Number)
    const text = new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(y, m - 1, d, 12)))
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  return { duration, price, time, dateLong, dayParts, dayTitle }
}
