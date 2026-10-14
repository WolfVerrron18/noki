<template>
  <div class="calendar">
    <div class="nav">
      <button v-press="{ depth: 0.12 }" type="button" class="arrow" :disabled="!canPrev" :aria-label="t('schedule.prev')" @click="shift(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <span class="title">{{ mode === 'week' ? weekTitle : monthTitle }}</span>
      <slot name="nav-extra" />
      <button v-press="{ depth: 0.12 }" type="button" class="arrow" :disabled="!canNext" :aria-label="t('schedule.next')" @click="shift(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>

    <div
      class="grid"
      :class="{ draggable: dragSelect }"
      role="grid"
      @pointerdown="dragStart"
      @pointermove="dragMove"
      @pointerup="dragEnd"
      @pointercancel="dragEnd"
    >
      <span v-for="w in weekdayNames" :key="w" class="wd">{{ w }}</span>
      <span v-for="n in (mode === 'week' ? 0 : leadingBlanks)" :key="`b${n}`" />
      <button
        v-for="d in shownDays"
        :key="d.date"
        v-press="{ depth: 0.1 }"
        v-pop="isSelected(d.date)"
        type="button"
        class="day"
        :class="[toneOf?.(d.date), { selected: isSelected(d.date), past: d.past, today: d.isToday }]"
        :disabled="d.past && disablePast"
        :data-date="d.past && disablePast ? undefined : d.date"
        :aria-pressed="isSelected(d.date)"
        @click="onClick(d.date)"
      >
        <span class="num">{{ d.day }}</span>
        <slot name="day" :date="d.date" :past="d.past" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Календарь на месяц: сетка с понедельника, навигация, выделение. Содержимое клетки — слот #day.
// Используется и как редактор графика, и как просмотр записей.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from '@/utils/date'
import { DAY_FORMAT, todayIn } from '@/utils/slots'
import { haptic } from '@/telegram'

/** Оформление клетки: рабочий день, день с записями */
export type CalendarTone = 'work' | 'busy' | undefined

/** Пропсы NokiCalendar */
interface Props {
  /** Пояс мастера: «сегодня» и прошедшие дни считаются в нём */
  timezone: string
  /** Выделенные дни "YYYY-MM-DD" */
  selected?: ReadonlySet<string>
  /** Оформление клетки по дате */
  toneOf?: (date: string) => CalendarTone
  /** Прошедшие дни нельзя нажать (редактор). По умолчанию да */
  disablePast?: boolean
  /** Сколько месяцев назад можно листать. По умолчанию 0 */
  monthsBack?: number
  /** Сколько месяцев вперёд можно листать. По умолчанию 3 */
  monthsAhead?: number
  /** Что показывать: месяц или одну неделю. По умолчанию месяц */
  mode?: 'month' | 'week'
  /** Выбор протягиванием пальцем или мышью: событие paint на каждый задетый день */
  dragSelect?: boolean
}

/** События NokiCalendar */
interface Emits {
  /** Нажали на день */
  pick: [date: string]
  /**
   * Протянули по дню при dragSelect.
   * @param date день
   * @param on выделить (true) или снять выделение — решается по первому дню протягивания
   */
  paint: [date: string, on: boolean]
}

const props = withDefaults(defineProps<Props>(), { disablePast: true, monthsBack: 0, monthsAhead: 3, mode: 'month', dragSelect: false })
const emit = defineEmits<Emits>()
/** Показываемый месяц "YYYY-MM" */
const month = defineModel<string>('month', { required: true })

const { t, locale } = useI18n()

const today = computed(() => todayIn(props.timezone))
const minMonth = computed(() => dayjs.utc(today.value, DAY_FORMAT).subtract(props.monthsBack, 'month').format('YYYY-MM'))
const maxMonth = computed(() => dayjs.utc(today.value, DAY_FORMAT).add(props.monthsAhead, 'month').format('YYYY-MM'))

const isSelected = (date: string) => !!props.selected?.has(date)

const monthTitle = computed(() => {
  const text = new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
    dayjs.utc(`${month.value}-01`, DAY_FORMAT).toDate(),
  )
  return text.charAt(0).toUpperCase() + text.slice(1)
})

/** Короткие названия дней недели с понедельника (2024-01-01 — понедельник) */
const weekdayNames = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', weekday: 'short' }).format(dayjs.utc('2024-01-01', DAY_FORMAT).add(i, 'day').toDate()),
  ),
)

const leadingBlanks = computed(() => {
  const js = dayjs.utc(`${month.value}-01`, DAY_FORMAT).day()
  return js === 0 ? 6 : js - 1
})

const days = computed(() => {
  const start = dayjs.utc(`${month.value}-01`, DAY_FORMAT)
  return Array.from({ length: start.daysInMonth() }, (_, i) => {
    const date = start.add(i, 'day').format(DAY_FORMAT)
    return { date, day: i + 1, past: date < today.value, isToday: date === today.value }
  })
})

/** Понедельник недели, в которой лежит день */
const mondayOf = (date: string) => {
  const d = dayjs.utc(date, DAY_FORMAT)
  return d.subtract((d.day() + 6) % 7, 'day').format(DAY_FORMAT)
}

/** Первый день показываемой недели (режим week) */
const weekStart = ref(mondayOf(today.value))
const minWeek = computed(() => mondayOf(`${minMonth.value}-01`))
const maxWeek = computed(() => mondayOf(dayjs.utc(`${maxMonth.value}-01`, DAY_FORMAT).endOf('month').format(DAY_FORMAT)))

