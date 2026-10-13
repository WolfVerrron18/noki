// Цветовые темы мастера. Значения совпадают с ключами $palettes в styles/_palette.scss
// и хранятся в базе (masters.theme) — существующие не переименовываем.

/** Цветовая тема */
export enum EnumPalette {
  Rose = 'rose',
  Lavender = 'lavender',
  Mint = 'mint',
  Peach = 'peach',
  Sky = 'sky',
}

/** Тема по умолчанию — она же цвета приложения без мастера */
export const DEFAULT_PALETTE = EnumPalette.Rose

/** Все темы в порядке показа */
export const PALETTES: EnumPalette[] = Object.values(EnumPalette)

/**
 * Тема из базы: неизвестное или пустое значение — тема по умолчанию.
 * @param v значение поля masters.theme
 */
export function normalizePalette(v: unknown): EnumPalette {
  return PALETTES.includes(v as EnumPalette) ? (v as EnumPalette) : DEFAULT_PALETTE
}

/**
 * Поставить тему на всю страницу (атрибут data-palette на <html>).
 * @param palette тема; тема по умолчанию снимает атрибут
 */
export function applyPalette(palette: EnumPalette) {
  const root = document.documentElement
  if (palette === DEFAULT_PALETTE) delete root.dataset.palette
  else root.dataset.palette = palette
}
