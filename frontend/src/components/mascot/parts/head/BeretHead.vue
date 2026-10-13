<template>
  <!-- Берет набок, между ушками -->
  <g class="beret">
    <ellipse class="cap" cx="98" cy="62" rx="30" ry="11" transform="rotate(-8 98 62)" />
    <path class="band" d="M74 68 Q98 74 122 64" />
    <circle class="stem" cx="99" cy="51" r="3" />
  </g>
</template>

<script setup lang="ts">
// Головной убор «beret»
</script>

<style scoped lang="scss">
@use '@/components/mascot/mascot' as m;

.cap { fill: var(--secondary-500); stroke: var(--secondary-700); stroke-width: 2; }
.band { @include m.ink-line(2); stroke: var(--secondary-700); }
.stem { fill: var(--secondary-700); }
</style>
