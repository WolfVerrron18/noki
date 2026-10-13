<template>
  <!-- Маленькая корона на макушке, камушек поблёскивает -->
  <g class="crown">
    <path class="base" d="M80 68 L82 46 L91 57 L100 42 L109 57 L118 46 L120 68 Z" />
    <circle class="gem" cx="100" cy="61" r="3.5" />
    <circle class="tip" cx="82" cy="46" r="2.2" />
    <circle class="tip" cx="100" cy="42" r="2.4" />
    <circle class="tip" cx="118" cy="46" r="2.2" />
  </g>
</template>

<script setup lang="ts">
// Головной убор «crown»
</script>

<style scoped lang="scss">
.base { fill: var(--warning-400); stroke: var(--warning-600); stroke-width: 2; stroke-linejoin: round; }
.tip { fill: var(--warning-500); }

.gem {
  fill: var(--primary-500);
  animation: shine 2.6s ease-in-out infinite;
}

@keyframes shine {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .gem { animation: none; }
}
</style>
