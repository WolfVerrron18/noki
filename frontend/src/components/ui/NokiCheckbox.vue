<template>
  <div class="checkbox" :class="{ invalid: !!error }">
    <div class="row">
      <button
        v-press="{ depth: 0.15 }"
        type="button"
        role="checkbox"
        class="box"
        :class="{ on: model }"
        :aria-checked="!!model"
        :aria-labelledby="textId"
        @click="toggle"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" /></svg>
      </button>
      <!-- тап по тексту тоже переключает, кроме ссылок внутри: они открывают документ -->
      <span :id="textId" class="text" @click="onText"><slot /></span>
    </div>
    <span v-if="error" class="msg">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
// Галочка с подписью. Корень — div, а не label: внутри подписи бывают ссылки-кнопки, label «нажимал» бы их
import { useId } from 'vue'
import { haptic } from '@/telegram'

/** Пропсы NokiCheckbox */
interface Props {
  /** Ошибка под галочкой (уже переведённая) */
  error?: string
}

defineProps<Props>()
/** Отмечена ли галочка */
const model = defineModel<boolean>({ default: false })
const textId = useId()

function toggle() {
  haptic.tap()
  model.value = !model.value
}

/**
 * Тап по подписи: переключает, если это не ссылка или кнопка внутри.
 * @param e событие клика
 */
function onText(e: MouseEvent) {
  if ((e.target as Element).closest('a, button')) return
  toggle()
}
</script>

<style scoped lang="scss">
.checkbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.box {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--space-lg);
  height: var(--space-lg);
  padding: 0;
  border: 2px solid var(--primary-300);
  border-radius: calc(var(--radius-sm) / 2);
  background: var(--bg-card);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;

  svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: var(--on-primary);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0;
    transition: opacity 0.15s;
  }

  &.on {
    border-color: var(--primary-500);
    background: var(--primary-500);

    svg { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    svg { transition: none; }
  }
}

.invalid .box:not(.on) { border-color: var(--danger-500); }

.text {
  font-size: var(--font-size-sm);
  line-height: 1.4;
  cursor: pointer;
}

.msg {
  padding-left: calc(var(--space-lg) + var(--space-sm));
  color: var(--danger-500);
  font-size: var(--font-size-xs);
}
</style>
