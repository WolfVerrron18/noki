import { EnumServiceCategory } from '@/components/services/category'

// Типовые услуги по категориям: подсказки при создании услуги (название + длительность, цену мастер вводит сама).
// Только самые частые услуги категории, по прайсам студий и сервисов записи; редкие сюда не берём.
// Новая подсказка: строка здесь → перевод services.preset.<id> в локалях.

/** Типовая услуга */
export interface ServicePreset {
  /** id, он же ключ перевода services.preset.<id> */
  id: string
  /** Обычная длительность, минуты */
  duration_min: number
}

/** Подсказки по категориям, в порядке показа. Пустой список — подсказок нет */
export const SERVICE_PRESETS: Record<EnumServiceCategory, ServicePreset[]> = {
  [EnumServiceCategory.Manicure]: [
    { id: 'manicureGel', duration_min: 90 },
    { id: 'manicureClassic', duration_min: 60 },
    { id: 'pedicureGel', duration_min: 90 },
    { id: 'pedicureClassic', duration_min: 60 },
    { id: 'nailExtension', duration_min: 150 },
    { id: 'nailExtensionCorrection', duration_min: 120 },
    { id: 'nailRemoval', duration_min: 30 },
  ],
  [EnumServiceCategory.Brows]: [
    { id: 'browArchitecture', duration_min: 60 },
    { id: 'browShaping', duration_min: 30 },
    { id: 'browTint', duration_min: 30 },
    { id: 'browLamination', duration_min: 60 },
    { id: 'browLaminationTint', duration_min: 90 },
  ],
  [EnumServiceCategory.Lashes]: [
    { id: 'lashClassic', duration_min: 120 },
    { id: 'lashVolume', duration_min: 150 },
    { id: 'lashMegaVolume', duration_min: 180 },
    { id: 'lashCorrection', duration_min: 90 },
    { id: 'lashLamination', duration_min: 60 },
    { id: 'lashRemoval', duration_min: 30 },
  ],
  [EnumServiceCategory.Makeup]: [
    { id: 'makeupDay', duration_min: 60 },
    { id: 'makeupEvening', duration_min: 90 },
    { id: 'makeupWedding', duration_min: 90 },
    { id: 'makeupWithHairstyle', duration_min: 150 },
  ],
  [EnumServiceCategory.Hair]: [
    { id: 'haircut', duration_min: 60 },
    { id: 'hairColorOneTone', duration_min: 120 },
    { id: 'hairColorComplex', duration_min: 240 },
    { id: 'hairStyling', duration_min: 60 },
    { id: 'hairstyle', duration_min: 90 },
    { id: 'hairCare', duration_min: 90 },
  ],
  [EnumServiceCategory.Face]: [
    { id: 'faceCleansingCombined', duration_min: 90 },
    { id: 'faceCleansingUltrasonic', duration_min: 60 },
    { id: 'facePeeling', duration_min: 60 },
    { id: 'faceCare', duration_min: 60 },
    { id: 'faceMassage', duration_min: 30 },
  ],
  [EnumServiceCategory.Massage]: [
    { id: 'massageClassic', duration_min: 60 },
    { id: 'massageBack', duration_min: 30 },
    { id: 'massageAnticellulite', duration_min: 60 },
    { id: 'massageLymphatic', duration_min: 60 },
    { id: 'massageRelax', duration_min: 90 },
  ],
  [EnumServiceCategory.Depilation]: [
    { id: 'depilationBikini', duration_min: 30 },
    { id: 'depilationUnderarms', duration_min: 15 },
    { id: 'depilationLegsKnee', duration_min: 30 },
    { id: 'depilationLegsFull', duration_min: 45 },
    { id: 'depilationComplex', duration_min: 90 },
  ],
  [EnumServiceCategory.Body]: [
    { id: 'bodyWrap', duration_min: 60 },
    { id: 'bodyPeeling', duration_min: 45 },
    { id: 'bodySpa', duration_min: 120 },
  ],
  [EnumServiceCategory.Other]: [],
}
