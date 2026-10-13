<template>
  <!-- Бабочка под мордочкой -->
  <g class="bowtie">
    <path class="wing" d="M100 143 L86 135 Q83 143 86 151 Z" />
    <path class="wing" d="M100 143 L114 135 Q117 143 114 151 Z" />
    <circle class="knot" cx="100" cy="143" r="3.5" />
  </g>
</template>

<script setup lang="ts">
// Украшение на шее «bowtie»
</script>

<style scoped lang="scss">
.wing { fill: var(--secondary-600); stroke: var(--secondary-800); stroke-width: 2; stroke-linejoin: round; }
.knot { fill: var(--secondary-800); }
</style>
