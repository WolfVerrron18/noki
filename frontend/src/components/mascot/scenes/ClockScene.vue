<template>
  <!-- Ноки держит будильник перед собой двумя лапками: стрелки идут, иногда звенит -->
  <g class="clock-scene">
    <g class="clock">
      <!-- колокольчики и молоточек -->
      <circle class="bell" cx="86" cy="136" r="6" />
      <circle class="bell" cx="114" cy="136" r="6" />
      <path class="hammer" d="M100 133 L100 129" />
      <circle class="hammer-head" cx="100" cy="128" r="2.6" />
      <!-- ножки -->
      <path class="leg" d="M89 170 L85 176" />
      <path class="leg" d="M111 170 L115 176" />
      <!-- корпус и циферблат -->
      <circle class="body" cx="100" cy="154" r="19" />
      <circle class="face" cx="100" cy="154" r="14" />
      <circle class="tick" cx="100" cy="143" r="1.5" />
      <circle class="tick" cx="111" cy="154" r="1.5" />
      <circle class="tick" cx="100" cy="165" r="1.5" />
      <circle class="tick" cx="89" cy="154" r="1.5" />
      <!-- стрелки вращаются вокруг центра циферблата -->
      <path class="hand hour" d="M100 154 L100 147" />
      <path class="hand minute" d="M100 154 L100 144" />
      <circle class="pin" cx="100" cy="154" r="2" />
    </g>

    <!-- «дзынь» во время подпрыгивания -->
    <g class="ring">
      <path d="M76 130 Q72 126 74 121" />
      <path d="M124 130 Q128 126 126 121" />
    </g>

    <!-- лапки держат корпус по бокам -->
    <ellipse class="paw" cx="79" cy="158" rx="9" ry="8" />
    <ellipse class="paw" cx="121" cy="158" rx="9" ry="8" />
  </g>
</template>

<script setup lang="ts">
// Сцена «clock»: экран «Время и запись»
</script>

<style scoped lang="scss">
@use '@/components/mascot/mascot' as m;

$cycle: 4s;

.paw { @include m.fur; }
.body { fill: var(--secondary-400); stroke: var(--secondary-600); stroke-width: 2.5; }
.bell { fill: var(--secondary-500); stroke: var(--secondary-600); stroke-width: 2; }
.hammer { @include m.ink-line(2.4); stroke: var(--secondary-700); }
.hammer-head { fill: var(--secondary-700); }
.leg { @include m.ink-line(3); stroke: var(--secondary-600); }
.face { fill: m.$shine; }
.tick { fill: var(--secondary-300); }
.hand { @include m.ink-line(2.4); }
.hand.hour { stroke-width: 3; }
.pin { fill: var(--primary-500); }
.ring path { @include m.ink-line(2.2); stroke: var(--secondary-500); opacity: 0; }

.hand {
  transform-box: view-box;
  transform-origin: 100px 154px;
}
.minute { animation: spin $cycle linear infinite; }
.hour { animation: spin $cycle * 12 linear infinite; }

.clock {
  transform-box: view-box;
  transform-origin: 100px 172px;
  animation: hop $cycle ease-in-out infinite;
}
.ring path { animation: ring $cycle ease-out infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

// раз за цикл: подпрыгнул, покачался, затих
@keyframes hop {
  0%, 70%, 100% { transform: translateY(0) rotate(0); }
  74% { transform: translateY(-4px) rotate(-6deg); }
  78% { transform: translateY(-4px) rotate(6deg); }
  82% { transform: translateY(-2px) rotate(-4deg); }
  86% { transform: translateY(0) rotate(0); }
}
@keyframes ring {
  0%, 70% { opacity: 0; }
  74%, 82% { opacity: 1; }
  90%, 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .minute, .hour, .clock, .ring path { animation: none; }
}
</style>
