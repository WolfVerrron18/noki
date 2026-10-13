/**
 * Вариант выбора для NokiSelect и NokiSegmented.
 * @template T тип значения
 */
export interface SelectOption<T = string> {
  /** Значение, которое попадёт в v-model */
  value: T
  /** Подпись для пользователя (уже переведённая) */
  label: string
}
