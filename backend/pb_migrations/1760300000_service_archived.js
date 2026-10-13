/// <reference path="../pb_data/types.d.ts" />
// Мягкое удаление услуги: на неё могут ссылаться записи, поэтому вместо удаления — archived = true.
migrate((app) => {
  const services = app.findCollectionByNameOrId("services")
  services.fields.add(new Field({ name: "archived", type: "bool" }))
  app.save(services)
}, (app) => {
  const services = app.findCollectionByNameOrId("services")
  services.fields.removeByName("archived")
  app.save(services)
})
