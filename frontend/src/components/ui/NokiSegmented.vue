<template>
  <div class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <!-- в режиме scroll ряд тянется пальцем и мышью с инерцией (Embla), viewport обрезает края -->
    <div :ref="setViewport" :class="{ viewport: scroll }">
    <div class="group" :class="{ scroll }" role="radiogroup">
      <button
        v-for="o in options"
        v-press="{ depth: 0.08 }"
        v-pop="model === o.value"
        :key="o.value"
        type="button"
        role="radio"
        :aria-checked="model === o.value"
        :class="{ active: model === o.value }"
        @click="pick(o.value)"
      >
        {{ o.label }}
      </button>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
import emblaCarouselVue from 'embla-carousel-vue'
import { haptic } from '@/telegram'
import type { SelectOption } from '@/components/ui/types'

/** Пропсы NokiSegmented */
interface Props {
  /** Подпись над группой */
  label?: string
  /** Варианты выбора */
  options: SelectOption<T>[]
  /** Одной строкой с горизонтальной прокруткой вместо переноса (много вариантов) */
  scroll?: boolean
}

const props = defineProps<Props>()
/** Выбранное значение */
const model = defineModel<T>()

// свободная прокрутка с инерцией; клик после перетаскивания Embla сам не пропускает
const [emblaRef] = emblaCarouselVue({ dragFree: true, align: 'start', containScroll: 'trimSnaps' })

/**
 * Обёртка ряда: в режиме scroll отдаём её Embla.
 * @param el элемент обёртки
 */
function setViewport(el: unknown) {
  emblaRef.value = props.scroll ? (el as HTMLElement | null) ?? undefined : undefined
}

function pick(v: T) {
  haptic.tap()
  model.value = v
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

.viewport {
  overflow: hidden;
  // тень кнопок не обрезается
  padding: var(--space-xs);
  margin: calc(var(--space-xs) * -1);
  cursor: grab;
}

.group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);

  &.scroll {
    flex-wrap: nowrap;
    touch-action: pan-y pinch-zoom;

    button { flex: 0 0 auto; }
  }
}

button {
  flex: 1 0 auto;
  min-height: calc(var(--control-height) - var(--space-sm));
  padding: 0 var(--space-md);
  border: 2px solid var(--primary-100);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &.active {
    background: var(--primary-500);
    border-color: var(--primary-500);
    color: var(--on-primary);
  }
}
</style>
