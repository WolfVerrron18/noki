import type { Component } from 'vue'
import {
  EnumMascotBackground,
  EnumMascotBadge,
  EnumMascotFur,
  EnumMascotHead,
  EnumMascotNeck,
} from '@/components/mascot/look'
import SolidBackground from '@/components/mascot/parts/background/SolidBackground.vue'
import HeartsBackground from '@/components/mascot/parts/background/HeartsBackground.vue'
import StarsBackground from '@/components/mascot/parts/background/StarsBackground.vue'
import BowHead from '@/components/mascot/parts/head/BowHead.vue'
import BeretHead from '@/components/mascot/parts/head/BeretHead.vue'
import CrownHead from '@/components/mascot/parts/head/CrownHead.vue'
import ScarfNeck from '@/components/mascot/parts/neck/ScarfNeck.vue'
import BowtieNeck from '@/components/mascot/parts/neck/BowtieNeck.vue'
import BrushBadge from '@/components/mascot/parts/badge/BrushBadge.vue'
import PolishBadge from '@/components/mascot/parts/badge/PolishBadge.vue'
import ScissorsBadge from '@/components/mascot/parts/badge/ScissorsBadge.vue'

// Реестр деталей конструктора. Новая деталь: значение в enum (look.ts),
// SVG-компонент в parts/<слой>/ и строка здесь.

/** Деталь-картинка */
export interface PartDef {
  /** SVG-фрагмент, корень — <g> в координатах viewBox 0..200 */
  component: Component
  /** Ключ i18n с названием детали */
  label: string
}

/** Окрас: какое семейство палитры красит шёрстку */
export interface FurDef {
  /** Семейство цветов из палитры (см. styles/_palette.scss) */
  token: 'primary' | 'secondary' | 'cute' | 'success' | 'warning'
  /** Ключ i18n с названием окраса */
  label: string
}

/** Окрасы шёрстки */
export const MASCOT_FUR: Record<EnumMascotFur, FurDef> = {
  [EnumMascotFur.Pink]: { token: 'primary', label: 'mascot.fur.pink' },
  [EnumMascotFur.Lavender]: { token: 'secondary', label: 'mascot.fur.lavender' },
  [EnumMascotFur.Peach]: { token: 'cute', label: 'mascot.fur.peach' },
  [EnumMascotFur.Mint]: { token: 'success', label: 'mascot.fur.mint' },
  [EnumMascotFur.Cream]: { token: 'warning', label: 'mascot.fur.cream' },
}

/** Фоны */
export const MASCOT_BACKGROUND: Record<EnumMascotBackground, PartDef> = {
  [EnumMascotBackground.Solid]: { component: SolidBackground, label: 'mascot.background.solid' },
  [EnumMascotBackground.Hearts]: { component: HeartsBackground, label: 'mascot.background.hearts' },
  [EnumMascotBackground.Stars]: { component: StarsBackground, label: 'mascot.background.stars' },
}

/** Головные уборы */
export const MASCOT_HEAD: Record<EnumMascotHead, PartDef> = {
  [EnumMascotHead.Bow]: { component: BowHead, label: 'mascot.head.bow' },
  [EnumMascotHead.Beret]: { component: BeretHead, label: 'mascot.head.beret' },
  [EnumMascotHead.Crown]: { component: CrownHead, label: 'mascot.head.crown' },
}

/** Украшения на шее */
export const MASCOT_NECK: Record<EnumMascotNeck, PartDef> = {
  [EnumMascotNeck.Scarf]: { component: ScarfNeck, label: 'mascot.neck.scarf' },
  [EnumMascotNeck.Bowtie]: { component: BowtieNeck, label: 'mascot.neck.bowtie' },
}

/** Значки специализации */
export const MASCOT_BADGE: Record<EnumMascotBadge, PartDef> = {
  [EnumMascotBadge.Brush]: { component: BrushBadge, label: 'mascot.badge.brush' },
  [EnumMascotBadge.Polish]: { component: PolishBadge, label: 'mascot.badge.polish' },
  [EnumMascotBadge.Scissors]: { component: ScissorsBadge, label: 'mascot.badge.scissors' },
}
