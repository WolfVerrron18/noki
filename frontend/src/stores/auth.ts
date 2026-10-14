import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setToken } from '@/api/http'
import { enableMockRepo } from '@/api/repo'
import { authApi } from '@/api/services/auth'
import type { Me } from '@/api/types'
import { tg, isInTelegram } from '@/telegram'
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
    } catch {
      error.value = 'auth.failed'
    }
  }

  return { me, error, login }
})
