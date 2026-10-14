<template>
  <Teleport to="body">
    <div v-if="tour.active.value && step" class="tour" role="dialog" aria-modal="true" :aria-label="t(step.title)" @keydown.esc="tour.finish()">
      <!-- затемнение с вырезом вокруг подсвеченного элемента; клики сквозь него не проходят -->
      <svg class="shade" aria-hidden="true">
        <defs>
          <mask :id="maskId">
            <rect width="100%" height="100%" fill="white" />
            <rect v-if="hole" :x="hole.x" :y="hole.y" :width="hole.w" :height="hole.h" :rx="HOLE_RADIUS" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" class="dim" :mask="`url(#${maskId})`" />
        <rect v-if="hole" :x="hole.x" :y="hole.y" :width="hole.w" :height="hole.h" :rx="HOLE_RADIUS" class="ring" />
      </svg>

      <!-- пузырь появляется, когда прокрутка к элементу закончилась: на ходу он прыгал бы за ним -->
      <Transition name="bubble" mode="out-in">
        <section v-if="settled" :key="tour.index.value" class="bubble" :class="placement" :style="bubbleStyle" aria-live="polite">
          <!-- место под Ноки в пузыре: нарисуем позже -->
          <slot name="noki" />
          <span class="count">{{ t('tour.step', { n: tour.index.value + 1, total: tour.total.value }) }}</span>
          <h2>{{ t(step.title) }}</h2>
          <p>{{ t(step.text) }}</p>

          <div class="dots" aria-hidden="true">
            <span v-for="i in tour.total.value" :key="i" :class="{ on: i - 1 === tour.index.value }" />
          </div>

          <div class="actions">
            <button type="button" class="skip" @click="tour.finish()">{{ t('tour.skip') }}</button>
            <span class="spacer" />
            <button v-if="tour.index.value > 0" v-press="{ depth: 0.1 }" type="button" class="back" @click="tour.back()">
              {{ t('tour.back') }}
            </button>
            <button ref="nextBtn" v-press="{ depth: 0.1 }" type="button" class="next" @click="tour.next()">
              {{ tour.isLast.value ? t('tour.done') : t('tour.next') }}
            </button>
          </div>
        </section>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Тур: затемняет экран, оставляя «окошко» вокруг элемента с data-tour, и объясняет его в пузыре.
// Один на всё приложение (App.vue); шаги и запуск — useTour.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useTour } from '@/composables/useTour'
import { prefersReducedMotion } from '@/animations/gsap'
import { haptic } from '@/telegram'

/** Отступ окошка от элемента и скругление окошка, px (координаты SVG) */
const HOLE_PAD = 8
const HOLE_RADIUS = 18
/** Насколько быстро окошко перетекает к новому элементу за кадр (0..1) */
const FOLLOW = 0.22
/** Сколько кадров подряд ничего не двигается — прокрутка закончилась, можно показать пузырь */
const SETTLE_FRAMES = 6

/** Прямоугольник окошка в координатах экрана */
interface Box {
  /** Левый край */
  x: number
  /** Верхний край */
  y: number
  /** Ширина */
  w: number
  /** Высота */
  h: number
}

const { t } = useI18n()
const tour = useTour()
const step = computed(() => tour.step.value)
const maskId = `tour-mask-${Math.random().toString(36).slice(2, 8)}`

/** Окошко на экране — то, что рисуется */
const hole = ref<Box | null>(null)
const nextBtn = ref<HTMLButtonElement | null>(null)
/** Прокрутка к элементу шага закончилась: пузырь показан, действие шага запущено */
const settled = ref(false)
/** С какой стороны пузырь: выбирается один раз за шаг, иначе на границе он прыгал вверх-вниз */
const placement = ref<'below' | 'above'>('below')
let frame = 0
/** Окошко в координатах страницы: перетекает между элементами, а прокрутка двигает его без отставания */
let pageBox: Box | null = null
let stillFrames = 0
let lastScroll = Number.NaN

