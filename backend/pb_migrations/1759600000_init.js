/// <reference path="../pb_data/types.d.ts" />
// Схема Nidoki: users(+telegram_id), masters, services, appointments, feedback
migrate((app) => {
  // users — встроенная auth-коллекция, добавляем telegram_id
  const users = app.findCollectionByNameOrId("users")
  users.fields.add(new Field({ name: "telegram_id", type: "number", required: true, onlyInt: true }))
  users.indexes.push("CREATE UNIQUE INDEX idx_users_tg ON users (telegram_id)")
  // профили создаёт только хук /api/tg-auth
  users.createRule = null
  users.listRule = "id = @request.auth.id"
  users.viewRule = "id = @request.auth.id"
  users.updateRule = null
  app.save(users)

  const masters = new Collection({
    type: "base",
    name: "masters",
    // страницу мастера видят все (клиентки по slug)
    listRule: "",
    viewRule: "",
    createRule: "@request.auth.id != '' && user = @request.auth.id",
    updateRule: "user = @request.auth.id && (@request.body.user:isset = false || @request.body.user = @request.auth.id)",
    deleteRule: null,
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { name: "name", type: "text", required: true, max: 100 },
      { name: "slug", type: "text", required: true, min: 3, max: 40, pattern: "^[a-z0-9_-]+$" },
      { name: "timezone", type: "text", required: true },
      // { "1": [["10:00","19:00"]], ... } — ключи 1..7 (пн..вс)
      { name: "work_hours", type: "json", maxSize: 4000 },
      { name: "slot_step_min", type: "number", required: true, onlyInt: true, min: 15, max: 60 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_masters_slug ON masters (slug)",
      "CREATE UNIQUE INDEX idx_masters_user ON masters (user)",
    ],
  })
  app.save(masters)

  const services = new Collection({
    type: "base",
    name: "services",
    listRule: "is_active = true || master.user = @request.auth.id",
    viewRule: "is_active = true || master.user = @request.auth.id",
    createRule: "master.user = @request.auth.id",
    updateRule: "master.user = @request.auth.id && (@request.body.master:isset = false || @request.body.master.user = @request.auth.id)",
    deleteRule: null, // услуги скрываем через is_active, чтобы не ломать старые записи
    fields: [
      { name: "master", type: "relation", required: true, collectionId: masters.id, maxSelect: 1, cascadeDelete: true },
      { name: "name", type: "text", required: true, max: 120 },
      { name: "duration_min", type: "number", required: true, onlyInt: true, min: 5, max: 600 },
      { name: "price", type: "number", min: 0 },
      { name: "is_active", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
    ],
  })
  app.save(services)

  const appointments = new Collection({
    type: "base",
    name: "appointments",
    // мастер видит свои записи, клиентка — только свои
    listRule: "master.user = @request.auth.id || client_telegram_id = @request.auth.telegram_id",
    viewRule: "master.user = @request.auth.id || client_telegram_id = @request.auth.telegram_id",
    // создание и отмена — только через кастомные эндпоинты с проверкой пересечений (шаг 6)
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "master", type: "relation", required: true, collectionId: masters.id, maxSelect: 1, cascadeDelete: true },
      { name: "service", type: "relation", required: true, collectionId: services.id, maxSelect: 1 },
      { name: "client_name", type: "text", required: true, max: 100 },
      { name: "client_phone", type: "text", max: 30 },
      { name: "client_telegram_id", type: "number", onlyInt: true },
      { name: "start_at", type: "date", required: true },
      { name: "end_at", type: "date", required: true },
      { name: "status", type: "select", required: true, maxSelect: 1, values: ["booked", "cancelled", "done"] },
      { name: "source", type: "select", required: true, maxSelect: 1, values: ["client", "manual"] },
      { name: "reminder_sent", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE INDEX idx_appt_master_start ON appointments (master, start_at)",
      "CREATE INDEX idx_appt_client ON appointments (client_telegram_id)",
    ],
  })
  app.save(appointments)

  const feedback = new Collection({
    type: "base",
    name: "feedback",
    listRule: null,
    viewRule: null,
    createRule: null, // через хук, он же пересылает разработчику
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "author_telegram_id", type: "number", onlyInt: true },
      { name: "role", type: "select", maxSelect: 1, values: ["master", "client"] },
      { name: "text", type: "text", required: true, max: 2000 },
      { name: "created", type: "autodate", onCreate: true },
    ],
  })
  app.save(feedback)
}, (app) => {
  for (const name of ["feedback", "appointments", "services", "masters"]) {
    app.delete(app.findCollectionByNameOrId(name))
  }
  const users = app.findCollectionByNameOrId("users")
  users.fields.removeByName("telegram_id")
  users.indexes = users.indexes.filter((i) => !i.includes("idx_users_tg"))
  app.save(users)
})
