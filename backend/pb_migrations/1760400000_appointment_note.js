/// <reference path="../pb_data/types.d.ts" />
// Заметка к записи: «записываю маму», пожелания. Пишет клиентка при записи или мастер при ручной записи.
migrate((app) => {
  const appointments = app.findCollectionByNameOrId("appointments")
  appointments.fields.add(new Field({ name: "note", type: "text", max: 300 }))
  app.save(appointments)
}, (app) => {
  const appointments = app.findCollectionByNameOrId("appointments")
  appointments.fields.removeByName("note")
  app.save(appointments)
})
