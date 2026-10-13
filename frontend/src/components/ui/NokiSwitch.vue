<template>
  <button
    type="button"
    class="switch"
    role="switch"
    :aria-checked="!!model"
    :aria-label="label"
    @click.stop="toggle"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
    @pointercancel="pressed = false"
  >
    <span class="track" :class="{ on: model, pressed }"><span class="thumb" /></span>
    <span v-if="label" class="text">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
// Тумблер. Без желейного v-press: кружок плавно переезжает, а пока палец на тумблере — чуть вытягивается
import { ref } from 'vue'
import { haptic } from '@/telegram'

/** Пропсы NokiSwitch */
interface Props {
  /** Подпись справа от тумблера, она же aria-label */
  label?: string
}

defineProps<Props>()
/** Включён ли тумблер */
const model = defineModel<boolean>()
/** Палец на тумблере */
const pressed = ref(false)

function toggle() {
  haptic.tap()
  model.value = !model.value
}
</script>

<style scoped lang="scss">
// внутренние размеры тумблера — как у нативного iOS-переключателя
$w: 48px;
$h: 28px;
$pad: 3px;
$knob: $h - $pad * 2;
$stretch: 6px;

.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
}

.track {
  position: relative;
  width: $w;
  height: $h;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--neutral-400);
  transition: background 0.25s ease;

  &.on { background: var(--primary-500); }
}

.thumb {
  position: absolute;
  top: $pad;
  left: $pad;
  width: $knob;
  height: $knob;
  border-radius: var(--radius-pill);
  background: var(--on-primary);
  box-shadow: 0 1px 3px var(--overlay);
  transition:
    left 0.25s cubic-bezier(0.3, 0.7, 0.4, 1),
    width 0.2s ease;

  .on & { left: $w - $pad - $knob; }

  // нажатие: кружок вытягивается в сторону, куда поедет
  .pressed & { width: $knob + $stretch; }
  .on.pressed & { left: $w - $pad - $knob - $stretch; }
}

@media (prefers-reduced-motion: reduce) {
  .track,
  .thumb { transition: none; }
}
</style>
