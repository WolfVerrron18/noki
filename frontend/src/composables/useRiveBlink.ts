import { onBeforeUnmount, watch, type Ref } from 'vue'
import type { ViewModelInstance } from '@rive-app/canvas'
import { prefersReducedMotion } from '@/animations/gsap'

/** Настройки моргания */
export interface RiveBlinkOptions {
  /** Минимальная пауза между морганиями, мс */
  minDelay?: number
  /** Максимальная пауза между морганиями, мс */
  maxDelay?: number
  /** Доля двойных морганий, 0..1 */
  doubleChance?: number
}

/**
 * Моргание Rive-персонажа из кода: выключает встроенный `autoBlink` и в случайные моменты
 * дёргает триггеры `blink` / `blinkDouble` ViewModel `Character`. На скрытой вкладке и при
 * `prefers-reduced-motion` не моргает. Подходит любому персонажу с тем же контрактом.
 * @param vmi экземпляр ViewModel персонажа (null, пока файл не загружен)
 * @param options паузы и доля двойных морганий
 */
export function useRiveBlink(vmi: Ref<ViewModelInstance | null>, options: RiveBlinkOptions = {}) {
  const { minDelay = 2000, maxDelay = 6000, doubleChance = 0.25 } = options
  let timer: ReturnType<typeof setTimeout> | undefined

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(tick, minDelay + Math.random() * (maxDelay - minDelay))
  }

  function tick() {
    const v = vmi.value
    if (v && !document.hidden) v.trigger(Math.random() < doubleChance ? 'blinkDouble' : 'blink')?.trigger()
    schedule()
  }

  watch(vmi, (v) => {
    clearTimeout(timer)
    if (!v) return
    const auto = v.boolean('autoBlink')
    if (auto) auto.value = false
    if (!prefersReducedMotion()) schedule()
  }, { immediate: true })

  onBeforeUnmount(() => clearTimeout(timer))
}
