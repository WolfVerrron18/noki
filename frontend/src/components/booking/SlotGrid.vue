<template>
  <div ref="grid" class="grid" role="radiogroup">
    <button
      v-for="s in slots"
      v-press="{ depth: 0.1 }"
      v-pop="model === s"
      :key="s"
      type="button"
      role="radio"
      class="slot"
      :class="{ active: model === s }"
      :aria-checked="model === s"
      @click="pick(s)"
    >
      {{ fmt.time(s, timezone) }}
    </button>
  </div>
</template>

<script setup lang="ts">
// Сетка свободного времени: кнопки-«конфетки»
import { toRef, ref } from 'vue'
import { useFormat } from '@/composables/useFormat'
import { useStaggerIn } from '@/animations/useStaggerIn'
import { haptic } from '@/telegram'

/** Пропсы SlotGrid */
interface Props {
  /** Начала свободных слотов, ISO в UTC */
  slots: string[]
  /** Пояс мастера: время показывается в нём */
  timezone: string
}

const props = defineProps<Props>()
/** Выбранное начало, ISO в UTC */
const model = defineModel<string | null>({ default: null })

const fmt = useFormat()

// новые слоты (сменили день) выезжают каскадом
const grid = ref<HTMLElement | null>(null)
useStaggerIn(grid, toRef(props, 'slots'))

function pick(s: string) {
  haptic.tap()
  model.value = s
}
</script>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--control-height) * 1.5), 1fr));
  gap: var(--space-sm);
}

.slot {
  min-height: calc(var(--control-height) - var(--space-sm));
  border: 2px solid var(--secondary-200);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &.active {
    background: var(--secondary-500);
    border-color: var(--secondary-500);
    color: var(--on-primary);
  }
}
</style>
