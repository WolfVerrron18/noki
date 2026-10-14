import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setToken } from '@/api/http'
import { enableMockRepo, repo } from '@/api/repo'
import { authApi } from '@/api/services/auth'
import type { Me } from '@/api/types'
import { tg, isInTelegram, requestWriteAccess } from '@/telegram'
import { DEMO_BUILD, PREVIEW_MODE } from '@/demo'

export const useAuth = defineStore('auth', () => {
  const me = ref<Me | null>(null)
  // ключ i18n, текст подставляет экран
  const error = ref<string | null>(null)

  /** Отправляем сырой initData на сервер, он проверяет подпись и выдаёт токен */
  async function login() {
    if (me.value) return
    error.value = null
    let initData = tg?.initData ?? ''
    if (!isInTelegram()) {
      if (!PREVIEW_MODE) {
        error.value = 'auth.openInTelegram'
        return
      }
      // Режим просмотра в браузере: пробуем dev-вход на сервере (NIDOKI_DEV_AUTH=1),
      // а если бэкенд не запущен (или это демо-сборка без бэкенда) — тестовый пользователь и данные в браузере
      initData = 'dev'
      try {
        if (DEMO_BUILD) throw new Error('demo')
        await authApi.health()
      } catch {
        enableMockRepo()
        me.value = { id: 'preview', telegram_id: 1000001, name: 'Preview' }
        return
      }
    }
    try {
      const res = await authApi.login(initData)
      setToken(res.token)
      me.value = { id: res.user.id, telegram_id: res.user.telegram_id, name: res.user.name }
      botAccess.value = res.write_access
    } catch {
      error.value = 'auth.failed'
    }
  }

  /** Может ли бот писать: уведомления о записях и напоминания приходят только с разрешением */
  const botAccess = ref(false)

  /**
   * Попросить разрешение боту писать, если его ещё нет. Telegram показывает свой диалог; вне Telegram — ничего.
   * Ответ сохраняется на сервере. Ошибки не мешают экрану: это необязательный шаг.
   */
  async function askBotAccess() {
    if (botAccess.value) return
    const allowed = await requestWriteAccess()
    if (allowed === null) return
    botAccess.value = allowed
    await repo().setBotAccess(allowed).catch(() => {})
  }

  return { me, error, login, botAccess, askBotAccess }
})
