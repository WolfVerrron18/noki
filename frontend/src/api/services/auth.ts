// Вход: проверка, что сервер на связи, и вход по initData из Telegram
import { api } from '@/api/http'
import type { Me } from '@/api/types'

/** Ответ сервера на вход */
export interface LoginResult {
  /** Токен для следующих запросов */
  token: string
  /** Кто вошёл */
  user: Me
  /** id профиля мастера; null — ещё не мастер */
  master: string | null
  /** Может ли бот писать пользователю; нет — мини-апп попросит разрешение */
  write_access: boolean
}

export const authApi = {
  /** Сервер на связи (режим просмотра решает, нужен ли мок) */
  health: () => api<{ ok: boolean }>('/api/health'),

  /**
   * Войти: сервер проверяет подпись initData и выдаёт токен.
   * @param initData Telegram.WebApp.initData как есть ("dev" — тестовый вход)
   */
  login: (initData: string) => api<LoginResult>('/api/auth/telegram', { method: 'POST', body: { initData } }),
}
