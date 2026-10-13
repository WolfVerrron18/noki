const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export const SLUG_RE = /^[a-z0-9_-]{3,40}$/

/** «Аня Ноготочки» → «anya_nogotochki» */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((c) => RU[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

/** Чистит ручной ввод: только разрешённые символы */
export function sanitizeSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
}
