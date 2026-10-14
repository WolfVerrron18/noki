<template>
  <div class="choice-cards">
    <span v-if="label" class="label">{{ label }}</span>
    <div class="group" role="radiogroup">
      <button
        v-for="o in options"
        :key="o.value"
        v-press="{ depth: 0.06 }"
        v-pop="model === o.value"
        type="button"
        role="radio"
        class="card"
        :class="{ active: model === o.value }"
        :aria-checked="model === o.value"
        :data-label="o.label"
        @click="pick(o.value)"
      >
        <span class="title">{{ o.label }}</span>
        <span v-if="o.hint" class="text">{{ o.hint }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
// Выбор режима карточками: у каждого варианта сразу видно пояснение. Для развилок, где второй вариант
// легко не заметить (график «каждую неделю / по датам»); короткие варианты — NokiSegmented.
import { haptic } from '@/telegram'
import type { SelectOption } from '@/components/ui/types'

/** Пропсы NokiChoiceCards */
interface Props {
  /** Подпись над карточками */
  label?: string
  /** Варианты; hint — пояснение в карточке */
  options: SelectOption<T>[]
}

defineProps<Props>()
/** Выбранное значение */
const model = defineModel<T>()

function pick(v: T) {
  haptic.tap()
  model.value = v
}
</script>

<style scoped lang="scss">
.choice-cards {
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

.group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: var(--space-sm);
}

.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;

  &.active {
    border-color: var(--primary-500);
    background: var(--primary-100);
  }
}

.title {
  font-weight: var(--font-weight-semibold);
}

.active .title { color: var(--primary-on-soft); }

.text {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.35;
}
</style>
