// Сообщения от бота. Уведомления о записях появятся на этапе бота; пока — пересылка отзывов разработчику.

/** Отправить сообщение в чат Telegram; ошибки не роняют запрос */
export type Notifier = (chatId: string | number, text: string) => Promise<void>

/**
 * Отправка через Bot API.
 * @param botToken токен бота; пусто — сообщения не отправляются
 */
export function telegramNotifier(botToken: string): Notifier {
  return async (chatId, text) => {
    if (!botToken || !chatId) return
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      if (!res.ok) console.warn('telegram sendMessage', res.status, await res.text())
    } catch (e) {
      console.warn('telegram sendMessage failed', e)
    }
  }
}
