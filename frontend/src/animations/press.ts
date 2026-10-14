import type { Directive } from 'vue'
import { gsap, prefersReducedMotion } from '@/animations/gsap'

/** Настройки v-press */
export interface PressOptions {
  /** Насколько «проседает» элемент при касании, 0..1. По умолчанию 0.06 (крупные кнопки) */
  depth?: number
}

/** Обработчики, привязанные к элементу, — чтобы снять их при размонтировании */
interface PressState {
  /** Касание началось */
  down: (e: PointerEvent) => void
  /** Касание закончилось или ушло с элемента */
  up: () => void
  /** Текущая глубина */
  depth: number
  /** Элемент сейчас нажат: уход мыши без нажатия не должен запускать пружину */
  pressed: boolean
}

const states = new WeakMap<HTMLElement, PressState>()

const isDisabled = (el: HTMLElement) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'

/**
 * Желейная реакция на нажатие, рассчитанная на телефон:
 * касание — элемент проседает (сильнее по высоте, чем по ширине), отпускание — пружинит обратно.
 * Работает на pointer-событиях, без наведения мыши. Сам клик не трогает.
 *
 * Внутри элемента можно отметить зону `data-no-press`: касание в ней не вызывает проседания.
 *
 * Использование: `<button v-press>`, `<button v-press="{ depth: 0.1 }">` для мелких элементов.
 */
export const vPress: Directive<HTMLElement, PressOptions | undefined> = {
  mounted(el, binding) {
    // без задержки 300 мс и двойного тапа для зума
    el.style.touchAction = 'manipulation'

    const state: PressState = {
      depth: binding.value?.depth ?? 0.06,
      pressed: false,
      down(e) {
        if (prefersReducedMotion() || isDisabled(el) || e.button > 0) return
        // касание внутри [data-no-press] (например, ручка перетаскивания) — не проседаем
        if ((e.target as Element | null)?.closest?.('[data-no-press]')) return
        state.pressed = true
        gsap.to(el, {
          scaleX: 1 - state.depth * 0.6,
          scaleY: 1 - state.depth,
          duration: 0.12,
          ease: 'power2.out',
          // только свой scale: появление списка (opacity, y) не прерываем, иначе карточка застывает полупрозрачной
          overwrite: 'auto',
        })
      },
      up() {
        // мышь просто прошла над элементом — не трогаем его: иначе пружина перебивала появление списка
        if (!state.pressed || prefersReducedMotion()) return
        state.pressed = false
        gsap.to(el, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.7,
          ease: 'elastic.out(1.2, 0.35)',
          // только свой scale: появление списка (opacity, y) не прерываем, иначе карточка застывает полупрозрачной
          overwrite: 'auto',
        })
      },
    }

    el.addEventListener('pointerdown', state.down)
    el.addEventListener('pointerup', state.up)
    el.addEventListener('pointercancel', state.up)
    el.addEventListener('pointerleave', state.up)
    states.set(el, state)
  },

  updated(el, binding) {
    const state = states.get(el)
    if (state) state.depth = binding.value?.depth ?? 0.06
  },

  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
    el.removeEventListener('pointerdown', state.down)
    el.removeEventListener('pointerup', state.up)
    el.removeEventListener('pointercancel', state.up)
    el.removeEventListener('pointerleave', state.up)
    gsap.killTweensOf(el)
    states.delete(el)
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    /** Желейная реакция на нажатие (GSAP) */
    vPress: typeof vPress
  }
}

/**
 * Проиграть желейное нажатие без касания самого элемента: когда действие кнопки вызвали из другого места
 * (например, тап по половине поля в NokiNumberInput «нажимает» его кнопку − или +).
 * @param el элемент
 * @param depth глубина проседания, как в v-press
 */
export function playPress(el: HTMLElement | null | undefined, depth = 0.06) {
  if (!el || prefersReducedMotion()) return
  gsap
    .timeline({ overwrite: 'auto' })
    .to(el, { scaleX: 1 - depth * 0.6, scaleY: 1 - depth, duration: 0.1, ease: 'power2.out' })
    .to(el, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1.2, 0.35)' })
}
