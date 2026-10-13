import type { Directive } from 'vue'
import { gsap, prefersReducedMotion } from '@/animations/gsap'

/**
 * «Выбрала!»: когда значение становится true, элемент коротко подпрыгивает с пружинкой.
 * Для выбранных слотов, дней, вариантов.
 *
 * Использование: `<button v-pop="model === s">`
 */
export const vPop: Directive<HTMLElement, boolean> = {
  updated(el, binding) {
    if (!binding.value || binding.oldValue || prefersReducedMotion()) return
    gsap
      .timeline({ overwrite: true })
      .to(el, { scale: 1.1, duration: 0.12, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' })
  },

  beforeUnmount(el) {
    gsap.killTweensOf(el)
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    /** Подпрыгивание при выборе (GSAP) */
    vPop: typeof vPop
  }
}
