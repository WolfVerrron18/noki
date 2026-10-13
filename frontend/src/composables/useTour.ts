// Тур по интерфейсу: шаги подсвечивают элементы с data-tour="<target>" и объясняют, что это и зачем.
// Состояние одно на всё приложение, показывает его NokiTour в App.vue.
import { computed, reactive } from 'vue'

/** Шаг тура */
export interface TourStep {
  /** Что подсветить: значение атрибута data-tour у элемента на экране */
  target: string
  /** Ключ i18n заголовка */
  title: string
  /** Ключ i18n текста */
  text: string
}

/** Тур: набор шагов с id для запоминания «уже видела» */
export interface Tour {
  /** id тура, по нему запоминается, что тур пройден */
  id: string
  /** Шаги по порядку */
  steps: TourStep[]
}

const state = reactive<{ tour: Tour | null; index: number }>({ tour: null, index: 0 })

const seenKey = (id: string) => `nidoki.tour.${id}`

/**
 * Видела ли пользовательница тур. Без доступа к хранилищу считаем, что видела, — тур не навязываем.
 * @param id id тура
 */
function isSeen(id: string): boolean {
  try {
    return localStorage.getItem(seenKey(id)) === '1'
  } catch {
    return true
  }
}

function markSeen(id: string) {
  try {
    localStorage.setItem(seenKey(id), '1')
  } catch {
    // нет доступа к хранилищу — просто не запомним
  }
}

/** Управление туром */
export function useTour() {
  const active = computed(() => !!state.tour)
  const step = computed(() => state.tour?.steps[state.index] ?? null)
  const index = computed(() => state.index)
  const total = computed(() => state.tour?.steps.length ?? 0)
  const isLast = computed(() => state.index === total.value - 1)

  /**
   * Запустить тур с первого шага.
   * @param tour тур
   */
  function start(tour: Tour) {
    if (!tour.steps.length) return
    state.tour = tour
    state.index = 0
  }

  /**
   * Запустить тур, если она его ещё не видела (первое знакомство).
   * @param tour тур
   */
  function autoStart(tour: Tour) {
    if (!isSeen(tour.id) && !state.tour) start(tour)
  }

  /** Закончить или пропустить: больше сам не покажется, повторить можно из меню */
  function finish() {
    if (state.tour) markSeen(state.tour.id)
    state.tour = null
    state.index = 0
  }

  function next() {
    if (isLast.value) finish()
    else state.index++
  }

  function back() {
    if (state.index > 0) state.index--
  }

  return { active, step, index, total, isLast, start, autoStart, next, back, finish }
}
