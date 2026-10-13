import { describe, expect, it } from 'vitest'
import { allowedTime, fromRanges, setPauseEdge, suggestPause, toRanges, validateDayHours, type DayHours } from '@/utils/hours'

const day = (from: string, to: string, ...pauses: [string, string][]): DayHours => ({ from, to, pauses })

describe('suggestPause', () => {
  it('без перерывов — час ровно посреди дня', () => {
    expect(suggestPause(day('10:00', '19:00'))).toEqual(['14:00', '15:00'])
  })

  it('сколько ни добавляй, перерыв всегда верный, пока есть место', () => {
    let h = day('10:00', '19:00')
    for (let i = 0; i < 20; i++) {
      const p = suggestPause(h)
      if (!p) break
      h = { ...h, pauses: [...h.pauses, p] }
      expect(validateDayHours(h)).toBeNull()
    }
    expect(suggestPause(h)).toBeNull()
  })

  it('не налезает на перерыв в конце дня (было 18:00–18:30 дважды)', () => {
    const h = day('10:00', '19:00', ['15:00', '16:00'], ['17:00', '18:00'])
    const p = suggestPause(h)!
    expect(validateDayHours({ ...h, pauses: [...h.pauses, p] })).toBeNull()
  })

  it('короткий день: перерыв внутри, а не с самого начала', () => {
    const p = suggestPause(day('10:00', '11:00'))!
    expect(validateDayHours({ ...day('10:00', '11:00'), pauses: [p] })).toBeNull()
  })

  it('места нет — null', () => {
    expect(suggestPause(day('10:00', '10:30'))).toBeNull()
  })

  it('ночной конец дня не ломает расчёт', () => {
    expect(suggestPause(day('19:00', '10:00'))).toBeNull()
  })
})

describe('setPauseEdge', () => {
  it('начало переносит перерыв целиком', () => {
    expect(setPauseEdge(['13:00', '14:00'], 0, '16:30')).toEqual(['16:30', '17:30'])
  })

  it('конец меняет длительность', () => {
    expect(setPauseEdge(['13:00', '14:00'], 1, '14:30')).toEqual(['13:00', '14:30'])
  })
})

describe('allowedTime', () => {
  const h = day('10:00', '19:00', ['12:00', '13:00'], ['15:00', '16:00'])

  it('перерыв можно перенести через соседний', () => {
    expect(allowedTime(h, { pause: 0, side: 0 }, '16:30')).toBe(true)
  })

  it('нельзя поставить перерыв на соседний или вплотную к нему', () => {
    expect(allowedTime(h, { pause: 0, side: 0 }, '14:30')).toBe(false)
    expect(allowedTime(h, { pause: 0, side: 0 }, '16:00')).toBe(false)
    expect(allowedTime(h, { pause: 0, side: 1 }, '15:00')).toBe(false)
  })

  it('нельзя выйти за рабочий день', () => {
    expect(allowedTime(h, { pause: 1, side: 0 }, '18:00')).toBe(false)
    expect(allowedTime(h, 'to', '15:30')).toBe(false)
    expect(allowedTime(h, 'from', '12:00')).toBe(false)
  })

  it('дубль из старых данных можно исправить', () => {
    const broken = day('10:00', '19:00', ['18:00', '18:30'], ['18:00', '18:30'])
    expect(allowedTime(broken, { pause: 1, side: 0 }, '14:00')).toBe(true)
  })
})

describe('toRanges / fromRanges', () => {
  it('туда и обратно с перерывами по порядку', () => {
    const h = day('10:00', '19:00', ['15:00', '16:00'], ['12:00', '13:00'])
    expect(fromRanges(toRanges(h))).toEqual(day('10:00', '19:00', ['12:00', '13:00'], ['15:00', '16:00']))
  })
})
