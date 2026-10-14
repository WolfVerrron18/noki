// Отправка сообщений через Bot API. Ошибки Telegram не роняют запросы приложения: send возвращает false.

/** Кнопка под сообщением: открывает ссылку (t.me на мини-апп) */
export interface BotButton {
  /** Подпись */
  text: string
  /** Ссылка */
  url: string
}

/** Сообщение бота */
export interface BotMessage {
  /** Первая строка — заголовок, выделяется жирным */
  title: string
  /** Остальные строки; пустые пропускаются */
  lines?: (string | null | undefined | false)[]
  /** Кнопки под сообщением, по одной в ряд */
  buttons?: BotButton[]
}

/** Бот: отправить сообщение пользователю */
export interface Bot {
  /**
   * Отправить сообщение.
   * @param chatId Telegram id получателя (в личке — id пользователя)
   * @param message заголовок, строки, кнопки
   * @returns false — не отправилось (бот заблокирован, нет связи, бот не настроен)
   */
  send(chatId: number | string, message: BotMessage): Promise<boolean>
}

/** Вызов метода Bot API */
export type BotApiCall = <T = unknown>(method: string, params: Record<string, unknown>) => Promise<T>

/** Сколько ждать ответа Telegram, мс */
const TIMEOUT_MS = 8000

/**
 * HTML для Telegram: экранируем то, что ввели люди (имена, заметки).
 * @param s текст
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Текст сообщения в HTML Telegram.
 * @param message сообщение
 */
export function renderMessage(message: BotMessage): string {
  const body = (message.lines ?? []).filter((l): l is string => !!l).map(escapeHtml)
  return [`<b>${escapeHtml(message.title)}</b>`, ...body].join('\n')
}

/**
 * Клиент Bot API.
 * @param token токен бота
 * @throws Error с описанием от Telegram, если метод вернул ошибку
 */
export function botApi(token: string): BotApiCall {
  return async <T>(method: string, params: Record<string, unknown>) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(method === 'getUpdates' ? TIMEOUT_MS + 30_000 : TIMEOUT_MS),
    })
    const data = (await res.json()) as { ok: boolean; result?: T; description?: string; error_code?: number }
    if (!data.ok) throw Object.assign(new Error(`${method}: ${data.description}`), { code: data.error_code })
    return data.result as T
  }
}

/**
 * Бот поверх Bot API.
 * @param call клиент Bot API; null — бот не настроен, сообщения не отправляются
 */
export function telegramBot(call: BotApiCall | null): Bot {
  return {
    async send(chatId, message) {
      if (!call || !chatId) return false
      try {
        await call('sendMessage', {
          chat_id: chatId,
          text: renderMessage(message),
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
          ...(message.buttons?.length ? { reply_markup: { inline_keyboard: message.buttons.map((b) => [b]) } } : {}),
        })
        return true
      } catch (e) {
        console.warn('telegram send failed', chatId, (e as Error).message)
        return false
      }
    },
  }
}
