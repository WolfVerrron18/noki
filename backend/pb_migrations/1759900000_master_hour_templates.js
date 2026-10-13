/// <reference path="../pb_data/types.d.ts" />
// Свои шаблоны рабочего дня мастера: [{ id, ranges: [["10:00","14:00"],["15:00","19:00"]] }]
migrate((app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.add(new Field({ name: "hour_templates", type: "json", maxSize: 5000 }))
  app.save(masters)
}, (app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.removeByName("hour_templates")
  app.save(masters)
})
