import type { Component } from 'vue'
import ClockScene from '@/components/mascot/scenes/ClockScene.vue'

/**
 * Занятие маскота, зависит от экрана:
 * - clock — смотрит на будильник (время и запись)
 */
export type NokiScene = 'clock'

/** Описание сцены */
export interface SceneDef {
  /** SVG-фрагмент сцены, рисуется поверх тела в координатах viewBox 0..200 */
  component: Component
  /** Куда смотрят глаза: сдвиг зрачков в единицах viewBox */
  gaze: {
    /** По горизонтали, + вправо */
    x: number
    /** По вертикали, + вниз */
    y: number
  }
}

/** Реестр сцен. Новая сцена — новый файл в scenes/ и строка здесь */
export const SCENES: Record<NokiScene, SceneDef> = {
  clock: { component: ClockScene, gaze: { x: 0, y: 3 } },
}
