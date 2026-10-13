import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import tippy, { type Instance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'

/** Настройки подсказки */
export interface HintOptions {
  /** Ключ «уже показывали»: при первом появлении подсказка открывается сама, дальше — только по show() */
  key: string
  /** Текст подсказки (уже переведённый); функция — чтобы подхватывать смену языка */
  content: () => string
  /** Где показать относительно элемента. По умолчанию сверху */
  placement?: 'top' | 'bottom'
}

const seenKey = (key: string) => `nidoki.hint.${key}`

function wasSeen(key: string): boolean {
  try {
    return localStorage.getItem(seenKey(key)) === '1'
  } catch {
    return false
  }
}

function markSeen(key: string) {
  try {
    localStorage.setItem(seenKey(key), '1')
  } catch {
    // нет доступа к хранилищу — покажем ещё раз, не страшно
  }
}

/**
 * Подсказка-пузырь у элемента (tippy.js). На телефоне нет наведения, поэтому она не висит на hover:
 * показывается сама при первом знакомстве и по кнопке «?», закрывается тапом в любом месте.
 * @param target элемент, к которому привязана подсказка
 * @param options настройки
 */
export function useHint(target: Ref<Element | null | undefined>, options: HintOptions) {
  let instance: Instance | null = null

  function create(el: Element) {
    instance?.destroy()
    instance = tippy(el, {
      content: options.content(),
      placement: options.placement ?? 'top',
      trigger: 'manual',
      hideOnClick: true,
      theme: 'noki',
      maxWidth: 260,
      offset: [0, 10],
      appendTo: () => document.body,
    })
  }

  /** Показать подсказку */
  function show() {
    if (!instance) return
    instance.setContent(options.content())
    instance.show()
    markSeen(options.key)
  }

  /** Спрятать подсказку */
  function hide() {
    instance?.hide()
  }

  onMounted(() => {
    watch(
      target,
      (el) => {
        if (!el) return
        create(el)
        // первое знакомство: даём экрану доехать, потом показываем
        if (!wasSeen(options.key)) setTimeout(show, 500)
      },
      { immediate: true },
    )
  })

  onBeforeUnmount(() => instance?.destroy())

  return { show, hide }
}
