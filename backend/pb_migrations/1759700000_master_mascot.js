/// <reference path="../pb_data/types.d.ts" />
// Внешность Ноки мастера из конструктора: { fur, background, head, neck, badge }.
// Значения — id из enum'ов фронта (frontend/src/components/mascot/look.ts).
migrate((app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.add(new Field({ name: "mascot", type: "json", maxSize: 1000 }))
  app.save(masters)
}, (app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.removeByName("mascot")
  app.save(masters)
})
