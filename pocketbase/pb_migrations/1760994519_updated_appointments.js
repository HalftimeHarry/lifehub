/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1037645436")

  // update field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_520427368",
    "hidden": false,
    "id": "relation4017424888",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "for",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1037645436")

  // update field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_520427368",
    "hidden": false,
    "id": "relation4017424888",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "for",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
