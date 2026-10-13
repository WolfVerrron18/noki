<template>
  <div class="stack">
    <div class="presets">
      <span class="label">{{ t('onboarding.hours.presets') }}</span>
      <div class="chips">
        <button v-press="{ depth: 0.1 }" type="button" @click="preset(['1', '2', '3', '4', '5'])">{{ t('onboarding.hours.presetWeekdays') }}</button>
        <button v-press="{ depth: 0.1 }" type="button" @click="preset(['1', '2', '3', '4', '5', '6'])">{{ t('onboarding.hours.presetNoSunday') }}</button>
        <button v-press="{ depth: 0.1 }" type="button" @click="preset([...WEEKDAYS])">{{ t('onboarding.hours.presetEveryday') }}</button>
      </div>
    </div>

    <ul class="days">
      <li v-for="d in WEEKDAYS" :key="d" :class="{ off: !hoursOf(d), invalid: invalidDays?.includes(d) || !!errorOf(d) }">
        <div class="main">
          <NokiSwitch :model-value="!!hoursOf(d)" :label="t(`weekday.short.${d}`)" @update:model-value="setDay(d, !!$event)" />
          <div v-if="hoursOf(d)" class="times">
            <NokiTimePicker
              :model-value="hoursOf(d)!.from"
              :label="t('hours.start')"
              :is-allowed="(v) => allowedTime(hoursOf(d)!, 'from', v)"
              compact
              @update:model-value="patch(d, { from: $event })"
            />
            <span class="dash">–</span>
            <NokiTimePicker
              :model-value="hoursOf(d)!.to"
              :label="t('hours.end')"
              :is-allowed="(v) => allowedTime(hoursOf(d)!, 'to', v)"
              compact
              @update:model-value="patch(d, { to: $event })"
            />
          </div>
          <span v-else class="hint">{{ t('onboarding.hours.dayOff') }}</span>
        </div>

        <!-- перерывы: сколько угодно -->
        <PauseList v-if="hoursOf(d)" :model-value="hoursOf(d)!" @update:model-value="write(d, $event)" />
        <p v-if="errorOf(d)" class="error">{{ t(errorOf(d)!) }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// Недельный шаблон: у каждого дня недели свои часы и необязательный перерыв
import { useI18n } from 'vue-i18n'
import { WEEKDAYS, type Weekday, type WorkHours } from '@/api/types'
import NokiSwitch from '@/components/ui/NokiSwitch.vue'
import PauseList from '@/components/master/PauseList.vue'
import NokiTimePicker from '@/components/ui/NokiTimePicker.vue'
import { allowedTime, DEFAULT_HOURS, fromRanges, toRanges, validateDayHours, type DayHours, type DayHoursError } from '@/utils/hours'
import { haptic } from '@/telegram'

/** Пропсы WorkHoursEditor */
interface Props {
  /** Дни, которые подсветить как ошибочные (конец раньше начала, перерыв вне дня) */
  invalidDays?: Weekday[]
}

/** Рабочие часы по дням недели */
const model = defineModel<WorkHours>({ required: true })
defineProps<Props>()
const { t } = useI18n()

/**
 * Часы дня недели или null — выходной.
 * @param d день недели
 */
function hoursOf(d: Weekday): DayHours | null {
  return fromRanges(model.value[d])
}

/**
 * Что не так с часами дня (ключ i18n) или null.
 * @param d день недели
 */
function errorOf(d: Weekday): DayHoursError {
  const h = hoursOf(d)
  return h ? validateDayHours(h) : null
}

function write(d: Weekday, h: DayHours | null) {
  const next = { ...model.value }
  if (h) next[d] = toRanges(h)
  else delete next[d]
  model.value = next
}

/** Новый рабочий день берёт часы (и перерыв) первого уже включённого дня */
function firstHours(): DayHours {
  for (const d of WEEKDAYS) {
    const h = hoursOf(d)
    if (h) return h
  }
  return DEFAULT_HOURS
}

function setDay(d: Weekday, on: boolean) {
  write(d, on ? { ...firstHours() } : null)
}

/**
 * Изменить часть часов дня.
 * @param d день недели
 * @param part изменённые поля
 */
function patch(d: Weekday, part: Partial<DayHours>) {
  const h = hoursOf(d)
  if (h) write(d, { ...h, ...part })
}

function preset(days: Weekday[]) {
  haptic.tap()
  const h = firstHours()
  const next: WorkHours = {}
  for (const d of days) next[d] = toRanges(h)
  model.value = next
}
</script>

<style scoped lang="scss">
.label {
  display: block;
  margin-bottom: var(--space-xs);
  padding-left: var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-align: left;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);

  button {
    padding: var(--space-sm) var(--space-md);
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--secondary-100);
    color: var(--secondary-on-soft);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;

    &:active { background: var(--secondary-200); }
  }
}

.days {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  li {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    border: 2px solid transparent;

    &.off { opacity: 0.7; }
    &.invalid { border-color: var(--danger-400); }
  }
}

.times {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: calc(var(--control-height) - var(--space-md));
}

.dash { color: var(--text-muted); }
.hint { margin: 0; }

.error {
  margin: 0;
  color: var(--danger-500);
  font-size: var(--font-size-sm);
}
</style>
