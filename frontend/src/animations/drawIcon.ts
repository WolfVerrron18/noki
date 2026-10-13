import { gsap, prefersReducedMotion } from '@/animations/gsap'

/**
 * «Прорисовать» линейную иконку: контуры появляются по очереди, будто их рисуют от руки,
 * последними вспыхивают искорки (элементы с классом `spark`).
 * @param svg корневой <svg> иконки
 */
export function drawIcon(svg: SVGSVGElement | null | undefined) {
  if (!svg || prefersReducedMotion()) return
  const shapes = [...svg.querySelectorAll<SVGGeometryElement>('path, rect, circle, ellipse')]
  const lines = shapes.filter((el) => !el.classList.contains('spark'))
  const sparks = shapes.filter((el) => el.classList.contains('spark'))

  const tl = gsap.timeline()
  lines.forEach((el, i) => {
    const len = el.getTotalLength()
    tl.fromTo(
      el,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 0.65, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' },
      i * 0.09,
    )
  })
  if (sparks.length) {
    tl.fromTo(
      sparks,
      { scale: 0, rotation: -45, opacity: 0, transformOrigin: '50% 50%' },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform,opacity' },
      lines.length * 0.09 + 0.25,
    )
  }
}
