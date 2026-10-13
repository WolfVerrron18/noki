import type { InjectionKey, Ref } from 'vue'

// Внешность Ноки: что мастер выбрала в конструкторе.
// Значения enum'ов хранятся в базе (поле masters.mascot) — не переименовывать существующие.

/** Окрас шёрстки */
export enum EnumMascotFur {
  Pink = 'pink',
  Lavender = 'lavender',
  Peach = 'peach',
  Mint = 'mint',
  Cream = 'cream',
}

/** Фон за Ноки */
export enum EnumMascotBackground {
  Solid = 'solid',
  Hearts = 'hearts',
  Stars = 'stars',
}

/** Головной убор. Каждому соответствует шапка в Rive (components/mascot/registry.ts) */
export enum EnumMascotHead {
  Bow = 'bow',
  Beret = 'beret',
  Crown = 'crown',
  OrigamiBoat = 'origamiBoat',
  OrigamiTulip = 'origamiTulip',
  Beanie = 'beanie',
  FlowerCrown = 'flowerCrown',
  PartyHat = 'partyHat',
  WitchHat = 'witchHat',
  BunnyEars = 'bunnyEars',
  Sprout = 'sprout',
  Halo = 'halo',
  TopHat = 'topHat',
}

/** Украшение на шее */
export enum EnumMascotNeck {
  Scarf = 'scarf',
  Bowtie = 'bowtie',
}

/** Значок специализации: предмет в лапке */
export enum EnumMascotBadge {
  Brush = 'brush',
  Polish = 'polish',
  Scissors = 'scissors',
}

/** Внешность Ноки. null — слой не выбран */
export interface NokiLook {
  /** Окрас шёрстки */
  fur: EnumMascotFur
  /** Фон за Ноки */
  background: EnumMascotBackground | null
  /** Головной убор */
  head: EnumMascotHead | null
  /** Украшение на шее */
  neck: EnumMascotNeck | null
  /** Значок специализации в лапке */
  badge: EnumMascotBadge | null
}

/**
 * Внешность Ноки из контекста экрана: NokiMascot без пропа look берёт её отсюда.
 * App даёт Ноки текущего мастера, страницы записи клиентки — Ноки того мастера, к которому она записывается.
 */
export const NOKI_LOOK_KEY: InjectionKey<Ref<NokiLook | undefined>> = Symbol('nokiLook')

/** Ноки по умолчанию: розовый, без нарядов */
export const DEFAULT_LOOK: NokiLook = {
  fur: EnumMascotFur.Pink,
  background: null,
  head: null,
  neck: null,
  badge: null,
}

/** Значение входит в enum */
function isIn<T extends string>(e: Record<string, T>, v: unknown): v is T {
  return typeof v === 'string' && (Object.values(e) as string[]).includes(v)
}

/**
 * Привести сырые данные из базы к NokiLook.
 * Неизвестные id (деталь удалили из проекта) превращаются в «не выбрано», а не ломают отрисовку.
 * @param raw значение поля masters.mascot
 */
export function normalizeLook(raw: unknown): NokiLook {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    fur: isIn(EnumMascotFur, r.fur) ? r.fur : DEFAULT_LOOK.fur,
    background: isIn(EnumMascotBackground, r.background) ? r.background : null,
    head: isIn(EnumMascotHead, r.head) ? r.head : null,
    neck: isIn(EnumMascotNeck, r.neck) ? r.neck : null,
    badge: isIn(EnumMascotBadge, r.badge) ? r.badge : null,
  }
}
