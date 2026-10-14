<template>
  <div class="field">
    <label v-if="label" class="label" :for="id">{{ label }}</label>
    <!-- со степпером тап по левой половине поля уменьшает, по правой — увеличивает: не нужно целиться в кнопки -->
    <div class="box" :class="{ invalid: !!error, stepper: !!step }" @click="onBoxClick">
      <button
        v-if="step"
        ref="minusBtn"
        v-press="{ depth: STEP_DEPTH }"
        type="button"
        class="step"
        :aria-label="t('common.decrease')"
        :disabled="atMin"
        @click.stop="shift(-1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
      </button>
      <span class="value">
        <span v-if="prefix" class="unit">{{ prefix }}</span>
        <input
          :id="id"
          ref="input"
          :value="shown"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :placeholder="placeholder"
          :style="{ width: `${Math.max((shown || placeholder || '').length, 1) + 0.2}ch` }"
          @input="onInput"
        />
        <span v-if="unit" class="unit">{{ unit }}</span>
      </span>
      <button
        v-if="step"
        ref="plusBtn"
        v-press="{ depth: STEP_DEPTH }"
        type="button"
        class="step"
        :aria-label="t('common.increase')"
        :disabled="atMax"
        @click.stop="shift(1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
      </button>
    </div>
    <!-- быстрые прибавки: «+100 ₽», «+500 ₽» -->
    <div v-if="quick?.length" class="quick">
      <button
        v-for="q in quick"
        :key="q"
        v-press="{ depth: 0.1 }"
        type="button"
        class="chip"
        :disabled="atMax"
        @click="add(q)"
      >
        +{{ formatAmount(q) }}
      </button>
    </div>
    <span v-if="error" class="msg error">{{ error }}</span>
    <span v-else-if="hint" class="msg">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
// Поле для целого числа: только цифры, единица рядом с числом («мин»), по желанию кнопки − / + с шагом.
// С currency число показывается как цена по правилам локали (Intl): разряды через пробел, знак валюты на своём месте.
// Нативный type="number" не используем: стрелки браузера, «e» и запятые в нём выбиваются из оформления.
import { computed, nextTick, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { haptic } from '@/telegram'
import { playPress } from '@/animations/press'

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
  /** Единица после числа, например «мин» */
  suffix?: string
  /** Валюта (ISO 4217, «RUB»): число показывается как цена, знак валюты — по правилам локали */
  currency?: string
  /** Шаг кнопок − / +; не задан — кнопок нет */
  step?: number
  /** Наименьшее значение для кнопки − */
  min?: number
  /** Наибольшее значение для кнопки + и прибавок */
  max?: number
  /** Быстрые прибавки под полем, например [100, 500, 1000] */
  quick?: number[]
}

/** Глубина нажатия кнопок − / + */
const STEP_DEPTH = 0.15

/** Больше цифр не принимаем */
const MAX_DIGITS = 9

const props = defineProps<Props>()
/** Число строкой из одних цифр; пусто — не задано */
const model = defineModel<string>({ default: '' })
const { t, locale } = useI18n()
const id = useId()
const input = ref<HTMLInputElement | null>(null)
const minusBtn = ref<HTMLButtonElement | null>(null)
const plusBtn = ref<HTMLButtonElement | null>(null)

const num = computed(() => (model.value === '' ? null : Number(model.value)))
const atMin = computed(() => props.min !== undefined && num.value !== null && num.value <= props.min)
const atMax = computed(() => props.max !== undefined && num.value !== null && num.value >= props.max)

/** Части цены по Intl: где стоит знак валюты и как он выглядит */
const currencyLayout = computed(() => {
  if (!props.currency) return null
  const parts = new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: props.currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).formatToParts(1)
  const at = parts.findIndex((p) => p.type === 'currency')
  const integer = parts.findIndex((p) => p.type === 'integer')
  return { symbol: parts[at]?.value ?? props.currency, before: at < integer }
})

const prefix = computed(() => (currencyLayout.value?.before ? currencyLayout.value.symbol : ''))
const unit = computed(() => (currencyLayout.value ? (currencyLayout.value.before ? '' : currencyLayout.value.symbol) : props.suffix))

/**
 * Число с разрядами по локали: «12 500».
 * @param digits цифры
 */
function group(digits: string): string {
  if (!digits || !props.currency) return digits
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 }).format(Number(digits))
}

/** Текст в поле */
const shown = computed(() => group(model.value))

/**
 * Подпись быстрой прибавки: «100 ₽» или «15 мин».
 * @param value прибавка
 */
function formatAmount(value: number): string {
  if (props.currency) {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: props.currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return props.suffix ? `${value} ${props.suffix}` : String(value)
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  // курсор ставим после той же по счёту цифры: разряды добавляют пробелы, и он бы уехал
  const digitsBeforeCaret = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, '').length
  // только цифры, без ведущих нулей
  const digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_DIGITS)
  model.value = digits
  const text = group(digits)
  if (el.value !== text) {
    el.value = text
    let caret = 0
    for (let seen = 0; caret < text.length && seen < digitsBeforeCaret; caret++) if (/\d/.test(text[caret])) seen++
    el.setSelectionRange(caret, caret)
  }
}

/**
 * Изменить на шаг; значение встаёт на ближайшее деление шага.
 * @param dir −1 или +1
 */
function shift(dir: -1 | 1) {
  if (!props.step || (dir < 0 ? atMin.value : atMax.value)) return
  haptic.select()
  const cur = num.value ?? props.min ?? 0
  let next = dir > 0 ? Math.floor(cur / props.step) * props.step + props.step : Math.ceil(cur / props.step) * props.step - props.step
  if (props.min !== undefined) next = Math.max(next, props.min)
  if (props.max !== undefined) next = Math.min(next, props.max)
  model.value = String(next)
}

/**
 * Прибавить к числу (быстрые кнопки).
 * @param value прибавка
 */
function add(value: number) {
  haptic.select()
  let next = (num.value ?? 0) + value
  if (props.max !== undefined) next = Math.min(next, props.max)
  model.value = String(next)
}

/** Тап по полю мимо числа: со степпером — шаг в сторону половины, без него — в поле ввода */
async function onBoxClick(e: MouseEvent) {
  if (e.target === input.value) return
  if (!props.step) {
    await nextTick()
    input.value?.focus()
    return
  }
  const box = e.currentTarget as HTMLElement
  const { left, width } = box.getBoundingClientRect()
  const dir = e.clientX < left + width / 2 ? -1 : 1
  const btn = dir < 0 ? minusBtn.value : plusBtn.value
  // на краю диапазона кнопка неактивна — и не «нажимается»
  if (btn?.disabled) return
  // кнопка этой стороны отзывается так же, как при прямом нажатии
  playPress(btn, STEP_DEPTH)
  shift(dir)
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
  user-select: none;

  &:focus-within { border-color: var(--primary-400); }
  &.invalid { border-color: var(--danger-400); }

  &.stepper {
    padding: 0 var(--space-xs);
    cursor: pointer;
    touch-action: manipulation;
  }
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
  cursor: text;
  user-select: text;

  &::placeholder { color: var(--text-muted); }
}

.unit {
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

.quick {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.chip {
  padding: var(--space-xs) var(--space-md);
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--primary-100);
  color: var(--primary-on-soft);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
  cursor: pointer;

  &:disabled { opacity: 0.55; cursor: default; }
}

.msg {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  padding-left: var(--space-xs);

  &.error { color: var(--danger-500); }
}
</style>
