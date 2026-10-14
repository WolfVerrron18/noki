// Жизнь бота на сервере: как получать сообщения (опрос или вебхук), меню бота, таймер напоминаний.
import type { Config } from '~/config'
import type { BotApiCall } from '~/bot/api'
import type { TelegramUpdate } from '~/bot/updates'

/** Как часто проверять напоминания, мс */
export const REMINDER_TICK_MS = 60_000

/**
 * Настроить бота в Telegram: команды, кнопку меню (мини-апп) и способ получения сообщений.
 * @param call клиент Bot API
 * @param config настройки
 */
export async function setupBot(call: BotApiCall, config: Config): Promise<void> {
  await call('setMyCommands', { commands: [{ command: 'start', description: 'Nidoki' }] })
  // кнопка мини-аппа слева от поля ввода — только с публичным https-адресом
  if (config.publicUrl.startsWith('https://')) {
    await call('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Nidoki', web_app: { url: config.publicUrl } } })
  }
  if (config.botMode === 'webhook') {
    await call('setWebhook', {
      url: `${config.publicUrl}/api/telegram/webhook`,
      secret_token: config.webhookSecret,
      allowed_updates: ['message'],
    })
  } else {
    // опрос не работает, пока у бота есть вебхук
    await call('deleteWebhook', {})
  }
}

/**
 * Опрос Telegram (getUpdates) — для разработки без публичного адреса. Работает, пока не вызвали stop.
 * @param call клиент Bot API
 * @param onUpdate обработчик обновления
 * @returns функция остановки
 */
export function startPolling(call: BotApiCall, onUpdate: (u: TelegramUpdate) => Promise<void>): () => void {
  let stopped = false
  let offset = 0
  ;(async () => {
    while (!stopped) {
      try {
        const updates = await call<TelegramUpdate[]>('getUpdates', { offset, timeout: 25, allowed_updates: ['message'] })
        for (const u of updates) {
          offset = u.update_id + 1
          await onUpdate(u).catch((e) => console.error('telegram update failed', e))
        }
      } catch (e) {
        if (!stopped) {
          console.warn('getUpdates failed, retry in 5s:', (e as Error).message)
          await new Promise((r) => setTimeout(r, 5000))
        }
      }
    }
  })()
  return () => {
    stopped = true
  }
}
