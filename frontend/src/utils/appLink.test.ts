import { describe, expect, it } from 'vitest'
import { EnumStartParam, appLink } from '@/utils/appLink'
import { SLUG_RE } from '@/utils/slug'

describe('appLink', () => {
  it('без параметра — просто приложение', () => {
    expect(appLink('nidoki_bot', 'app')).toBe('https://t.me/nidoki_bot/app')
  })

  it('с адресом мастера', () => {
    expect(appLink('nidoki_bot', 'app', 'anna')).toBe('https://t.me/nidoki_bot/app?startapp=anna')
  })

  it('служебные значения не могут быть адресом мастера', () => {
    for (const p of Object.values(EnumStartParam)) expect(SLUG_RE.test(p)).toBe(false)
  })
})
