import { describe, expect, it } from 'vitest'
import { INIT_DATA_MAX_AGE_SEC, signInitData, validateInitData } from '~/auth/telegram'

const TOKEN = '123:abc'
const NOW = 1_800_000_000

describe('validateInitData', () => {
  const data = signInitData({ auth_date: String(NOW), user: { id: 7, first_name: 'Аня' }, start_param: 'anna' }, TOKEN)

  it('принимает подписанные данные', () => {
    const res = validateInitData(data, TOKEN, NOW + 10)
    expect(res.user.id).toBe(7)
    expect(res.user.first_name).toBe('Аня')
    expect(res.startParam).toBe('anna')
  })

  it('отклоняет чужой токен бота', () => {
    expect(() => validateInitData(data, '999:zzz', NOW)).toThrow('bad signature')
  })

  it('отклоняет подменённые поля', () => {
    const forged = data.replace('anna', 'olga')
    expect(() => validateInitData(forged, TOKEN, NOW)).toThrow('bad signature')
  })

  it('отклоняет устаревшие данные', () => {
    expect(() => validateInitData(data, TOKEN, NOW + INIT_DATA_MAX_AGE_SEC + 1)).toThrow('expired')
  })

  it('отклоняет пустые данные', () => {
    expect(() => validateInitData('', TOKEN, NOW)).toThrow()
  })
})
