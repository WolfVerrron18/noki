import { describe, expect, it } from 'vitest'
import { sortTimes, suggestTime, timesCellLabel, timesFromRanges, timesKey, timesLabel } from '@/utils/daySlots'

describe('suggestTime', () => {
  it('пустой день — 10:00, дальше через два часа после последнего', () => {
    expect(suggestTime([])).toBe('10:00')
    expect(suggestTime(['10:30', '12:30'])).toBe('14:30')
  })

  it('после последнего места нет — свободный час с утра', () => {
    expect(suggestTime(['08:00', '22:30'])).toBe('09:00')
  })

  it('свободного часа нет — null', () => {
    const all = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)
    expect(suggestTime(all)).toBeNull()
  })
})

describe('подписи и порядок', () => {
  it('сортировка без повторов', () => {
    expect(sortTimes(['12:30', '10:30', '12:30'])).toEqual(['10:30', '12:30'])
  })

  it('подписи', () => {
    expect(timesCellLabel(['10:30', '12:30', '15:00'])).toBe('10:30 +2')
    expect(timesCellLabel(['09:00'])).toBe('9')
    expect(timesLabel(['10:30', '15:00'])).toBe('10:30, 15')
  })

  it('ключ не зависит от порядка', () => {
    expect(timesKey(['12:30', '10:30'])).toBe(timesKey(['10:30', '12:30']))
  })
})

describe('timesFromRanges', () => {
  it('каждые два часа внутри рабочих интервалов', () => {
    expect(timesFromRanges([['10:00', '19:00']])).toEqual(['10:00', '12:00', '14:00', '16:00', '18:00'])
    expect(timesFromRanges([['10:00', '13:00'], ['14:00', '16:00']])).toEqual(['10:00', '12:00', '14:00'])
    expect(timesFromRanges(undefined)).toEqual([])
  })
})
