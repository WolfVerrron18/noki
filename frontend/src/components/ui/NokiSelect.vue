<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <span class="box">
      <select v-model="model">
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </span>
  </label>
</template>

<script setup lang="ts">
import type { SelectOption } from '@/components/ui/types'

/** Пропсы NokiSelect */
interface Props {
  /** Подпись над полем */
  label?: string
  /** Варианты выбора */
  options: SelectOption[]
}

defineProps<Props>()
/** Выбранное значение */
const model = defineModel<string>()
</script>

<style scoped lang="scss">
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  text-align: left;
}

.label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  padding-left: var(--space-xs);
}

.box {
  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--control-height);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 2px solid var(--primary-100);

  &:focus-within { border-color: var(--primary-400); }
}

select {
  flex: 1;
  appearance: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  padding: 0 calc(var(--space-xl) + var(--space-sm)) 0 var(--space-md);
  min-height: var(--control-height);
}

.chevron {
  position: absolute;
  right: var(--space-md);
  width: var(--space-lg);
  height: var(--space-lg);
  fill: none;
  stroke: var(--primary-500);
  stroke-width: 2.5;
  stroke-linecap: round;
  pointer-events: none;
}
</style>
