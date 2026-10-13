// Справочник категорий услуг. Значения хранятся в базе (services.category) — существующие не переименовываем.
// Новая категория: значение здесь → иконка в icons/ → строка в registry.ts → перевод services.category.<id>.

/** Вид услуги: одна категория на услугу */
export enum EnumServiceCategory {
  /** Маникюр и педикюр */
  Manicure = 'manicure',
  Brows = 'brows',
  Lashes = 'lashes',
  Makeup = 'makeup',
  /** Стрижка, укладка, окрашивание */
  Hair = 'hair',
  Face = 'face',
  Massage = 'massage',
  Depilation = 'depilation',
  Body = 'body',
  Other = 'other',
}

/** Все категории в порядке показа */
export const SERVICE_CATEGORIES: EnumServiceCategory[] = Object.values(EnumServiceCategory)

/** Категории, которые объединили с другими: старое значение → новое */
const MERGED: Record<string, EnumServiceCategory> = {
  pedicure: EnumServiceCategory.Manicure,
  coloring: EnumServiceCategory.Hair,
}

/**
 * Категория из базы: объединённые переводятся в новые, неизвестное или пустое значение становится «Другое».
 * @param v значение из базы
 */
export function normalizeCategory(v: unknown): EnumServiceCategory {
  if (SERVICE_CATEGORIES.includes(v as EnumServiceCategory)) return v as EnumServiceCategory
  return MERGED[String(v)] ?? EnumServiceCategory.Other
}
