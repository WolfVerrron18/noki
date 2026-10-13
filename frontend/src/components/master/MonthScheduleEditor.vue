<template>
  <div class="stack">
    <NokiSegmented v-model="view" :options="viewOptions" />

    <NokiCalendar
      v-model:month="month"
      :mode="view"
      drag-select
      :timezone="timezone"
      :selected="selected"
      :tone-of="(d) => (model[d]?.length ? 'work' : undefined)"
      @pick="toggle"
      @paint="paint"
    >
      <template #nav-extra>
        <button ref="helpBtn" v-press="{ depth: 0.15 }" type="button" class="help" :aria-label="t('scheduleEditor.help')" @click="hint.show()">?</button>
      </template>
      <template #day="{ date }">
        <span v-if="model[date]?.length" class="hours">{{ cellLabel(model[date]!) }}</span>
      </template>
    </NokiCalendar>

    <!-- строка статуса всегда одной высоты: интерфейс не прыгает, когда появляется выбор -->
    <div class="status">
      <template v-if="selected.size">
        <span>{{ t('scheduleEditor.selected', selected.size) }}</span>
        <button type="button" class="link" @click="clearSelection">{{ t('scheduleEditor.unselect') }}</button>
      </template>
      <span v-else class="muted">{{ t('scheduleEditor.idle') }}</span>
    </div>

    <NokiSheet v-model:open="sheetOpen" :title="t('scheduleEditor.sheetTitle', { dates: selectedTitle })">
      <div class="stack">
        <section v-if="templates.length" class="stack-sm">
          <h3>{{ t('scheduleEditor.templates') }}</h3>
          <div class="presets">
            <span v-for="tpl in templates" :key="tpl.id" class="chip">
              <button v-press="{ depth: 0.08 }" type="button" class="chip-main" @click="applyRanges(tpl.ranges)">
                {{ templateLabel(tpl.ranges) }}
              </button>
              <button type="button" class="chip-remove" :aria-label="t('scheduleEditor.removeTemplate')" @click="removeTemplate(tpl.id)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
              </button>
            </span>
          </div>
          <p class="hint">{{ t('scheduleEditor.templatesHint') }}</p>
        </section>

        <section class="stack-sm">
          <h3>{{ templates.length ? t('scheduleEditor.custom') : t('scheduleEditor.hoursTitle') }}</h3>
          <DayHoursForm v-model="draft" />
          <NokiSwitch v-model="saveAsTemplate" :label="t('scheduleEditor.saveAsTemplate')" />
        </section>

        <NokiButton variant="soft" @click="applyRanges([])">{{ t('scheduleEditor.makeDayOff') }}</NokiButton>
        <NokiMainButton :text="t('scheduleEditor.applyTo', selected.size)" :disabled="!!draftError" @click="applyDraft" />
      </div>
    </NokiSheet>
  </div>
</template>

<script setup lang="ts">
// График «по датам»: выбрать дни в календаре → задать им часы в шторке.
// Своей главной кнопки нет — её подпись и действие («Задать часы · N») меняет экран-родитель,
// поэтому на экране всегда одна главная кнопка и ничего не сдвигается.
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DayOverrides, DayTemplate, TimeRange } from '@/api/types'
import NokiButton from '@/components/ui/NokiButton.vue'
import NokiCalendar from '@/components/ui/NokiCalendar.vue'
import NokiMainButton from '@/components/ui/NokiMainButton.vue'
import NokiSegmented from '@/components/ui/NokiSegmented.vue'
import NokiSheet from '@/components/ui/NokiSheet.vue'
import NokiSwitch from '@/components/ui/NokiSwitch.vue'
import DayHoursForm from '@/components/master/DayHoursForm.vue'
import { useHint } from '@/composables/useHint'
import dayjs from '@/utils/date'
import { DAY_FORMAT, todayIn } from '@/utils/slots'
import { DEFAULT_HOURS, fromRanges, rangesKey, shortRange, toRanges, validateDayHours, type DayHours } from '@/utils/hours'
import type { SelectOption } from '@/components/ui/types'
import { haptic } from '@/telegram'

/** Пропсы MonthScheduleEditor */
interface Props {
  /** Пояс мастера: «сегодня» и прошедшие дни считаются в нём */
  timezone: string
}

const props = defineProps<Props>()
/** Часы по датам; ключа нет — выходной */
const model = defineModel<DayOverrides>({ required: true })
/** Свои шаблоны дня мастера */
const templates = defineModel<DayTemplate[]>('templates', { default: () => [] })
/** Сколько дней выбрано: родитель по нему меняет главную кнопку на «Задать часы · N» */
const selectedCount = defineModel<number>('selectedCount', { default: 0 })
/** Открыта ли шторка: родитель прячет свою главную кнопку — в шторке своя */
const sheetOpen = defineModel<boolean>('sheetOpen', { default: false })

const { t, locale } = useI18n()

const month = ref(todayIn(props.timezone).slice(0, 7))
const selected = reactive(new Set<string>())
const draft = ref<DayHours>({ ...DEFAULT_HOURS })
const draftError = computed(() => validateDayHours(draft.value))
const saveAsTemplate = ref(false)

watch(() => selected.size, (n) => (selectedCount.value = n), { immediate: true })

