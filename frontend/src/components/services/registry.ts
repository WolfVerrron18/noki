import type { Component } from 'vue'
import { EnumServiceCategory } from '@/components/services/category'
import ManicureIcon from '@/components/services/icons/ManicureIcon.vue'
import BrowsIcon from '@/components/services/icons/BrowsIcon.vue'
import LashesIcon from '@/components/services/icons/LashesIcon.vue'
import MakeupIcon from '@/components/services/icons/MakeupIcon.vue'
import HairIcon from '@/components/services/icons/HairIcon.vue'
import FaceIcon from '@/components/services/icons/FaceIcon.vue'
import MassageIcon from '@/components/services/icons/MassageIcon.vue'
import DepilationIcon from '@/components/services/icons/DepilationIcon.vue'
import BodyIcon from '@/components/services/icons/BodyIcon.vue'
import OtherIcon from '@/components/services/icons/OtherIcon.vue'

/** Категория для показа */
export interface CategoryDef {
  /** Иконка: корень — <g> с линиями в координатах viewBox 0..24 */
  icon: Component
  /** Ключ i18n с названием */
  label: string
}

/** Категории услуг: иконка и название */
export const CATEGORY_DEFS: Record<EnumServiceCategory, CategoryDef> = {
  [EnumServiceCategory.Manicure]: { icon: ManicureIcon, label: 'services.category.manicure' },
  [EnumServiceCategory.Brows]: { icon: BrowsIcon, label: 'services.category.brows' },
  [EnumServiceCategory.Lashes]: { icon: LashesIcon, label: 'services.category.lashes' },
  [EnumServiceCategory.Makeup]: { icon: MakeupIcon, label: 'services.category.makeup' },
  [EnumServiceCategory.Hair]: { icon: HairIcon, label: 'services.category.hair' },
  [EnumServiceCategory.Face]: { icon: FaceIcon, label: 'services.category.face' },
  [EnumServiceCategory.Massage]: { icon: MassageIcon, label: 'services.category.massage' },
  [EnumServiceCategory.Depilation]: { icon: DepilationIcon, label: 'services.category.depilation' },
  [EnumServiceCategory.Body]: { icon: BodyIcon, label: 'services.category.body' },
  [EnumServiceCategory.Other]: { icon: OtherIcon, label: 'services.category.other' },
}
