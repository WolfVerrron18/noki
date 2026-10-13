/// <reference path="../pb_data/types.d.ts" />
// Точное время записи: режим (сетка по часам или точные времена) и сами времена.
// work_slots: { "1": ["10:30","12:30"] }, slot_overrides: { "2026-10-14": ["11:00"] },
// slot_templates: [{ id, times: ["10:30","12:30"] }]
migrate((app) => {
  const masters = app.findCollectionByNameOrId("masters")
  masters.fields.add(new Field({ name: "slot_mode", type: "select", values: ["grid", "fixed"], maxSelect: 1 }))
  masters.fields.add(new Field({ name: "work_slots", type: "json", maxSize: 4000 }))
  masters.fields.add(new Field({ name: "slot_overrides", type: "json", maxSize: 20000 }))
  masters.fields.add(new Field({ name: "slot_templates", type: "json", maxSize: 5000 }))
  app.save(masters)
}, (app) => {
  const masters = app.findCollectionByNameOrId("masters")
  for (const name of ["slot_mode", "work_slots", "slot_overrides", "slot_templates"]) masters.fields.removeByName(name)
  app.save(masters)
})
