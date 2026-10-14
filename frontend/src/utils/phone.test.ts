import { describe, expect, it } from 'vitest'
import { displayPhone, formatPhoneInput, joinPhone, normalizePhone, phoneCountry, splitPhone } from '@/utils/phone'

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

describe('splitPhone', () => {
  it('вставка одного номера в любой записи → +7 и номер без кода', () => {
    for (const v of ['89270576065', '79270576065', '+79270576065', '8-(927)-057-60-65', '+7 (927) 057-60-65', '8 927 057 60 65', '9270576065', '007 927 057 60 65']) {
      expect(splitPhone(v, 'RU')).toEqual({ code: '7', national: '9270576065' })
    }
  })

  it('городской номер с 8 не теряет код города', () => {
    expect(splitPhone('8 812 123-45-67', 'RU')).toEqual({ code: '7', national: '8121234567' })
  })

  it('пока номер неполный, цифры как есть', () => {
    expect(splitPhone('927', 'RU')).toEqual({ code: '7', national: '927' })
    expect(splitPhone('8', 'RU')).toEqual({ code: '7', national: '8' })
    expect(splitPhone('', 'RU')).toEqual({ code: '7', national: '' })
  })

  it('чужой код с плюсом сохраняется', () => {
    expect(splitPhone('+380 50 123 45 67', 'RU')).toEqual({ code: '380', national: '501234567' })
  })
})

describe('joinPhone', () => {
  it('код и номер с маской, пустой — пусто', () => {
    expect(joinPhone({ code: '7', national: '9270576065' })).toBe('+7 927 057 60 65')
    expect(joinPhone({ code: '7', national: '' })).toBe('')
    expect(normalizePhone(joinPhone(splitPhone('89270576065', 'RU')), 'RU')).toBe('+79270576065')
  })
})
