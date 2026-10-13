<template>
  <div class="slot-times">
    <div v-for="(time, i) in model" :key="time" class="time">
      <NokiTimePicker
        :model-value="time"
        :label="t('slots.time')"
        :is-allowed="(v) => v === time || !model.includes(v)"
        compact
        @update:model-value="set(i, $event)"
      />
      <button v-press="{ depth: 0.15 }" type="button" class="remove" :aria-label="t('slots.remove')" @click="remove(i)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
      </button>
    </div>
    <button type="button" class="add" :disabled="!next" @click="add">{{ t('slots.add') }}</button>
  </div>
</template>

<script setup lang="ts">
// Точное время записи одного дня: сколько угодно времён начала, у каждого свой крестик
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import NokiTimePicker from '@/components/ui/NokiTimePicker.vue'
import { sortTimes, suggestTime } from '@/utils/daySlots'
import { haptic } from '@/telegram'

/** Времена начала записи "HH:MM", всегда по возрастанию и без повторов */
const model = defineModel<string[]>({ required: true })
const { t } = useI18n()

/** Каким будет следующее время; null — до конца суток места нет */
const next = computed(() => suggestTime(model.value))

function set(i: number, value: string) {
  model.value = sortTimes(model.value.map((v, j) => (j === i ? value : v)))
}

function add() {
  if (!next.value) return
  haptic.tap()
  model.value = sortTimes([...model.value, next.value])
}

function remove(i: number) {
  haptic.tap()
  model.value = model.value.filter((_, j) => j !== i)
}
</script>

<style scoped lang="scss">
.slot-times {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--control-height) * 2.2), 1fr));
  gap: var(--space-xs);
  align-items: center;
}

.time {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.remove {
  display: grid;
  place-items: center;
  width: calc(var(--space-lg) + var(--space-xs));
  height: calc(var(--space-lg) + var(--space-xs));
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  svg {
    width: var(--space-md);
    height: var(--space-md);
    stroke: var(--text-muted);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
}

.add {
  grid-column: 1 / -1;
  justify-self: end;
  padding: var(--space-xs) 0;
  border: 0;
  background: none;
  color: var(--secondary-on-soft);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;

  &:disabled {
    color: var(--text-muted);
    text-decoration: none;
    cursor: default;
  }
}
</style>
