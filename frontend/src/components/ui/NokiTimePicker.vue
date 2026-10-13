<template>
  <button v-press="{ depth: 0.08 }" type="button" class="trigger" :class="[tone, { compact }]" :aria-label="label" @click="show">
    <span>{{ model || '--:--' }}</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
  </button>

  <NokiSheet v-model:open="open" :title="label">
    <div class="picker">
      <VueScrollPicker v-model="hour" :options="hourOptions" :aria-label="t('time.hour')" @move="tick" />
      <span class="colon" aria-hidden="true">:</span>
      <VueScrollPicker v-model="minute" :options="minuteOptions" :aria-label="t('time.minute')" @move="tick" />
    </div>
    <NokiButton :disabled="!canApply" @click="apply">{{ t('common.done') }}</NokiButton>
  </NokiSheet>
</template>

<script setup lang="ts">
// Поле времени: по тапу шторка с двумя барабанами vue-scroll-picker (часы и минуты).
// Барабан крутится пальцем, мышью и колесом; недоступное время зачёркнуто, на нём барабан не останавливается
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueScrollPicker, type VueScrollPickerOption as ScrollPickerOption, type VueScrollPickerValue as ScrollPickerValue } from 'vue-scroll-picker'
import 'vue-scroll-picker/style.css'
import NokiSheet from '@/components/ui/NokiSheet.vue'
import NokiButton from '@/components/ui/NokiButton.vue'
import { haptic } from '@/telegram'

/** Пропсы NokiTimePicker */
interface Props {
  /** Подпись поля: заголовок шторки и aria-label */
  label: string
  /** Можно ли выбрать время "HH:MM"; по умолчанию можно любое */
  isAllowed?: (value: string) => boolean
  /** Шаг минут */
  step?: number
  /** Цвет подложки поля */
  tone?: 'primary' | 'secondary'
  /** Компактное поле (в строке перерыва) */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), { isAllowed: () => true, step: 15, tone: 'primary', compact: false })
/** Время "HH:MM" */
const model = defineModel<string>({ required: true })
const { t } = useI18n()

const open = ref(false)
/** Черновик в шторке: применяется кнопкой «Готово» */
const hour = ref(0)
const minute = ref(0)

const pad = (n: number) => String(n).padStart(2, '0')
const allowed = (h: number, m: number) => props.isAllowed(`${pad(h)}:${pad(m)}`)
const minutes = computed(() => Array.from({ length: Math.ceil(60 / props.step) }, (_, i) => i * props.step))

const hourOptions = computed<ScrollPickerOption[]>(() =>
  Array.from({ length: 24 }, (_, h) => ({ value: h, name: pad(h), disabled: !minutes.value.some((m) => allowed(h, m)) })),
)
const minuteOptions = computed<ScrollPickerOption[]>(() =>
  minutes.value.map((m) => ({ value: m, name: pad(m), disabled: !allowed(hour.value, m) })),
)
const canApply = computed(() => allowed(hour.value, minute.value))

/**
 * Ближайшее доступное значение в колонке.
 * @param options колонка
 * @param value текущее значение
 */
function nearest(options: ScrollPickerOption[], value: number): number {
  const i = Math.max(options.findIndex((o) => o.value === value), 0)
  for (let d = 0; d < options.length; d++) {
    if (options[i + d] && !options[i + d].disabled) return options[i + d].value as number
    if (options[i - d] && !options[i - d].disabled) return options[i - d].value as number
  }
  return value
}

// выбрали час, где текущие минуты заняты, — переезжаем на ближайшие свободные
watch(hour, () => {
  minute.value = nearest(minuteOptions.value, minute.value)
})

/** Щелчок на каждом новом значении под барабаном */
let last: ScrollPickerValue | undefined
function tick(v: ScrollPickerValue | undefined) {
  if (v !== last) haptic.select()
  last = v
}

function show() {
  const [h, m] = (model.value || '00:00').split(':').map(Number)
  hour.value = nearest(hourOptions.value, h)
  // минуты вне шага округляем вниз до ближайшего деления
  minute.value = nearest(minuteOptions.value, Math.floor(m / props.step) * props.step)
  open.value = true
}

function apply() {
  haptic.tap()
  model.value = `${pad(hour.value)}:${pad(minute.value)}`
  open.value = false
}
</script>

<style scoped lang="scss">
.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: var(--space-sm);
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  &.primary { background: var(--primary-100); }
  &.secondary { background: var(--secondary-100); }
  &.compact { padding: var(--space-xs) var(--space-sm); }

  svg {
    width: var(--space-md);
    height: var(--space-md);
    flex-shrink: 0;
    fill: none;
    stroke: var(--text-muted);
    stroke-width: 2;
    stroke-linecap: round;
  }
}

.picker {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding: 0 var(--space-lg);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.colon { color: var(--text-muted); }

// тема барабана на наших токенах (у библиотеки свои серые цвета)
.picker :deep(.vue-scroll-picker) {
  height: calc(var(--control-height) * 4);
  isolation: isolate; // подложка выбора с z-index: -1 остаётся внутри барабана
  cursor: grab;
}

.picker :deep(.vue-scroll-picker-item) {
  line-height: 1.8em;
  color: var(--text-muted);

  &[aria-selected='true'] { color: var(--text); }

  &[aria-disabled='true'] {
    color: var(--text-muted);
    opacity: 0.4;
    text-decoration: line-through;
  }
}

.picker :deep(.vue-scroll-picker-rotator) { top: calc(50% - 0.9em); }

// края барабана тают в фон шторки, строка выбора — розовая подложка
.picker :deep(.vue-scroll-picker-layer-top),
.picker :deep(.vue-scroll-picker-layer-bottom) {
  height: calc(50% - 0.9em);
  border: 0;
}
.picker :deep(.vue-scroll-picker-layer-top) {
  background: linear-gradient(var(--bg), color-mix(in srgb, var(--bg) 30%, transparent));
}
.picker :deep(.vue-scroll-picker-layer-bottom) {
  background: linear-gradient(color-mix(in srgb, var(--bg) 30%, transparent), var(--bg));
}
.picker :deep(.vue-scroll-picker-layer-selection) {
  top: calc(50% - 0.9em);
  bottom: calc(50% - 0.9em);
  z-index: -1;
  border-radius: var(--radius-md);
  background: var(--primary-100);
}
</style>
