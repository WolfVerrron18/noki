// Ссылки на мини-апп: t.me/<бот>/<приложение>?startapp=<параметр>. Общий модуль фронта и бота.
// Параметр — адрес мастера (страница записи) или служебное значение короче 3 символов:
// адрес мастера не короче 3 (SLUG_RE), поэтому они не пересекаются.

/** Служебные значения startapp */
export enum EnumStartParam {
  /** «Мои записи» клиентки */
  My = 'my',
  /** Расписание мастера */
  Schedule = 'sc',
}

/**
 * Ссылка на мини-апп.
 * @param bot имя бота без @
 * @param app короткое имя мини-аппа из BotFather
 * @param param адрес мастера или служебное значение; пусто — просто открыть приложение
 */
export function appLink(bot: string, app: string, param?: string): string {
  const base = `https://t.me/${bot}/${app}`
  return param ? `${base}?startapp=${encodeURIComponent(param)}` : base
}
