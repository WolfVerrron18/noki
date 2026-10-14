<template>
  <div class="noki-collapse" :class="{ closed: !open }" :inert="!open" :aria-hidden="!open">
    <div class="noki-collapse-inner">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// Блок, который плавно раскрывается и схлопывается по высоте (grid 1fr → 0fr) вместе с отступом до соседей в .stack.
// Содержимое остаётся в DOM: пока блок закрывается, оно видно, а не пропадает рывком.

/** Пропсы NokiCollapse */
interface Props {
  /** Раскрыт ли блок */
  open: boolean
}

defineProps<Props>()
</script>

<style scoped lang="scss">
.noki-collapse {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s ease, margin-top 0.3s ease, opacity 0.2s;

  // закрытый блок съедает и отступ .stack над собой, иначе на его месте осталась бы щель
  &.closed {
    grid-template-rows: 0fr;
    margin-top: calc(-1 * var(--space-md));
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) { transition: none; }
}

.noki-collapse-inner {
  min-height: 0;
  overflow: hidden;
}
</style>
