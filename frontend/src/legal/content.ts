// Форма текста юридического документа: экран документа рисует её как есть.

/** Блок раздела: строка — абзац, массив строк — список */
export type LegalBlock = string | string[]

/** Раздел документа */
export interface LegalSection {
  /** Заголовок раздела */
  heading: string
  /** Абзацы и списки по порядку */
  blocks: LegalBlock[]
}

/** Текст документа */
export interface LegalText {
  /** Название документа */
  title: string
  /** Вступление до первого раздела */
  intro: LegalBlock[]
  /** Разделы */
  sections: LegalSection[]
}
