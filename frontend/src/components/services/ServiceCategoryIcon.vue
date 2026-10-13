<template>
  <svg ref="svg" class="icon" viewBox="0 0 24 24" :width="size" :height="size" aria-hidden="true">
    <component :is="CATEGORY_DEFS[category].icon" />
  </svg>
</template>

<script setup lang="ts">
// Иконка категории услуги: линейная, цвет — currentColor (по умолчанию primary-500).
// Когда active становится true, иконка «прорисовывается» заново.
import { ref, watch } from 'vue'
import type { EnumServiceCategory } from '@/components/services/category'
import { CATEGORY_DEFS } from '@/components/services/registry'
import { drawIcon } from '@/animations/drawIcon'

/** Пропсы ServiceCategoryIcon */
interface Props {
  /** Категория */
  category: EnumServiceCategory
  /** Размер в px, по умолчанию 32 */
  size?: number
  /** Выбрана: при переходе в true проигрывается прорисовка */
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), { size: 32, active: false })
const svg = ref<SVGSVGElement | null>(null)

watch(
  () => props.active,
  (on) => {
    if (on) drawIcon(svg.value)
  },
)

/** Проиграть прорисовку вручную */
function play() {
  drawIcon(svg.value)
}

defineExpose({ play })
</script>

<style scoped lang="scss">
.icon {
  flex-shrink: 0;
  overflow: visible;
  color: var(--primary-500);
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