// переключили на неделю — открываем неделю с сегодняшним днём, если он в этом месяце, иначе первую неделю месяца
watch(
  () => props.mode,
  (m) => {
    if (m !== 'week') return
    weekStart.value = mondayOf(today.value.startsWith(month.value) ? today.value : `${month.value}-01`)
  },
  { immediate: true },
)

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = dayjs.utc(weekStart.value, DAY_FORMAT).add(i, 'day').format(DAY_FORMAT)
    return { date, day: Number(date.slice(8)), past: date < today.value, isToday: date === today.value }
  }),
)

const shownDays = computed(() => (props.mode === 'week' ? weekDays.value : days.value))

/** «5–11 окт.» или «28 сент. – 4 окт.» */
const weekTitle = computed(() => {
  const a = dayjs.utc(weekStart.value, DAY_FORMAT)
  const b = a.add(6, 'day')
  const fmt = (d: typeof a) => new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(d.toDate())
  return a.month() === b.month() ? `${a.date()}–${fmt(b)}` : `${fmt(a)} – ${fmt(b)}`
})

const canPrev = computed(() => (props.mode === 'week' ? weekStart.value > minWeek.value : month.value > minMonth.value))
const canNext = computed(() => (props.mode === 'week' ? weekStart.value < maxWeek.value : month.value < maxMonth.value))

function shift(dir: 1 | -1) {
  haptic.tap()
  if (props.mode === 'week') {
    weekStart.value = dayjs.utc(weekStart.value, DAY_FORMAT).add(dir, 'week').format(DAY_FORMAT)
    // месяц идёт за неделей: вернёмся к месяцу — он будет тот же
    month.value = dayjs.utc(weekStart.value, DAY_FORMAT).add(3, 'day').format('YYYY-MM')
  } else {
    month.value = dayjs.utc(`${month.value}-01`, DAY_FORMAT).add(dir, 'month').format('YYYY-MM')
  }
}

// выбор протягиванием: первый день решает, выделяем или снимаем; клик после протягивания не считается
let drag: { from: string; on: boolean; moved: boolean; seen: Set<string> } | null = null
let swallowClick = false

// день под пальцем — сквозь слои поверх календаря (затемнение тура, когда Ноки показывает протягивание)
const dateAt = (e: PointerEvent) =>
  document
    .elementsFromPoint(e.clientX, e.clientY)
    .map((el) => el.closest<HTMLElement>('[data-date]'))
    .find((el) => el && el.closest('.grid') === e.currentTarget)?.dataset.date

function dragStart(e: PointerEvent) {
  // после протягивания клик по клетке бывает не всегда — флаг не должен съесть следующий тап
  swallowClick = false
  if (!props.dragSelect) return
  const date = dateAt(e)
  if (date) drag = { from: date, on: !isSelected(date), moved: false, seen: new Set() }
}

function paint(date: string) {
  if (!drag || drag.seen.has(date)) return
  drag.seen.add(date)
  if (isSelected(date) !== drag.on) emit('paint', date, drag.on)
}

function dragMove(e: PointerEvent) {
  if (!drag) return
  const date = dateAt(e)
  if (!date || (date === drag.from && !drag.moved)) return
  if (!drag.moved) {
    drag.moved = true
    paint(drag.from)
  }
  paint(date)
}

function dragEnd() {
  swallowClick = !!drag?.moved
  drag = null
}

function onClick(date: string) {
  if (swallowClick) {
    swallowClick = false
    return
  }
  emit('pick', date)
}

</script>

<style scoped lang="scss">
.calendar {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.title {
  flex: 1;
  text-align: center;
  font-weight: var(--font-weight-bold);
}

.arrow {
  display: grid;
  place-items: center;
  width: calc(var(--control-height) - var(--space-sm));
  height: calc(var(--control-height) - var(--space-sm));
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: var(--primary-100);
  cursor: pointer;

  &:disabled { opacity: 0.35; cursor: default; }

  svg {
    width: var(--space-lg);
    height: var(--space-lg);
    fill: none;
    stroke: var(--primary-600);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
}

.grid {
  display: grid;

  // при выборе протягиванием палец ведёт выделение, а не прокручивает страницу
  &.draggable { touch-action: none; user-select: none; }

  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-xs);
}

.wd {
  padding-bottom: var(--space-xs);
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-transform: lowercase;
}

.day {
  position: relative;
  aspect-ratio: 1 / 1.1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--space-xs) / 2);
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &.past { opacity: 0.4; }
  &:disabled { cursor: default; }

  &.work {
    background: var(--primary-100);
    color: var(--primary-on-soft);
  }

  &.busy {
    background: var(--secondary-100);
    color: var(--secondary-on-soft);
  }

  &.selected {
    background: var(--secondary-500);
    border-color: var(--secondary-500);
    color: var(--on-primary);
  }
}

.num {
  font-weight: var(--font-weight-bold);
  line-height: 1;

  // сегодня — число в залитом кружке цвета темы: обводка клетки терялась на подложке того же цвета
  .today & {
    display: grid;
    place-items: center;
    width: 1.6em;
    height: 1.6em;
    border-radius: 50%;
    background: var(--primary-500);
    color: var(--on-primary);
  }

  // выбранная клетка уже залита цветом темы — кружок наоборот
  .today.selected & {
    background: var(--on-primary);
    color: var(--primary-500);
  }
}
</style>
