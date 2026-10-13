/// <reference path="../pb_data/types.d.ts" />
// Услуги: описание, категория из справочника (EnumServiceCategory на фронте) и порядок в списке мастера
migrate((app) => {
  const services = app.findCollectionByNameOrId("services")
  services.fields.add(new Field({ name: "description", type: "text", max: 300 }))
  // текст, а не select: новые категории добавляются в коде без миграции, неизвестные фронт показывает как «Другое»
  services.fields.add(new Field({ name: "category", type: "text", max: 40 }))
  services.fields.add(new Field({ name: "sort", type: "number", onlyInt: true }))
  app.save(services)
}, (app) => {
  const services = app.findCollectionByNameOrId("services")
  for (const name of ["description", "category", "sort"]) services.fields.removeByName(name)
  app.save(services)
})
