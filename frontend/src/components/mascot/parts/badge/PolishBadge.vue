<template>
  <!-- Флакончик лака: маникюр -->
  <g class="polish">
    <rect class="cap" x="117" y="121" width="11" height="14" rx="3" />
    <rect class="bottle" x="113" y="133" width="19" height="22" rx="7" />
    <circle class="shine" cx="119" cy="140" r="2.4" />
  </g>
</template>

<script setup lang="ts">
// Значок «polish»
</script>

<style scoped lang="scss">
@use '@/components/mascot/mascot' as m;

.cap { fill: var(--secondary-400); }
.bottle { fill: var(--primary-500); }
.shine { fill: m.$shine; }
</style>
