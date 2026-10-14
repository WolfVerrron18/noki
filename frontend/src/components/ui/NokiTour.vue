<template>
  <Teleport to="body">
    <Transition name="card">
      <section
        v-if="tour.active.value && step"
        ref="card"
        class="tour"
        role="dialog"
        :aria-label="t(step.title)"
        @keydown.esc="tour.finish()"
      >
        <div class="top">
          <!-- место под Ноки в карточке: нарисуем позже -->
          <slot name="noki" />
          <span class="count">{{ t('tour.step', { n: tour.index.value + 1, total: tour.total.value }) }}</span>
          <button v-press="{ depth: 0.15 }" type="button" class="close" :aria-label="t('tour.close')" @click="tour.finish()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
          </button>
        </div>

        <!-- текст шага: если не влезает, прокручивается сам, кнопки остаются на месте -->
        <Transition name="text" mode="out-in">
          <div :key="tour.index.value" class="body" aria-live="polite">
            <h2>{{ t(step.title) }}</h2>
            <p>{{ t(step.text) }}</p>
          </div>
        </Transition>

        <div class="dots" aria-hidden="true">
          <span v-for="i in tour.total.value" :key="i" :class="{ on: i - 1 === tour.index.value }" />
        </div>

        <div class="actions">
          <button v-if="tour.index.value > 0" v-press="{ depth: 0.06 }" type="button" class="back" @click="tour.back()">
            {{ t('tour.back') }}
          </button>
          <button ref="nextBtn" v-press="{ depth: 0.06 }" type="button" class="next" @click="tour.next()">
            {{ tour.isLast.value ? t('tour.done') : t('tour.next') }}
          </button>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// Тур: карточка, закреплённая внизу экрана, и мягкая обводка у элемента с data-tour.
// Без затемнения и «окошка»: карточка всегда целиком на экране, закрыть тур можно в любой момент.
// Один на всё приложение (App.vue); шаги и запуск — useTour.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useTour } from '@/composables/useTour'
import { prefersReducedMotion } from '@/animations/gsap'
import { haptic } from '@/telegram'

/** Атрибут подсвеченного элемента: обводка — в main.scss. Атрибут, а не класс: Vue перезаписывает class при обновлении */
const ACTIVE_ATTR = 'data-tour-active'
/** Отступ элемента от верха экрана и от карточки при прокрутке, px */
const SCROLL_GAP = 16
/** Сколько кадров подряд экран не двигается — прокрутка закончилась, Ноки начинает действие шага */
const SETTLE_FRAMES = 6

const { t } = useI18n()
const tour = useTour()
const step = computed(() => tour.step.value)

const card = ref<HTMLElement | null>(null)
const nextBtn = ref<HTMLButtonElement | null>(null)
let target: HTMLElement | null = null
let frame = 0

/** Снять обводку с прошлого элемента и поставить на элемент текущего шага */
function highlight() {
  target?.removeAttribute(ACTIVE_ATTR)
  target = step.value ? document.querySelector<HTMLElement>(`[data-tour="${step.value.target}"]`) : null
  target?.setAttribute(ACTIVE_ATTR, '')
}

/**
 * Прокрутить так, чтобы элемент оказался в видимой части над карточкой:
 * по центру, а если он выше этой части — верхом к верху экрана.
 */
function scrollToTarget() {
  if (!target) return
  const cardHeight = card.value?.offsetHeight ?? 0
  const visible = window.innerHeight - cardHeight
  const r = target.getBoundingClientRect()
  const offset = r.height + SCROLL_GAP * 2 > visible ? SCROLL_GAP : (visible - r.height) / 2
  window.scrollTo({ top: window.scrollY + r.top - offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/** Ждём, пока прокрутка закончится, — тогда Ноки начинает действие шага */
function waitSettled() {
  cancelAnimationFrame(frame)
  let still = 0
  let last = Number.NaN
  const tick = () => {
    still = window.scrollY === last ? still + 1 : 0
    last = window.scrollY
    if (still >= SETTLE_FRAMES) return tour.ready()
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

/** Новый шаг: обводка, прокрутка, фокус на «Дальше», действие после прокрутки */
async function show() {
  await nextTick()
  // место под карточкой: последние элементы страницы можно прокрутить выше неё
  document.body.style.paddingBottom = `${card.value?.offsetHeight ?? 0}px`
  highlight()
  scrollToTarget()
  nextBtn.value?.focus({ preventScroll: true })
  waitSettled()
}

function cleanup() {
  cancelAnimationFrame(frame)
  target?.removeAttribute(ACTIVE_ATTR)
  target = null
  document.body.style.paddingBottom = ''
}

watch(
  () => [tour.active.value, tour.index.value] as const,
  ([active], prev) => {
    if (!active) return cleanup()
    if (prev?.[0]) haptic.select()
    show()
  },
  { immediate: true },
)

// ушла на другой экран посреди тура (кнопка «назад» Telegram) — тур закрывается, подсвечивать там нечего
const route = useRoute()
watch(() => route.fullPath, () => {
  if (tour.active.value) tour.finish()
})

onBeforeUnmount(cleanup)
</script>

<style scoped lang="scss">
.tour {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 60;
  width: min(100%, var(--container-width));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 50vh;
  padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--bg-card);
  color: var(--text);
  box-shadow: var(--shadow), 0 0 0 1.5px var(--primary-200);
}

.top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.count {
  flex: 1;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--primary-on-soft);
}

// крестик всегда виден: закрыть тур можно на любом шаге
.close {
  display: grid;
  place-items: center;
  width: calc(var(--control-height) - var(--space-md));
  height: calc(var(--control-height) - var(--space-md));
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--primary-100);
  cursor: pointer;

  svg {
    width: var(--space-md);
    height: var(--space-md);
    fill: none;
    stroke: var(--primary-on-soft);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
}

// длинный текст прокручивается внутри, кнопки под ним не уезжают
.body {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  p {
    margin: 0;
    color: var(--text-muted);
  }
}

.dots {
  display: flex;
  gap: var(--space-xs);

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

// крупные кнопки на всю ширину: попасть пальцем легко
.actions {
  display: flex;
  gap: var(--space-sm);
}

.back,
.next {
  flex: 1;
  min-height: var(--control-height);
  border: 0;
  border-radius: var(--radius-pill);
  font: inherit;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.back {
  background: var(--primary-100);
  color: var(--primary-on-soft);
}

.next {
  background: var(--primary-500);
  color: var(--on-primary);
}

.card-enter-active,
.card-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: translate(-50%, 30%);
}

.text-enter-active,
.text-leave-active { transition: opacity 0.15s ease; }
.text-enter-from,
.text-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .card-enter-active,
  .card-leave-active,
  .text-enter-active,
  .text-leave-active,
  .dots span { transition: none; }
}
</style>
