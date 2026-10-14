// Запросы к нашему API. В проде фронт и API на одном домене (Nginx проксирует /api), в dev — прокси Vite.

/** Ошибка API: экраны различают её по status (404, 409) */
export interface ApiError extends Error {
  /** HTTP-статус; 0 — нет связи */
  status: number
  /** Код ошибки от сервера, например "slot_taken" */
  code?: string
}

/** Параметры запроса */
export interface RequestOptions {
  /** HTTP-метод, по умолчанию GET */
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Тело: уйдёт JSON */
  body?: unknown
  /** Параметры адреса; undefined пропускаются */
  query?: Record<string, string | number | undefined>
}

/** Токен входа: выдаёт сервер после проверки initData */
let token = ''

/**
 * Запомнить токен входа.
 * @param value токен
 */
export function setToken(value: string) {
  token = value
}

/**
 * Запрос к API.
 * @param path путь, начиная с /api
 * @param options метод, тело, параметры
 * @returns ответ JSON; пустой ответ — undefined
 * @throws ApiError со статусом
 */
export async function api<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) params.set(k, String(v))
  const url = params.size ? `${path}?${params}` : path

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw Object.assign(new Error('network'), { status: 0 }) as ApiError
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) throw Object.assign(new Error(data?.error ?? String(res.status)), { status: res.status, code: data?.error }) as ApiError
  return data as T
}
