// Тур по интерфейсу: шаги подсвечивают элементы с data-tour="<target>" и объясняют, что это и зачем.
// Состояние одно на всё приложение, показывает его NokiTour в App.vue.
// Шаг может показать дело на примере: экран передаёт действия (TourActions), и Ноки сам жмёт кнопки и печатает.
import { computed, reactive } from 'vue'

/** Шаг тура */
export interface TourStep {
  /** Что подсветить: значение атрибута data-tour у элемента на экране */
  target: string
  /** Ключ i18n заголовка */
  title: string
  /** Ключ i18n текста */
  text: string
  /** Действие при переходе на шаг вперёд: ключ в TourActions, которые экран передал в start */
  action?: string
}

/** Почему прервали действие шага */
export enum EnumTourAbort {
  /** Перешли на другой шаг: действие сразу доводит дело до конца, без пауз */
  Skip = 'skip',
  /** Тур закрыли: действие бросает всё и ничего больше не меняет */
  Closed = 'closed',
}

/**
 * Действие шага: показывает, как это делается.
 * @param signal прерывается при смене шага (reason — EnumTourAbort.Skip) или закрытии тура (EnumTourAbort.Closed)
 */
export type TourAction = (signal: AbortSignal) => unknown

/** Действия шагов по ключу TourStep.action */
export type TourActions = Record<string, TourAction>

/** Как запомнить и вернуть состояние экрана: «Назад» отменяет то, что Ноки сделал на шаге */
export interface TourUndo {
  /** Снимок состояния перед действием шага */
  save: () => unknown
  /**
   * Вернуть состояние из снимка.
   * @param state то, что вернул save
   */
  restore: (state: unknown) => void
}

/** Тур: набор шагов с id для запоминания «уже видела» */
export interface Tour {
  /** id тура, по нему запоминается, что тур пройден */
  id: string
  /** Шаги по порядку */
  steps: TourStep[]
}

const state = reactive<{ tour: Tour | null; index: number }>({ tour: null, index: 0 })
/** Действия текущего тура и прерывание идущего — вне reactive: это функции и служебный объект */
let actions: TourActions = {}
let running: AbortController | null = null
/** Отмена действий текущего тура и снимки «до действия» по номеру шага */
let undo: TourUndo | null = null
let snapshots = new Map<number, unknown>()
/** Действие шага ждёт, пока NokiTour докрутит экран до элемента (ready) */
let pending = false

/**
 * Прервать идущее действие шага.
 * @param reason продолжить без пауз или бросить
 */
function abortAction(reason: EnumTourAbort) {
  running?.abort(reason)
  running = null
}

/** Запустить действие текущего шага, если оно есть */
function runAction() {
  const key = state.tour?.steps[state.index]?.action
  const action = key ? actions[key] : undefined
  if (!action) return
  if (undo) snapshots.set(state.index, undo.save())
  running = new AbortController()
  void action(running.signal)
}

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
   * @param stepActions действия шагов, если тур показывает дело на примере
   * @param stepUndo как отменить действия при «Назад»
   */
  function start(tour: Tour, stepActions: TourActions = {}, stepUndo?: TourUndo) {
    if (!tour.steps.length) return
    abortAction(EnumTourAbort.Closed)
    actions = stepActions
    undo = stepUndo ?? null
    snapshots = new Map()
    state.tour = tour
    state.index = 0
    pending = true
  }

  /**
   * Запустить тур, если она его ещё не видела (первое знакомство).
   * @param tour тур
   * @param stepActions действия шагов, если тур показывает дело на примере
   * @param stepUndo как отменить действия при «Назад»
   */
  function autoStart(tour: Tour, stepActions?: TourActions, stepUndo?: TourUndo) {
    if (!isSeen(tour.id) && !state.tour) start(tour, stepActions, stepUndo)
  }

  /** Закончить или пропустить: больше сам не покажется, повторить можно из меню */
  function finish() {
    abortAction(EnumTourAbort.Closed)
    pending = false
    actions = {}
    undo = null
    snapshots = new Map()
    if (state.tour) markSeen(state.tour.id)
    state.tour = null
    state.index = 0
  }

  function next() {
    if (isLast.value) return finish()
    // недоигранное действие доводим до конца сразу, потом — действие нового шага
    abortAction(EnumTourAbort.Skip)
    state.index++
    pending = true
  }

  // назад: действие этого шага останавливаем и отменяем (экран — как до него), действие прошлого шага не повторяем
  function back() {
    if (state.index === 0) return
    abortAction(EnumTourAbort.Closed)
    pending = false
    const before = snapshots.get(state.index)
    if (undo && snapshots.has(state.index)) undo.restore(before)
    snapshots.delete(state.index)
    state.index--
  }

  /** Экран докручен до элемента шага, пузырь на месте — Ноки начинает действие (вызывает NokiTour) */
  function ready() {
    if (!pending) return
    pending = false
    runAction()
  }

  return { active, step, index, total, isLast, start, autoStart, next, back, finish, ready }
}
