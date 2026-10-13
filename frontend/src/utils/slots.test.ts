import { describe, expect, it } from 'vitest'
import { EnumScheduleMode, EnumSlotMode, type Master, type Service } from '@/api/types'
import { DEFAULT_LOOK } from '@/components/mascot/look'
import { EnumServiceCategory } from '@/components/services/category'
import { freeSlots, isWorkDay, startsFor } from '@/utils/slots'

// 2026-10-14 — среда (weekday '3'), Москва UTC+3
const DAY = '2026-10-14'
const NOW = new Date('2026-10-13T12:00:00Z')

function master(patch: Partial<Master> = {}): Master {
  return {
    id: 'm',
    name: 'Аня',
    slug: 'anya',
    timezone: 'Europe/Moscow',
    schedule_mode: EnumScheduleMode.Weekly,
    work_hours: { 3: [['10:00', '14:00']] },
    day_overrides: {},
    hour_templates: [],
    slot_mode: EnumSlotMode.Grid,
    work_slots: {},
    slot_overrides: {},
    slot_templates: [],
    slot_step_min: 30,
    mascot: DEFAULT_LOOK,
    ...patch,
  }
}

const service = (duration_min: number): Service => ({
  id: 's',
  master: 'm',
  name: 'Услуга',
  duration_min,
  price: 0,
  is_active: true,
  description: '',
  category: EnumServiceCategory.Other,
  sort: 0,
})

/** "HH:MM" по Москве → ISO */
const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00+03:00`).toISOString()

describe('freeSlots: сетка', () => {
  it('по шагу внутри часов', () => {
    const slots = freeSlots(master(), service(60), DAY, [], { now: NOW })
    expect(slots).toEqual(['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00'].map(at))
  })
})

describe('freeSlots: точное время', () => {
  const fixed = master({ slot_mode: EnumSlotMode.Fixed, work_slots: { 3: ['10:30', '12:30', '16:00'] } })

  it('только времена мастера, часы и шаг не важны', () => {
    expect(freeSlots(fixed, service(90), DAY, [], { now: NOW })).toEqual(['10:30', '12:30', '16:00'].map(at))
  })

  it('занятое время и пересечения с записями убираются', () => {
    const busy = [{ start_at: at('12:00'), end_at: at('13:00') }]
    expect(freeSlots(fixed, service(120), DAY, busy, { now: NOW })).toEqual(['16:00'].map(at))
  })

  it('прошедшие и слишком близкие убираются', () => {
    const now = new Date(at('10:00'))
    expect(freeSlots(fixed, service(60), DAY, [], { now, leadMin: 60 })).toEqual(['12:30', '16:00'].map(at))
  })

  it('фильтр пустых окон не применяется', () => {
    expect(freeSlots(fixed, service(30), DAY, [], { now: NOW, minServiceMin: 60 })).toHaveLength(3)
  })

  it('отметка на дату важнее шаблона, в режиме «по датам» без отметки — выходной', () => {
    const withOverride = { ...fixed, slot_overrides: { [DAY]: ['18:00'] } }
    expect(startsFor(withOverride, DAY)).toEqual(['18:00'])
    const dates = { ...fixed, schedule_mode: EnumScheduleMode.Dates }
    expect(isWorkDay(dates, DAY)).toBe(false)
    expect(isWorkDay({ ...dates, slot_overrides: { [DAY]: ['18:00'] } }, DAY)).toBe(true)
  })

  it('рабочий день определяется по временам, а не по часам', () => {
    expect(isWorkDay(master({ slot_mode: EnumSlotMode.Fixed }), DAY)).toBe(false)
    expect(isWorkDay(fixed, DAY)).toBe(true)
  })
})
