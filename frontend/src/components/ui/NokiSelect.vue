<template>
  <div class="field">
    <span v-if="label" :id="labelId" class="label">{{ label }}</span>
    <button
      v-press="{ depth: 0.04 }"
      type="button"
      class="box"
      :class="{ open }"
      :aria-labelledby="label ? labelId : undefined"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="show"
    >
      <span class="value" :class="{ placeholder: !current }">{{ current?.label ?? placeholder }}</span>
      <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <NokiSheet v-model:open="open" :title="label ?? ''">
      <ul ref="list" class="options" role="listbox" :aria-label="label">
        <li v-for="o in options" :key="o.value">
          <button
            type="button"
            class="option"
            role="option"
            :class="{ active: o.value === model }"
            :aria-selected="o.value === model"
            @click="pick(o.value)"
          >
            <span>{{ o.label }}</span>
            <svg v-if="o.value === model" class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </button>
        </li>
      </ul>
    </NokiSheet>
  </div>
</template>

<script setup lang="ts">
// Выпадающий выбор в стиле приложения: поле открывает шторку со списком, выбор — одним тапом.
// Нативный <select> не используем: его список рисует система и он выбивается из оформления.
import { computed, nextTick, ref } from 'vue'
import NokiSheet from '@/components/ui/NokiSheet.vue'
import type { SelectOption } from '@/components/ui/types'
import { haptic } from '@/telegram'

/** Пропсы NokiSelect */
interface Props {
  /** Подпись над полем, она же заголовок шторки */
  label?: string
  /** Варианты выбора */
  options: SelectOption[]
  /** Текст, пока ничего не выбрано */
  placeholder?: string
}

const props = defineProps<Props>()
/** Выбранное значение */
const model = defineModel<string>()

const open = ref(false)
const list = ref<HTMLElement | null>(null)
const labelId = `select-${Math.random().toString(36).slice(2, 8)}`
const current = computed(() => props.options.find((o) => o.value === model.value))

/** Открыть список и прокрутить к выбранному варианту */
async function show() {
  haptic.tap()
  open.value = true
  await nextTick()
  list.value?.querySelector('.active')?.scrollIntoView({ block: 'center' })
}

function pick(value: string) {
  haptic.select()
  model.value = value
  open.value = false
}
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
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  min-height: var(--control-height);
  padding: 0 var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 2px solid var(--primary-100);
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s;

  &.open,
  &:focus-visible {
    border-color: var(--primary-400);
    outline: 0;
  }
}

.value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.placeholder { color: var(--text-muted); }
}

.chevron {
  width: var(--space-lg);
  height: var(--space-lg);
  flex-shrink: 0;
  fill: none;
  stroke: var(--primary-500);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.2s;

  .open & { transform: rotate(180deg); }
}

.options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  width: 100%;
  min-height: var(--control-height);
  padding: var(--space-sm) var(--space-md);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &.active {
    background: var(--primary-100);
    color: var(--primary-on-soft);
    font-weight: var(--font-weight-semibold);
  }
}

.check {
  width: var(--space-lg);
  height: var(--space-lg);
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (prefers-reduced-motion: reduce) {
  .chevron { transition: none; }
}
</style>
