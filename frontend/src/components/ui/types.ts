/**
 * Вариант выбора для NokiSelect, NokiSegmented и NokiChoiceCards.
 * @template T тип значения
 */
export interface SelectOption<T = string> {
  /** Значение, которое попадёт в v-model */
  value: T
  /** Подпись для пользователя (уже переведённая) */
  label: string
  /** Пояснение под подписью (уже переведённое); показывает только NokiChoiceCards */
  hint?: string
}
