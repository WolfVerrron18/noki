// Тонкая обёртка над window.Telegram.WebApp (скрипт подключён в index.html)

/** Цвета темы Telegram: ключи bg_color, text_color, hint_color, secondary_bg_color и др. */
type ThemeParams = Record<string, string | undefined>

/** Пользователь Telegram из initDataUnsafe (только для отображения, не для доверия) */
interface TgUser {
  /** Telegram id */
  id: number
  /** Имя */
  first_name: string
  /** Код языка интерфейса Telegram, например ru */
  language_code?: string
}

/** Кнопка Telegram внизу экрана (MainButton) */
interface TgButton {
  /** Задать текст кнопки */
  setText(t: string): void
  /** Показать кнопку */
  show(): void
  /** Скрыть кнопку */
  hide(): void
  /** Разблокировать */
  enable(): void
  /** Заблокировать */
  disable(): void
  /** Показать индикатор загрузки */
  showProgress(leaveActive?: boolean): void
  /** Убрать индикатор загрузки */
  hideProgress(): void
  /** Подписаться на нажатие */
  onClick(cb: () => void): void
  /** Отписаться от нажатия */
  offClick(cb: () => void): void
  /** Цвета кнопки */
  setParams(params: {
    /** Фон, #RRGGBB */
    color?: string
    /** Текст, #RRGGBB */
    text_color?: string
  }): void
}

/** Системная кнопка «назад» в шапке Telegram */
interface TgBackButton {
  /** Показать кнопку */
  show(): void
  /** Скрыть кнопку */
  hide(): void
  /** Подписаться на нажатие */
  onClick(cb: () => void): void
  /** Отписаться от нажатия */
  offClick(cb: () => void): void
}

/** Вибрация на телефоне */
interface TgHaptic {
  /** Короткий отклик на касание */
  impactOccurred(style: 'light' | 'medium' | 'soft'): void
  /** Отклик на результат действия */
  notificationOccurred(type: 'success' | 'error' | 'warning'): void
  /** Щелчок при смене выбранного значения (барабан, переключатель) */
  selectionChanged(): void
}

/** Используемая часть window.Telegram.WebApp */
interface WebApp {
  /** Сырая подписанная строка initData. Отправляется на сервер для проверки */
  initData: string
  /** Разобранный initData без проверки подписи */
  initDataUnsafe: {
    /** Параметр startapp из ссылки — slug мастера */
    start_param?: string
    /** Текущий пользователь */
    user?: TgUser
  }
  /** Текущая тема Telegram */
  colorScheme: 'light' | 'dark'
  /** Цвета темы */
  themeParams: ThemeParams
  /** Сообщить Telegram, что приложение готово к показу */
  ready(): void
  /** Развернуть приложение на весь экран */
  expand(): void
  /** Подписаться на событие Telegram, например themeChanged */
  onEvent(e: string, cb: () => void): void
  /** Кнопка внизу экрана */
  MainButton: TgButton
  /** Кнопка «назад» в шапке */
  BackButton: TgBackButton
  /** Вибрация, есть не во всех клиентах */
  HapticFeedback?: TgHaptic
  /** Открыть ссылку t.me внутри Telegram */
  openTelegramLink(url: string): void
  /** Системный диалог «ОК / Отмена» */
  showConfirm?(message: string, cb: (ok: boolean) => void): void
  /** Запретить закрытие приложения свайпом вниз (Bot API 7.7+) */
  disableVerticalSwipes?(): void
  /** Снова разрешить закрытие свайпом вниз */
  enableVerticalSwipes?(): void
}

declare global {
  interface Window { Telegram?: { WebApp: WebApp } }
}

export const tg: WebApp | undefined = window.Telegram?.WebApp?.initData !== undefined ? window.Telegram.WebApp : undefined

export const isInTelegram = () => !!tg && tg.initData.length > 0

/** slug мастера из ссылки t.me/<bot>/<app>?startapp=<slug> */
export function getStartParam(): string | undefined {
  return tg?.initDataUnsafe.start_param || new URLSearchParams(location.search).get('startapp') || undefined
}

const systemDark = matchMedia('(prefers-color-scheme: dark)')

function applyTheme() {
  const root = document.documentElement
  // Скрипт Telegram подключён и в обычном браузере, но там colorScheme всегда 'light' —
  // поэтому тему Telegram берём только внутри Telegram, иначе — системную
  const native = isInTelegram()
  const scheme = native ? tg!.colorScheme : systemDark.matches ? 'dark' : 'light'
  root.dataset.theme = scheme
  // Берём фон и текст из Telegram, свои акценты оставляем
  const p = native ? tg!.themeParams : {}
  const map: Record<string, string | undefined> = {
    '--tg-bg': p.bg_color,
    '--tg-text': p.text_color,
    '--tg-hint': p.hint_color,
    '--tg-secondary-bg': p.secondary_bg_color,
  }
  for (const [k, v] of Object.entries(map)) {
    if (v) root.style.setProperty(k, v)
    else root.style.removeProperty(k)
  }
}

export function initTelegram() {
  applyTheme()
  if (!isInTelegram()) {
    systemDark.addEventListener('change', applyTheme)
    return
  }
  tg!.ready()
  tg!.expand()
  tg!.onEvent('themeChanged', applyTheme)
}

/**
 * Пока идёт перетаскивание, свайп вниз не должен сворачивать приложение.
 * @param locked true — запретить свайп, false — вернуть
 */
export function lockVerticalSwipes(locked: boolean) {
  if (locked) tg?.disableVerticalSwipes?.()
  else tg?.enableVerticalSwipes?.()
}

export const haptic = {
  tap: () => tg?.HapticFeedback?.impactOccurred('soft'),
  select: () => tg?.HapticFeedback?.selectionChanged(),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
}

/**
 * Подтверждение действия: системный диалог Telegram, в браузере — window.confirm.
 * @param message вопрос (уже переведённый)
 */
export function confirmDialog(message: string): Promise<boolean> {
  if (isInTelegram() && tg!.showConfirm) {
    return new Promise((resolve) => tg!.showConfirm!(message, resolve))
  }
  return Promise.resolve(window.confirm(message))
}
