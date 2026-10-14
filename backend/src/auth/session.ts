// Токен входа: после проверки initData сервер выдаёт подписанный JWT, дальше фронт ходит с ним.
import type { Context, MiddlewareHandler } from 'hono'
import { sign, verify } from 'hono/jwt'
import type { AppEnv, AuthUser } from '~/app'
import { unauthorized } from '~/lib/errors'

/** Сколько живёт токен; истёк — фронт снова входит через initData */
export const TOKEN_TTL_SEC = 7 * 24 * 60 * 60

/**
 * Выдать токен.
 * @param user кто вошёл
 * @param secret секрет подписи
 * @param now текущий момент
 */
export function issueToken(user: AuthUser, secret: string, now: Date): Promise<string> {
  // без iat: hono/jwt сверяет его с часами системы, а срок мы проверяем по часам приложения
  return sign({ sub: user.id, tg: user.telegramId, exp: Math.floor(now.getTime() / 1000) + TOKEN_TTL_SEC }, secret, 'HS256')
}

/**
 * Прочитать пользователя из заголовка Authorization для всех запросов; без токена — null.
 * Неверный или истёкший токен — 401: фронт войдёт заново.
 * @param secret секрет подписи
 * @param now часы приложения
 */
export function readUser(secret: string, now: () => Date): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const header = c.req.header('Authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) {
      c.set('user', null)
      return next()
    }
    try {
      const p = await verify(token, secret, 'HS256')
      if (typeof p.exp !== 'number' || p.exp * 1000 <= now().getTime()) throw new Error('expired')
      c.set('user', { id: String(p.sub), telegramId: Number(p.tg) })
    } catch {
      throw unauthorized('token_invalid')
    }
    return next()
  }
}

/**
 * Пользователь запроса; без входа — 401.
 * @param c контекст
 */
export function requireUser(c: Context<AppEnv>): AuthUser {
  const user = c.get('user')
  if (!user) throw unauthorized()
  return user
}
