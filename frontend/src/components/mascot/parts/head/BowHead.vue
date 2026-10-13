<template>
  <!-- Бантик у основания правого ушка -->
  <g class="bow">
    <path class="wing" d="M126 60 L111 49 Q107 60 111 71 Z" />
    <path class="wing" d="M126 60 L141 49 Q145 60 141 71 Z" />
    <circle class="knot" cx="126" cy="60" r="4.5" />
  </g>
</template>

<script setup lang="ts">
// Головной убор «bow»
</script>

<style scoped lang="scss">
.wing { fill: var(--primary-500); stroke: var(--primary-700); stroke-width: 2; stroke-linejoin: round; }
.knot { fill: var(--primary-700); }
</style>
