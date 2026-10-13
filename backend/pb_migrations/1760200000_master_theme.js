/// <reference path="../pb_data/types.d.ts" />
// Цветовая тема мастера: в ней мастер видит кабинет, клиентки — страницу записи.
// Значения — ключи $palettes в frontend/src/styles/_palette.scss; пусто — тема по умолчанию (rose).
migrate((app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.add(new Field({ name: "theme", type: "select", maxSelect: 1, values: ["rose", "lavender", "mint", "peach", "sky"] }))
  app.save(masters)
}, (app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.removeByName("theme")
  app.save(masters)
})