/** Показ календаря: не каждая мастер знает график на месяц вперёд, поэтому есть и неделя */
type CalendarView = 'week' | 'month'
const VIEW_KEY = 'nidoki.scheduleView'
function savedView(): CalendarView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'week' ? 'week' : 'month'
  } catch {
    return 'month'
  }
}
const view = ref<CalendarView>(savedView())
watch(view, (v) => {
  try {
    localStorage.setItem(VIEW_KEY, v)
  } catch {
    // нет доступа к хранилищу — просто не запомним
  }
})
const viewOptions = computed<SelectOption<CalendarView>[]>(() => [
  { value: 'week', label: t('schedule.week') },
  { value: 'month', label: t('schedule.month') },
])

/** Подсказка открывается у кнопки «?», а не над сеткой */
const helpBtn = ref<HTMLElement | null>(null)
const hint = useHint(helpBtn, {
  key: 'schedule-dates',
  content: () => t('scheduleEditor.steps'),
  placement: 'bottom',
})

/** Подпись в клетке: начало–конец дня */
function cellLabel(ranges: TimeRange[]): string {
  const h = fromRanges(ranges)!
  return shortRange([h.from, h.to])
}

/** Подпись шаблона: «10–19» или «10–19, перерыв 14–15» */
function templateLabel(ranges: TimeRange[]): string {
  const h = fromRanges(ranges)!
  const base = shortRange([h.from, h.to])
  if (!h.pauses.length) return base
  return t('hours.withPause', { hours: base, pause: h.pauses.map(shortRange).join(', ') })
}

/** Выбранные даты для заголовка шторки: «27, 28, 29 окт.» */
const selectedTitle = computed(() => {
  const list = [...selected].sort()
  const fmt = new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', day: 'numeric', month: 'short' })
  const parts = list.slice(0, 4).map((d) => fmt.format(dayjs.utc(d, DAY_FORMAT).toDate()))
  return list.length > 4 ? `${parts.join(', ')}…` : parts.join(', ')
})

function toggle(date: string) {
  haptic.tap()
  hint.hide()
  if (selected.has(date)) selected.delete(date)
  else selected.add(date)
}

/**
 * Протянули по дню: выделить или снять выделение.
 * @param date день
 * @param on выделить
 */
function paint(date: string, on: boolean) {
  haptic.select()
  hint.hide()
  if (on) selected.add(date)
  else selected.delete(date)
}

function clearSelection() {
  selected.clear()
  sheetOpen.value = false
}

/** Шаг 2: открыть шторку с часами. Вызывает главная кнопка экрана-родителя */
function openSheet() {
  if (!selected.size) return
  // выбран один рабочий день — в форму подставляем его часы
  const only = selected.size === 1 ? model.value[[...selected][0]] : undefined
  draft.value = fromRanges(only) ?? { ...DEFAULT_HOURS }
  saveAsTemplate.value = false
  sheetOpen.value = true
}

/**
 * Назначить выбранным дням часы (пустой массив — выходной) и закончить выбор.
 * @param ranges интервалы дня
 */
function applyRanges(ranges: TimeRange[]) {
  const next = { ...model.value }
  for (const date of selected) {
    if (ranges.length) next[date] = ranges.map((r) => [r[0], r[1]])
    else delete next[date]
  }
  model.value = next
  haptic.success()
  clearSelection()
}

function applyDraft() {
  if (draftError.value) return haptic.error()
  const ranges = toRanges(draft.value)
  if (saveAsTemplate.value && !templates.value.some((tpl) => rangesKey(tpl.ranges) === rangesKey(ranges))) {
    templates.value = [...templates.value, { id: Math.random().toString(36).slice(2, 10), ranges }]
  }
  applyRanges(ranges)
}

function removeTemplate(id: string) {
  haptic.tap()
  templates.value = templates.value.filter((tpl) => tpl.id !== id)
}

defineExpose({ openSheet })
</script>

<style scoped lang="scss">
.help {
  display: grid;
  place-items: center;
  width: calc(var(--space-lg) + var(--space-xs));
  height: calc(var(--space-lg) + var(--space-xs));
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: var(--secondary-100);
  color: var(--secondary-on-soft);
  font: inherit;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.hours {
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  white-space: nowrap;
}

.status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: var(--space-xl);
  padding: 0 var(--space-xs);
  font-weight: var(--font-weight-semibold);
}

.muted {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
}

.link {
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--font-size-sm);
  text-decoration: underline;
  cursor: pointer;
}

.stack-sm {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  h3 {
    margin: 0;
    font-size: var(--font-size-md);
  }

  .hint { margin: 0; }
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.chip {
  display: inline-flex;
  align-items: center;
  border: 2px solid var(--primary-200);
  border-radius: var(--radius-pill);
  background: var(--primary-100);
}

.chip-main {
  padding: var(--space-sm) var(--space-xs) var(--space-sm) var(--space-md);
  border: 0;
  background: none;
  color: var(--primary-on-soft);
  font: inherit;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.chip-remove {
  display: grid;
  place-items: center;
  padding: var(--space-sm);
  border: 0;
  background: none;
  cursor: pointer;

  svg {
    width: var(--space-md);
    height: var(--space-md);
    stroke: var(--primary-on-soft);
    stroke-width: 2.5;
    stroke-linecap: round;
    opacity: 0.6;
  }
}
</style>
