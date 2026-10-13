<template>
  <div class="strip" role="radiogroup">
    <button
      v-for="d in days"
      v-press="{ depth: 0.08 }"
      v-pop="model === d.date"
      :key="d.date"
      type="button"
      role="radio"
      class="day"
      :class="{ active: model === d.date, off: d.off }"
      :aria-checked="model === d.date"
      @click="pick(d.date)"
    >
      <span class="weekday">{{ d.isToday ? t('booking.today') : d.weekday }}</span>
      <span class="num">{{ d.day }}</span>
      <span class="month">{{ d.month }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// Горизонтальная полоска дней для выбора даты записи
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ScheduleSource } from '@/utils/slots'
import { useFormat } from '@/composables/useFormat'
import { addDays, isWorkDay, todayIn } from '@/utils/slots'
import { haptic } from '@/telegram'

/** Пропсы DateStrip */
interface Props {
  /** Пояс мастера: «сегодня» считается в нём */
  timezone: string
  /** График мастера: нерабочие дни показываются бледнее */
  schedule?: ScheduleSource
  /** Сколько дней показать, начиная с сегодня. По умолчанию 14 */
  count?: number
  /** Первый день "YYYY-MM-DD". По умолчанию сегодня в поясе мастера */
  start?: string
}

const props = withDefaults(defineProps<Props>(), { count: 14 })
/** Выбранный день "YYYY-MM-DD" */
const model = defineModel<string>({ required: true })

const { t } = useI18n()
const fmt = useFormat()

const days = computed(() => {
  const today = todayIn(props.timezone)
  const first = props.start ?? today
  return Array.from({ length: props.count }, (_, i) => {
    const date = addDays(first, i)
    return {
      date,
      ...fmt.dayParts(date),
      isToday: date === today,
      off: props.schedule ? !isWorkDay(props.schedule, date) : false,
    }
  })
})

function pick(date: string) {
  haptic.tap()
  model.value = date
}
</script>

<style scoped lang="scss">
.strip {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  scrollbar-width: none;
  padding: var(--space-xs);
  margin: calc(var(--space-xs) * -1);

  &::-webkit-scrollbar { display: none; }
}

.day {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: calc(var(--control-height) + var(--space-sm));
  padding: var(--space-sm) var(--space-xs);
  border: 2px solid var(--primary-100);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &.off { opacity: 0.45; }

  &.active {
    background: var(--primary-500);
    border-color: var(--primary-500);
    color: var(--on-primary);
    opacity: 1;
  }
}

.weekday, .month {
  font-size: var(--font-size-xs);
  text-transform: lowercase;
}

.num {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  line-height: 1.1;
}
</style>
