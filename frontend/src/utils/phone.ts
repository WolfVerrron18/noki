/**
 * Похоже ли на номер телефона: от 10 до 15 цифр, допускаются +, пробелы, скобки и дефисы.
 * @param value введённый номер
 */
export function isValidPhone(value: string): boolean {
  if (!/^[\d\s()+-]+$/.test(value.trim())) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}
