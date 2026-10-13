<template>
  <div ref="root" class="confetti" aria-hidden="true">
    <svg v-for="p in pieces" :key="p.id" class="piece" :style="{ color: p.color }" viewBox="-6 -6 12 12">
      <path v-if="p.shape === 'heart'" d="M0 -1 C0 -4 -5 -4 -5 -1 C-5 2 -2 3 0 5 C2 3 5 2 5 -1 C5 -4 0 -4 0 -1 Z" />
      <path v-else-if="p.shape === 'star'" d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" />
      <circle v-else r="4" />
    </svg>
  </div>
</template>

<script setup lang="ts">
// Конфетти из сердечек, звёздочек и кружков: вылетают веером вверх и падают.
// Кладётся внутрь элемента с position: relative — взрыв из его центра.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap, prefersReducedMotion } from '@/animations/gsap'

/** Пропсы NokiConfetti */
interface Props {
  /** Сколько частиц. По умолчанию 28 */
  count?: number
  /** Запустить сразу при появлении. По умолчанию да */
  autoplay?: boolean
  /** Меняется — запустить ещё раз (например, счётчик сохранений) */
  trigger?: number
}

/** Частица */
interface Piece {
  /** Ключ для v-for */
  id: number
  /** Форма */
  shape: 'heart' | 'star' | 'dot'
  /** Цвет — CSS-переменная палитры */
  color: string
}

const props = withDefaults(defineProps<Props>(), { count: 28, autoplay: true, trigger: 0 })

const COLORS = ['var(--primary-500)', 'var(--primary-400)', 'var(--secondary-400)', 'var(--cute-500)', 'var(--warning-400)']
const SHAPES: Piece['shape'][] = ['heart', 'star', 'dot']

const root = ref<HTMLElement | null>(null)
const pieces = Array.from({ length: props.count }, (_, id) => ({
  id,
  shape: SHAPES[id % SHAPES.length],
  color: COLORS[id % COLORS.length],
}))

let tl: gsap.core.Timeline | null = null

function play() {
  const el = root.value
  if (!el || prefersReducedMotion()) return
  tl?.kill()
  tl = gsap.timeline()
  for (const node of Array.from(el.children)) {
    // веер вверх: от -150° до -30°, разная сила
    const angle = gsap.utils.random(-150, -30) * (Math.PI / 180)
    const power = gsap.utils.random(70, 150)
    const x = Math.cos(angle) * power
    const y = Math.sin(angle) * power
    const size = gsap.utils.random(0.6, 1.3)
    tl.fromTo(
      node,
      { x: 0, y: 0, scale: 0, rotation: 0, opacity: 1 },
      { x, y, scale: size, rotation: gsap.utils.random(-180, 180), duration: 0.55, ease: 'power3.out' },
      0,
    ).to(
      node,
      { y: y + gsap.utils.random(90, 160), x: x * 1.2, rotation: '+=120', opacity: 0, duration: 1.1, ease: 'power1.in' },
      0.55,
    )
  }
}

onMounted(() => {
  if (props.autoplay) play()
})
watch(() => props.trigger, play)
onBeforeUnmount(() => tl?.kill())

defineExpose({ play })
</script>

<style scoped lang="scss">
.confetti {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 2;
}

.piece {
  position: absolute;
  left: calc(var(--space-sm) * -1);
  top: calc(var(--space-sm) * -1);
  width: var(--space-md);
  height: var(--space-md);
  opacity: 0;
  fill: currentColor;
}
</style>
