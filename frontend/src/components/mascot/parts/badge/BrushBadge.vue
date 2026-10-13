<template>
  <!-- Кисть для макияжа: визаж -->
  <g class="brush">
    <path class="handle" d="M120 154 L131 128" />
    <path class="ferrule" d="M131 128 L134 121" />
    <ellipse class="bristles" cx="136" cy="114" rx="5" ry="9" transform="rotate(22 136 114)" />
  </g>
</template>

<script setup lang="ts">
// Значок «brush»
</script>

<style scoped lang="scss">
@use '@/components/mascot/mascot' as m;

.handle { @include m.ink-line(4.5); stroke: var(--secondary-600); }
.ferrule { @include m.ink-line(5); stroke: var(--neutral-500); stroke-linecap: butt; }
.bristles { fill: var(--cute-500); stroke: var(--cute-700); stroke-width: 1.5; }
</style>
