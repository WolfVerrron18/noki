<template>
  <!-- Круг с сердечками, которые мягко пульсируют -->
  <g>
    <circle class="bg" cx="100" cy="108" r="90" />
    <path
      v-for="(h, i) in HEARTS"
      :key="i"
      class="heart"
      :style="{ animationDelay: `${i * 0.4}s` }"
      :transform="`translate(${h.x} ${h.y}) scale(${h.s})`"
      d="M0 3 C0 -1 -6 -2 -6 2 C-6 5 -2 7 0 9 C2 7 6 5 6 2 C6 -2 0 -1 0 3 Z"
    />
  </g>
</template>

<script setup lang="ts">
// Фон «hearts»

/** Положение и масштаб сердечек в координатах viewBox */
const HEARTS = [
  { x: 30, y: 70, s: 1.2 },
  { x: 168, y: 64, s: 1 },
  { x: 24, y: 136, s: 0.9 },
  { x: 176, y: 128, s: 1.3 },
  { x: 52, y: 34, s: 0.8 },
  { x: 150, y: 30, s: 0.9 },
]
</script>

<style scoped lang="scss">
.bg { fill: var(--primary-100); }

.heart {
  fill: var(--primary-300);
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .heart { animation: none; }
}
</style>
