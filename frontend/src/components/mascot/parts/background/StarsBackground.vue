<template>
  <!-- Круг со звёздочками, которые мерцают -->
  <g>
    <circle class="bg" cx="100" cy="108" r="90" />
    <path
      v-for="(st, i) in STARS"
      :key="i"
      class="star"
      :style="{ animationDelay: `${i * 0.3}s` }"
      :transform="`translate(${st.x} ${st.y}) scale(${st.s})`"
      d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z"
    />
  </g>
</template>

<script setup lang="ts">
// Фон «stars»

/** Положение и масштаб звёздочек в координатах viewBox */
const STARS = [
  { x: 32, y: 66, s: 1.2 },
  { x: 170, y: 58, s: 1 },
  { x: 22, y: 132, s: 0.8 },
  { x: 178, y: 134, s: 1.1 },
  { x: 56, y: 32, s: 0.9 },
  { x: 146, y: 28, s: 0.7 },
  { x: 100, y: 22, s: 0.8 },
]
</script>

<style scoped lang="scss">
.bg { fill: var(--secondary-100); }

.star {
  fill: var(--secondary-400);
  animation: twinkle 1.8s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .star { animation: none; }
}
</style>
