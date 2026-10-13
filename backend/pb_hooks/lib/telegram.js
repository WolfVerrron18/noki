// Утилиты Telegram: проверка initData (позже — отправка сообщений ботом)

const MAX_AGE_SEC = 24 * 60 * 60

function parseQuery(qs) {
  const out = {}
  for (const part of qs.split("&")) {
    if (!part) continue
    const i = part.indexOf("=")
    const k = decodeURIComponent((i < 0 ? part : part.slice(0, i)).replace(/\+/g, " "))
    const v = i < 0 ? "" : decodeURIComponent(part.slice(i + 1).replace(/\+/g, " "))
    out[k] = v
  }
  return out
}

/**
 * Проверка initData: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * Возвращает { user, startParam } или бросает ошибку.
 */
function validateInitData(initData, botToken, nowSec) {
  const c = require(`${__hooks}/lib/crypto.js`)
  if (!initData || !botToken) throw new Error("empty initData or bot token")

  const params = parseQuery(initData)
  const hash = params.hash
  if (!hash) throw new Error("no hash")

  const dataCheck = Object.keys(params)
    .filter((k) => k !== "hash")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("\n")

  const secret = c.hmacSha256(c.utf8("WebAppData"), c.utf8(botToken))
  const expected = c.toHex(c.hmacSha256(secret, c.utf8(dataCheck)))
  if (!c.safeEqual(expected, hash.toLowerCase())) throw new Error("bad signature")

  const authDate = parseInt(params.auth_date, 10)
  if (!authDate || nowSec - authDate > MAX_AGE_SEC) throw new Error("initData expired")

  const user = JSON.parse(params.user || "null")
  if (!user || !user.id) throw new Error("no user")
  return { user, startParam: params.start_param || "" }
}

module.exports = { parseQuery, validateInitData }