/** Где элемент в координатах страницы (или null, если его нет) */
function measure(): Box | null {
  const el = step.value && document.querySelector(`[data-tour="${step.value.target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + window.scrollX - HOLE_PAD, y: r.top + window.scrollY - HOLE_PAD, w: r.width + HOLE_PAD * 2, h: r.height + HOLE_PAD * 2 }
}

/** Почти совпадают: перерисовывать незачем */
const same = (a: Box | null, b: Box | null) =>
  !!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5

/**
 * Сторона пузыря — где больше места.
 * @param box окошко на экране
 */
function sideFor(box: Box | null): 'below' | 'above' {
  if (!box) return 'below'
  return window.innerHeight - (box.y + box.h) >= box.y ? 'below' : 'above'
}

// каждый кадр: окошко следует за элементом (смена шага, раскладка, прокрутка), но перерисовка — только если сдвинулось
function follow() {
  const target = measure()
  if (target) {
    if (!pageBox || prefersReducedMotion()) pageBox = target
    else {
      const lerp = (a: number, b: number) => (Math.abs(b - a) < 0.5 ? b : a + (b - a) * FOLLOW)
      pageBox = { x: lerp(pageBox.x, target.x), y: lerp(pageBox.y, target.y), w: lerp(pageBox.w, target.w), h: lerp(pageBox.h, target.h) }
    }
    const view = { ...pageBox, x: pageBox.x - window.scrollX, y: pageBox.y - window.scrollY }
    if (!same(view, hole.value)) hole.value = view
  }

  // ждём, пока прокрутка и окошко успокоятся: тогда пузырь встаёт на место и Ноки начинает действие шага
  if (!settled.value) {
    const still = window.scrollY === lastScroll && (!target || same(pageBox, target))
    stillFrames = still ? stillFrames + 1 : 0
    lastScroll = window.scrollY
    if (stillFrames >= SETTLE_FRAMES) {
      placement.value = sideFor(hole.value)
      settled.value = true
      tour.ready()
      nextTick(() => nextBtn.value?.focus({ preventScroll: true }))
    }
  }
  frame = requestAnimationFrame(follow)
}

const bubbleStyle = computed(() => {
  const h = hole.value
  if (!h) return {}
  return placement.value === 'below'
    ? { top: `${h.y + h.h + HOLE_PAD}px` }
    : { bottom: `${window.innerHeight - h.y + HOLE_PAD}px` }
})

/** Новый шаг: спрятать пузырь до конца прокрутки и прокрутить к элементу */
async function show() {
  settled.value = false
  stillFrames = 0
  lastScroll = Number.NaN
  await nextTick()
  const el = step.value && document.querySelector(`[data-tour="${step.value.target}"]`)
  el?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

watch(
  () => [tour.active.value, tour.index.value] as const,
  ([active], prev) => {
    cancelAnimationFrame(frame)
    if (!active) {
      hole.value = null
      pageBox = null
      settled.value = false
      document.body.style.overflow = ''
      return
    }
    // пока идёт тур, страница сама не прокручивается — только к нужному элементу
    document.body.style.overflow = 'hidden'
    if (prev?.[0]) haptic.select()
    frame = requestAnimationFrame(follow)
    show()
  },
  { immediate: true },
)

// ушла на другой экран посреди тура (кнопка «назад» Telegram) — тур закрывается, подсвечивать там нечего
const route = useRoute()
watch(() => route.fullPath, () => {
  if (tour.active.value) tour.finish()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.tour {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.dim { fill: var(--overlay); }

.ring {
  fill: none;
  stroke: var(--primary-400);
  stroke-width: 2;
}

.bubble {
  position: absolute;
  left: 50%;
  width: min(calc(100% - var(--space-md) * 2), var(--container-width));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  color: var(--text);
  box-shadow: var(--shadow);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
}

.count {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--primary-on-soft);
}

.dots {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-xs);

  span {
    width: var(--space-sm);
    height: var(--space-sm);
    border-radius: 50%;
    background: var(--primary-200);
    transition: background 0.2s, width 0.2s;

    &.on {
      width: var(--space-lg);
      border-radius: var(--radius-pill);
      background: var(--primary-500);
    }
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.spacer { flex: 1; }

.skip,
.back,
.next {
  border: 0;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.skip {
  padding: var(--space-sm) 0;
  background: none;
  color: var(--text-muted);
}

.back,
.next {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-pill);
}

.back {
  background: var(--primary-100);
  color: var(--primary-on-soft);
}

.next {
  background: var(--primary-500);
  color: var(--on-primary);
}

.bubble-enter-active,
.bubble-leave-active { transition: opacity 0.18s ease; }
.bubble-enter-from,
.bubble-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .bubble-enter-active,
  .bubble-leave-active,
  .dots span { transition: none; }
}
</style>
