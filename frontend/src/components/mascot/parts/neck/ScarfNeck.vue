<template>
  <!-- Шарфик под мордочкой с хвостиком справа -->
  <g class="scarf">
    <path class="tail" d="M118 143 L123 166 L133 163 L128 141 Z" />
    <path class="band" d="M60 132 Q100 150 140 132 L143 141 Q100 161 57 141 Z" />
  </g>
</template>

<script setup lang="ts">
// Украшение на шее «scarf»
</script>

<style scoped lang="scss">
.band, .tail { fill: var(--secondary-500); stroke: var(--secondary-700); stroke-width: 2; stroke-linejoin: round; }
.tail { fill: var(--secondary-600); }
</style>
