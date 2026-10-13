<template>
  <div class="pauses">
    <div v-for="(p, i) in model.pauses" :key="i" class="pause">
      <span class="label">{{ t('hours.pause') }}</span>
      <NokiTimePicker
        :model-value="p[0]"
        :label="t('hours.pauseFrom')"
        :is-allowed="(v) => allowedTime(model, { pause: i, side: 0 }, v)"
        tone="secondary"
        compact
        @update:model-value="set(i, 0, $event)"
      />
      <span class="dash">–</span>
      <NokiTimePicker
        :model-value="p[1]"
        :label="t('hours.pauseTo')"
        :is-allowed="(v) => allowedTime(model, { pause: i, side: 1 }, v)"
        tone="secondary"
        compact
        @update:model-value="set(i, 1, $event)"
      />
      <button v-press="{ depth: 0.15 }" type="button" class="remove" :aria-label="t('hours.removePause')" @click="remove(i)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
      </button>
    </div>
    <button type="button" class="add" :disabled="!next" @click="add">{{ t('hours.addPause') }}</button>
  </div>
</template>

<script setup lang="ts">
// Перерывы рабочего дня: сколько угодно, у каждого своё время и крестик
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import NokiTimePicker from '@/components/ui/NokiTimePicker.vue'
import { allowedTime, setPauseEdge, sortPauses, suggestPause, type DayHours } from '@/utils/hours'
import { haptic } from '@/telegram'

/** Часы дня: меняются только перерывы, начало и конец нужны для подсказки времени нового перерыва */
const model = defineModel<DayHours>({ required: true })
const { t } = useI18n()

/** Каким будет следующий перерыв; null — места в дне больше нет, кнопка неактивна */
const next = computed(() => suggestPause(model.value))

// перерывы всегда по порядку: так же они лягут в данные (toRanges), и список не переставится после сохранения
function set(i: number, side: 0 | 1, value: string) {
  const pauses = model.value.pauses.map((p, j) => (j === i ? setPauseEdge(p, side, value) : p))
  model.value = { ...model.value, pauses: sortPauses(pauses) }
}

function add() {
  if (!next.value) return
  haptic.tap()
  model.value = { ...model.value, pauses: sortPauses([...model.value.pauses, next.value]) }
}

function remove(i: number) {
  haptic.tap()
  model.value = { ...model.value, pauses: model.value.pauses.filter((_, j) => j !== i) }
}
</script>

<style scoped lang="scss">
.pauses {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.pause {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.label {
  min-width: calc(var(--control-height) + var(--space-md));
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.dash { color: var(--text-muted); }

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
  align-self: flex-end;
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
