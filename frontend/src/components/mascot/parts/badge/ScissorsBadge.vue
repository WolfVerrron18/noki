<template>
  <!-- Ножницы: стрижки и укладки -->
  <g class="scissors">
    <path class="blade" d="M115 150 L135 122" />
    <path class="blade" d="M129 150 L117 122" />
    <circle class="ring" cx="113" cy="153" r="5" />
    <circle class="ring" cx="131" cy="153" r="5" />
    <circle class="pivot" cx="123" cy="138" r="2" />
  </g>
</template>

<script setup lang="ts">
// Значок «scissors»
</script>

<style scoped lang="scss">
@use '@/components/mascot/mascot' as m;

.blade { @include m.ink-line(3.5); stroke: var(--neutral-600); }
.ring { fill: none; stroke: var(--primary-500); stroke-width: 3; }
.pivot { fill: var(--neutral-700); }
</style>
