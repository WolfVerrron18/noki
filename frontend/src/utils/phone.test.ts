import { describe, expect, it } from 'vitest'
import { displayPhone, formatPhoneInput, normalizePhone, phoneCountry } from '@/utils/phone'

describe('phoneCountry', () => {
  it('по поясу мастера, иначе Россия', () => {
    expect(phoneCountry('Asia/Almaty')).toBe('KZ')
    expect(phoneCountry('Europe/Moscow')).toBe('RU')
    expect(phoneCountry('America/New_York')).toBe('RU')
    expect(phoneCountry(undefined)).toBe('RU')
  })
})

describe('formatPhoneInput', () => {
  it('маска по мере ввода', () => {
    expect(formatPhoneInput('+79001234567', 'RU')).toBe('+7 900 123 45 67')
    expect(formatPhoneInput('89001234567', 'RU')).toBe('8 (900) 123-45-67')
    expect(formatPhoneInput('+7900', 'RU')).toBe('+7 900')
  })

  it('мусор и лишние плюсы выбрасываются', () => {
    expect(formatPhoneInput('+7 (900) abc 12+3', 'RU')).toBe('+7 900 123')
    expect(formatPhoneInput('abc', 'RU')).toBe('')
  })
})

describe('normalizePhone', () => {
  it('разные записи одного номера → E.164', () => {
    for (const v of ['+7 900 123-45-67', '8 (900) 123-45-67', '9001234567', '+7(900)1234567']) {
      expect(normalizePhone(v, 'RU')).toBe('+79001234567')
    }
  })

  it('иностранный номер с плюсом', () => {
    expect(normalizePhone('+44 7911 123456', 'RU')).toBe('+447911123456')
  })

  it('неполный или неверный — null', () => {
    expect(normalizePhone('+7 900 123', 'RU')).toBeNull()
    expect(normalizePhone('', 'RU')).toBeNull()
    expect(normalizePhone('12345', 'RU')).toBeNull()
  })
})

describe('displayPhone', () => {
  it('E.164 → международный вид', () => {
    expect(displayPhone('+79001234567')).toBe('+7 900 123 45 67')
    expect(displayPhone('как-то так')).toBe('как-то так')
  })
})
