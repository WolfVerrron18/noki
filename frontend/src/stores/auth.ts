import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pb } from '@/api/pb'
import { enableMockRepo } from '@/api/repo'
import { tg, isInTelegram } from '@/telegram'

/** Текущий пользователь после входа */
export interface Me {
  /** id в коллекции users */
  id: string
  /** Telegram id */
  telegram_id: number
  /** Имя из профиля Telegram */
  name: string
}

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
      if (!import.meta.env.DEV) {
        error.value = 'auth.openInTelegram'
        return
      }
      // Режим разработки в браузере: пробуем dev-вход на сервере (NIDOKI_DEV_AUTH=1),
      // а если бэкенд не запущен — работаем с тестовым пользователем и данными в браузере
      initData = 'dev'
      try {
        await pb.send('/api/health', {})
      } catch {
        enableMockRepo()
        me.value = { id: 'preview', telegram_id: 1000001, name: 'Preview' }
        return
      }
    }
    try {
      const res = await pb.send<{ token: string; record: Me }>('/api/tg-auth', {
        method: 'POST',
        body: { initData },
      })
      pb.authStore.save(res.token, null)
      me.value = { id: res.record.id, telegram_id: res.record.telegram_id, name: res.record.name }
    } catch {
      error.value = 'auth.failed'
    }
  }

  return { me, error, login }
})
