import { EnumTourAbort } from '@/composables/useTour'
import { playPress } from '@/animations/press'
import { gsap, prefersReducedMotion } from '@/animations/gsap'

// «Руки» Ноки в туре-примере: пауза, нажатие и набор текста.
// Если шаг сменили (EnumTourAbort.Skip) — доделывают всё сразу, без пауз; если тур закрыли (Closed) — больше ничего не трогают.

/** Пауза между буквами при наборе, мс */
const TYPE_DELAY_MS = 55
/** Сколько «палец» едет от клетки к клетке при протягивании, мс */
const DRAG_STEP_MS = 260
/** Пауза между проседанием кнопки и самим нажатием, мс */
const TAP_DELAY_MS = 140

/**
 * Тур закрыт: действие должно бросить всё.
 * @param signal сигнал шага
 */
export const isClosed = (signal: AbortSignal) => signal.aborted && signal.reason === EnumTourAbort.Closed

/**
 * Пауза, которая заканчивается сразу, если шаг прервали.
 * @param ms длительность
 * @param signal сигнал шага
 * @returns false — тур закрыли, дальше ничего не делаем
 */
export function robotWait(ms: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted || prefersReducedMotion()) return Promise.resolve(!isClosed(signal))
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve(!isClosed(signal))
    }
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done)
  })
}

/**
 * Нажать кнопку, как пальцем: желейное проседание, потом настоящий клик.
 * @param el кнопка
 * @param signal сигнал шага
 * @returns false — тур закрыли
 */
export async function robotTap(el: Element | null | undefined, signal: AbortSignal): Promise<boolean> {
  if (!(el instanceof HTMLElement) || isClosed(signal)) return !isClosed(signal)
  playPress(el, 0.1)
  if (!(await robotWait(TAP_DELAY_MS, signal))) return false
  el.click()
  return true
}

/**
 * Напечатать текст по букве.
 * @param set записать текст в поле
 * @param text что напечатать
 * @param signal сигнал шага
 * @returns false — тур закрыли
 */
export async function robotType(set: (value: string) => void, text: string, signal: AbortSignal): Promise<boolean> {
  for (let i = 1; i <= text.length; i++) {
    if (isClosed(signal)) return false
    set(text.slice(0, i))
    if (!(await robotWait(TYPE_DELAY_MS, signal))) return false
  }
  return true
}

/**
 * Кнопка с такой подписью внутри элемента тура.
 * @param target значение data-tour
 * @param label подпись кнопки
 */
export function buttonIn(target: string, label: string): HTMLElement | null {
  const root = document.querySelector(`[data-tour="${target}"]`)
  return [...(root?.querySelectorAll<HTMLElement>('button') ?? [])].find((b) => b.textContent?.trim() === label) ?? null
}

/**
 * Только показать нажатие, без клика: когда настоящий клик открыл бы шторку поверх тура
 * (поле времени) — значение экран потом ставит сам.
 * @param el элемент
 * @param signal сигнал шага
 * @returns false — тур закрыли
 */
export async function robotPress(el: Element | null | undefined, signal: AbortSignal): Promise<boolean> {
  if (isClosed(signal)) return false
  if (el instanceof HTMLElement) playPress(el, 0.1)
  return robotWait(TAP_DELAY_MS, signal)
}

/** Кружок-«палец» Ноки: виден поверх затемнения тура, сам касаний не ловит */
function makeFinger(): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '70',
    width: 'calc(var(--control-height) * 0.6)',
    height: 'calc(var(--control-height) * 0.6)',
    borderRadius: '50%',
    background: 'color-mix(in srgb, var(--primary-500) 45%, transparent)',
    border: '2px solid var(--on-primary)',
    boxShadow: 'var(--shadow)',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
  })
  document.body.append(el)
  return el
}

/**
 * Протянуть пальцем по элементам: кружок едет от одного к другому, а их общий контейнер получает
 * настоящие pointerdown → pointermove → pointerup, как от пальца (выбор дней в NokiCalendar).
 * @param cells элементы по порядку протягивания
 * @param signal сигнал шага
 * @returns false — тур закрыли
 */
export async function robotDrag(cells: HTMLElement[], signal: AbortSignal): Promise<boolean> {
  const surface = cells[0]?.closest<HTMLElement>('[role="grid"]')
  if (!surface || isClosed(signal)) return !isClosed(signal)

  const center = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    return { left: r.left + r.width / 2, top: r.top + r.height / 2 }
  }
  const fire = (type: string, el: HTMLElement) => {
    const { left, top } = center(el)
    surface.dispatchEvent(
      new PointerEvent(type, { bubbles: true, clientX: left, clientY: top, pointerId: 99, pointerType: 'touch', isPrimary: true }),
    )
  }
  const calm = () => signal.aborted || prefersReducedMotion()

  const finger = makeFinger()
  gsap.set(finger, center(cells[0]))
  if (!calm()) gsap.from(finger, { scale: 0.4, opacity: 0, duration: 0.2 })
  fire('pointerdown', cells[0])
  let alive = await robotWait(DRAG_STEP_MS, signal)

  for (const el of cells.slice(1)) {
    if (!alive) break
    if (calm()) gsap.set(finger, center(el))
    else gsap.to(finger, { ...center(el), duration: DRAG_STEP_MS / 1000, ease: 'power1.inOut' })
    alive = await robotWait(DRAG_STEP_MS, signal)
    fire('pointermove', el)
  }

  // палец отпускаем всегда, даже если тур закрыли: иначе календарь останется в режиме протягивания
  fire('pointerup', cells[cells.length - 1])
  if (calm()) finger.remove()
  else gsap.to(finger, { scale: 0.4, opacity: 0, duration: 0.2, onComplete: () => finger.remove() })
  return alive && !isClosed(signal)
}
