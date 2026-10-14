import type { Directive } from 'vue'
import { gsap, prefersReducedMotion } from '@/animations/gsap'

/** Настройки v-fill */
export interface FillOptions {
  /** Цвет заливки, по умолчанию var(--primary-100) */
  color?: string
}

/** Обработчики и заливка, привязанные к элементу, — чтобы снять их при размонтировании */
interface FillState {
  /** Круг заливки внутри элемента */
  blob: HTMLSpanElement
  /** Мышь зашла на элемент */
  enter: (e: PointerEvent) => void
  /** Мышь ушла с элемента */
  leave: (e: PointerEvent) => void
  /** Касание пальцем */
  down: (e: PointerEvent) => void
  /** Палец отпустили */
  up: (e: PointerEvent) => void
}

const states = new WeakMap<HTMLElement, FillState>()

/**
 * Поставить центр круга в точку указателя и растянуть круг так, чтобы из этой точки он закрыл весь элемент.
 * @param el элемент
 * @param blob круг заливки
 * @param e событие указателя
 */
function placeAt(el: HTMLElement, blob: HTMLSpanElement, e: PointerEvent) {
  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  // до самого дальнего угла
  const radius = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y))
  gsap.set(blob, { left: x, top: y, width: radius * 2, height: radius * 2, xPercent: -50, yPercent: -50 })
}

/**
 * Заливка от указателя: круг разливается из точки, где мышь зашла на элемент (или куда коснулся палец),
 * и стекает в точку, где мышь ушла. Наведение — только для мыши (pointerType), на телефоне — по касанию.
 * Каждое новое наведение запускает заливку заново, прерывая прошлую.
 * Внутри `[data-dragging]` (список, который сейчас перетаскивают) заливка не запускается:
 * карточки переставляются под пальцем, и она вспыхивала бы на каждой. Сам круг — `.noki-fill`.
 *
 * Использование: `<button v-fill>`, `<button v-fill="{ color: 'var(--primary-200)' }">`.
 */
export const vFill: Directive<HTMLElement, FillOptions | undefined> = {
  mounted(el, binding) {
    // круг под содержимым элемента и не вылезает за его скругления
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    el.style.overflow = 'hidden'
    el.style.isolation = 'isolate'

    const blob = document.createElement('span')
    blob.className = 'noki-fill'
    blob.setAttribute('aria-hidden', 'true')
    Object.assign(blob.style, {
      position: 'absolute',
      zIndex: '-1',
      borderRadius: '50%',
      pointerEvents: 'none',
      background: binding.value?.color ?? 'var(--primary-100)',
    })
    gsap.set(blob, { scale: 0 })
    el.prepend(blob)

    const fillIn = (e: PointerEvent) => {
      if (el.closest('[data-dragging]')) return
      placeAt(el, blob, e)
      if (prefersReducedMotion()) return gsap.set(blob, { scale: 1 })
      gsap.fromTo(blob, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'power2.out', overwrite: true })
    }

    const fillOut = (e: PointerEvent) => {
      if (prefersReducedMotion()) return gsap.set(blob, { scale: 0 })
      const r = el.getBoundingClientRect()
      // стекает к точке ухода: центр едет туда, круг сжимается
      gsap.to(blob, {
        left: e.clientX - r.left,
        top: e.clientY - r.top,
        scale: 0,
        duration: 0.4,
        ease: 'power2.in',
        overwrite: true,
      })
    }

    const state: FillState = {
      blob,
      enter: (e) => e.pointerType === 'mouse' && fillIn(e),
      leave: (e) => e.pointerType === 'mouse' && fillOut(e),
      // касание ручки перетаскивания ([data-no-press], как в v-press) — это захват карточки, а не нажатие
      down: (e) => e.pointerType !== 'mouse' && !(e.target as Element | null)?.closest?.('[data-no-press]') && fillIn(e),
      up: (e) => e.pointerType !== 'mouse' && fillOut(e),
    }

    el.addEventListener('pointerenter', state.enter)
    el.addEventListener('pointerleave', state.leave)
    el.addEventListener('pointerdown', state.down)
    el.addEventListener('pointerup', state.up)
    el.addEventListener('pointercancel', state.up)
    states.set(el, state)
  },

  updated(el, binding) {
    const state = states.get(el)
    if (state) state.blob.style.background = binding.value?.color ?? 'var(--primary-100)'
  },

  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
    el.removeEventListener('pointerenter', state.enter)
    el.removeEventListener('pointerleave', state.leave)
    el.removeEventListener('pointerdown', state.down)
    el.removeEventListener('pointerup', state.up)
    el.removeEventListener('pointercancel', state.up)
    gsap.killTweensOf(state.blob)
    state.blob.remove()
    states.delete(el)
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    /** Заливка от указателя при наведении мыши или касании (GSAP) */
    vFill: typeof vFill
  }
}
