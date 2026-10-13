<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <span class="box" :class="{ invalid: !!error, stepper: !!step }">
      <button
        v-if="step"
        v-press="{ depth: 0.15 }"
        type="button"
        class="step"
        :aria-label="t('common.decrease')"
        :disabled="atMin"
        @click.prevent="shift(-1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
      </button>
      <span class="value">
        <input
          :value="model"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          :placeholder="placeholder"
          :style="{ width: `${Math.max(String(model || placeholder || '').length, 1) + 0.5}ch` }"
          @input="onInput"
        />
        <span v-if="suffix" class="suffix">{{ suffix }}</span>
      </span>
      <button
        v-if="step"
        v-press="{ depth: 0.15 }"
        type="button"
        class="step"
        :aria-label="t('common.increase')"
        :disabled="atMax"
        @click.prevent="shift(1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
      </button>
    </span>
    <span v-if="error" class="msg error">{{ error }}</span>
    <span v-else-if="hint" class="msg">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
// Поле для целого числа: только цифры, единица после числа («₽», «мин»), по желанию кнопки − / + с шагом.
// Нативный type="number" не используем: стрелки браузера, «e» и запятые в нём выбиваются из оформления.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { haptic } from '@/telegram'

/** Пропсы NokiNumberInput */
interface Props {
  /** Подпись над полем */
  label?: string
  /** Подсказка под полем, скрывается при ошибке */
  hint?: string
  /** Текст ошибки: подсвечивает поле красным */
  error?: string
  /** Текст-пример в пустом поле */
  placeholder?: string
  /** Единица после числа, например «₽» или «мин» */
  suffix?: string
  /** Шаг кнопок − / +; не задан — кнопок нет */
  step?: number
  /** Наименьшее значение для кнопки − */
  min?: number
  /** Наибольшее значение для кнопки + */
  max?: number
}

const props = defineProps<Props>()
/** Число строкой, как в поле ввода; пусто — не задано */
const model = defineModel<string>({ default: '' })
const { t } = useI18n()

const num = computed(() => (model.value === '' ? null : Number(model.value)))
const atMin = computed(() => props.min !== undefined && num.value !== null && num.value <= props.min)
const atMax = computed(() => props.max !== undefined && num.value !== null && num.value >= props.max)

function onInput(e: Event) {
  const input = e.target as HTMLInputElement
  // только цифры, без ведущих нулей
  const digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9)
  model.value = digits
  if (input.value !== digits) input.value = digits
}

/**
 * Изменить на шаг; значение встаёт на ближайшее деление шага.
 * @param dir −1 или +1
 */
function shift(dir: -1 | 1) {
  if (!props.step) return
  haptic.select()
  const cur = num.value ?? props.min ?? 0
  let next = dir > 0 ? Math.floor(cur / props.step) * props.step + props.step : Math.ceil(cur / props.step) * props.step - props.step
  if (props.min !== undefined) next = Math.max(next, props.min)
  if (props.max !== undefined) next = Math.min(next, props.max)
  model.value = String(next)
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
  min-height: var(--control-height);
  padding: 0 var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 2px solid var(--primary-100);
  cursor: text;
  transition: border-color 0.15s;

  &:focus-within { border-color: var(--primary-400); }
  &.invalid { border-color: var(--danger-400); }
  &.stepper { padding: 0 var(--space-xs); }
}

// число и единица идут вместе: «90 мин», а не число слева и единица у края
.value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);

  .stepper & { justify-content: center; }
}

input {
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;

  &::placeholder { color: var(--text-muted); }
}

.suffix {
  color: var(--text-muted);
  font-weight: var(--font-weight-semibold);
}

.step {
  display: grid;
  place-items: center;
  width: calc(var(--control-height) - var(--space-md));
  height: calc(var(--control-height) - var(--space-md));
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: var(--primary-100);
  cursor: pointer;

  svg {
    width: var(--space-md);
    height: var(--space-md);
    fill: none;
    stroke: var(--primary-on-soft);
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  &:disabled {
    background: var(--neutral-200);
    cursor: default;

    svg { stroke: var(--text-muted); }
  }
}

.msg {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  padding-left: var(--space-xs);

  &.error { color: var(--danger-500); }
}
</style>
