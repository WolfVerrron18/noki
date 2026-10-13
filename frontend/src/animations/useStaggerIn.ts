import { nextTick, onMounted, watch, type Ref, type WatchSource } from 'vue'
import { gsap, prefersReducedMotion } from '@/animations/gsap'

/**
 * Каскадное появление дочерних элементов: выезжают снизу один за другим.
 * @param container контейнер, чьи прямые потомки анимируются
 * @param trigger при изменении — повторить (например, новые слоты при смене дня)
 */
export function useStaggerIn(container: Ref<HTMLElement | null | undefined>, trigger?: WatchSource) {
  async function play() {
    await nextTick()
    const el = container.value
    if (!el || prefersReducedMotion()) return
    gsap.fromTo(
      el.children,
      { y: 14, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.45,
        ease: 'back.out(1.7)',
        stagger: 0.035,
        overwrite: true,
        // после анимации — без инлайн-стилей, чтобы не мешать v-press и CSS
        clearProps: 'transform,opacity',
      },
    )
  }

  onMounted(play)
  if (trigger) watch(trigger, play)

  return { play }
}
