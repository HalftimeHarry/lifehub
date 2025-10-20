/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1691921218")

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text18589324",
    "max": 0,
    "min": 0,
    "name": "notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1037645436",
    "hidden": false,
    "id": "relation4265146436",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "appointment",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1630916145",
    "hidden": false,
    "id": "relation1985410363",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "trip",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_520427368",
    "hidden": false,
    "id": "relation4017424888",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "for",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1691921218")

  // remove field
  collection.fields.removeById("text18589324")

  // remove field
  collection.fields.removeById("relation4265146436")

  // remove field
  collection.fields.removeById("relation1985410363")

  // remove field
  collection.fields.removeById("relation4017424888")

  return app.save(collection)
})
