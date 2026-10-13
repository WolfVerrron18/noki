/// <reference path="../pb_data/types.d.ts" />
// График мастера: режим (каждую неделю / по датам) и часы на конкретные даты.
// day_overrides: { "YYYY-MM-DD": [["10:00","19:00"]] }, пустой массив — выходной.
migrate((app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.add(new Field({ name: "schedule_mode", type: "select", maxSelect: 1, values: ["weekly", "dates"] }))
  masters.fields.add(new Field({ name: "day_overrides", type: "json", maxSize: 20000 }))
  app.save(masters)
}, (app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.removeByName("schedule_mode")
  masters.fields.removeByName("day_overrides")
  app.save(masters)
})
