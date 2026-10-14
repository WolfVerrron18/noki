// Тексты юридических документов с реквизитами оператора. Документы только на русском — юридически значимая редакция.
import type { EnumLegalDoc } from '@/api/types'
import type { LegalText } from '@/legal/content'
import { OPERATOR } from '@/legal/operator'
import { legalTextsRu } from '@/legal/texts/ru'

/** Тексты собираются один раз: реквизиты не меняются во время работы */
let cache: Record<EnumLegalDoc, LegalText> | null = null

/**
 * Получить текст документа.
 * @returns функция «документ → текст»
 */
export function useLegalText(): (doc: EnumLegalDoc) => LegalText {
  cache ??= legalTextsRu(OPERATOR)
  return (doc) => cache![doc]
}
