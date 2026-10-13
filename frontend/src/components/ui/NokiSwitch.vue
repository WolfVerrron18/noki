<template>
  <button v-press="{ depth: 0.1 }" type="button" class="switch" role="switch" :aria-checked="!!model" :aria-label="label" @click.stop="toggle">
    <span class="track" :class="{ on: model }"><span class="thumb" /></span>
    <span v-if="label" class="text">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { haptic } from '@/telegram'

/** Пропсы NokiSwitch */
interface Props {
  /** Подпись справа от тумблера, она же aria-label */
  label?: string
}

defineProps<Props>()
/** Включён ли тумблер */
const model = defineModel<boolean>()

function toggle() {
  haptic.tap()
  model.value = !model.value
}
</script>

<style scoped lang="scss">
$w: 48px;
$h: 28px;
$pad: 3px;

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
}

.track {
  position: relative;
  width: $w;
  height: $h;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--neutral-400);
  transition: background 0.2s;

  &.on { background: var(--primary-500); }
}

.thumb {
  position: absolute;
  top: $pad;
  left: $pad;
  width: $h - $pad * 2;
  height: $h - $pad * 2;
  border-radius: 50%;
  background: var(--on-primary);
  box-shadow: var(--shadow);
  transition: transform 0.2s;

  .on & { transform: translateX($w - $h); }
}
</style>
