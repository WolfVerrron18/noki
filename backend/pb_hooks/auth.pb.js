/// <reference path="../pb_data/types.d.ts" />

// POST /api/tg-auth { initData } → { token, record, master }
// Единственный способ войти: подпись initData проверяется на сервере.
routerAdd("POST", "/api/tg-auth", (e) => {
  const tg = require(`${__hooks}/lib/telegram.js`)
  const body = e.requestInfo().body || {}
  const initData = String(body.initData || "")

  let tgUser
  if (initData === "dev" && $os.getenv("NIDOKI_DEV_AUTH") === "1") {
    tgUser = { id: 1000001, first_name: "Тестовая", last_name: "Мастерица" }
  } else {
    try {
      tgUser = tg.validateInitData(initData, $os.getenv("TELEGRAM_BOT_TOKEN"), Math.floor(Date.now() / 1000)).user
    } catch (err) {
      throw new UnauthorizedError("Не удалось проверить вход через Telegram")
    }
  }

  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").slice(0, 100)

  let record
  try {
    record = $app.findFirstRecordByData("users", "telegram_id", tgUser.id)
  } catch (_) {
    const users = $app.findCollectionByNameOrId("users")
    record = new Record(users)
    record.set("telegram_id", tgUser.id)
    record.set("email", `tg${tgUser.id}@users.nidoki.local`)
    record.setPassword($security.randomString(40))
    record.setVerified(true)
  }
  record.set("name", name)
  $app.save(record)

  let master = null
  try {
    master = $app.findFirstRecordByData("masters", "user", record.id).id
  } catch (_) {}

  return e.json(200, {
    token: record.newAuthToken(),
    record: {
      id: record.id,
      telegram_id: record.getInt("telegram_id"),
      name: record.getString("name"),
    },
    master,
  })
})
