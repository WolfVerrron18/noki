// Ошибки API: статус + короткий код. Фронт различает их по статусу (404, 409), код — для логов и отладки.

/** Ошибка, которую сервер отдаёт клиенту как есть */
export class HttpError extends Error {
  /**
   * @param status HTTP-статус
   * @param code код ошибки, например "slot_taken"
   */
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409,
    readonly code: string,
  ) {
    super(code)
  }
}

export const badRequest = (code = 'bad_request') => new HttpError(400, code)
export const unauthorized = (code = 'unauthorized') => new HttpError(401, code)
export const forbidden = (code = 'forbidden') => new HttpError(403, code)
export const notFound = (code = 'not_found') => new HttpError(404, code)
export const conflict = (code = 'conflict') => new HttpError(409, code)

/** Коды ошибок Postgres, которые превращаем в 409 */
export const PG_UNIQUE_VIOLATION = '23505'
export const PG_EXCLUSION_VIOLATION = '23P01'

/**
 * Код ошибки Postgres: у postgres-js и PGlite он в code, Drizzle может завернуть ошибку в cause.
 * @param e пойманная ошибка
 */
export function pgCode(e: unknown): string | undefined {
  const err = e as { code?: unknown; cause?: { code?: unknown } }
  const code = err?.code ?? err?.cause?.code
  return typeof code === 'string' ? code : undefined
}
