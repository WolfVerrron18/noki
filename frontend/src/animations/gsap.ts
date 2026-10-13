// Единая точка подключения GSAP: плагины регистрируются здесь, остальные модули импортируют отсюда
import { gsap } from 'gsap'

const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)')

/** Пользователь попросил систему уменьшить движение — анимации не запускаем */
export function prefersReducedMotion(): boolean {
  return reducedMotionQuery.matches
}

export { gsap }
