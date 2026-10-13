import { EnumMascotHead } from '@/components/mascot/look'
import { EnumNokiHat } from '@/components/mascot/rive/character'

// Реестр деталей конструктора. Новая деталь: значение в enum (look.ts),
// состояние в Rive-файле (enum ViewModel) и строка здесь. Подпись — `mascot.hat.<id Rive>`.

/** Головной убор из конструктора → шапка в Rive */
export const MASCOT_HEAD: Record<EnumMascotHead, EnumNokiHat> = {
  [EnumMascotHead.Bow]: EnumNokiHat.Bow,
  [EnumMascotHead.Beret]: EnumNokiHat.Beret,
  [EnumMascotHead.Crown]: EnumNokiHat.OrigamiCrown,
  [EnumMascotHead.OrigamiBoat]: EnumNokiHat.OrigamiBoat,
  [EnumMascotHead.OrigamiTulip]: EnumNokiHat.OrigamiTulip,
  [EnumMascotHead.Beanie]: EnumNokiHat.Beanie,
  [EnumMascotHead.FlowerCrown]: EnumNokiHat.FlowerCrown,
  [EnumMascotHead.PartyHat]: EnumNokiHat.PartyHat,
  [EnumMascotHead.WitchHat]: EnumNokiHat.WitchHat,
  [EnumMascotHead.BunnyEars]: EnumNokiHat.BunnyEars,
  [EnumMascotHead.Sprout]: EnumNokiHat.Sprout,
  [EnumMascotHead.Halo]: EnumNokiHat.Halo,
  [EnumMascotHead.TopHat]: EnumNokiHat.TopHat,
}

/**
 * Шапка Rive для головного убора.
 * @param head головной убор из внешности, null — без
 */
export function hatOf(head: EnumMascotHead | null | undefined): EnumNokiHat {
  return head ? MASCOT_HEAD[head] ?? EnumNokiHat.None : EnumNokiHat.None
}
