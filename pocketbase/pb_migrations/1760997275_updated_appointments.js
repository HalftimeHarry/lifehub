/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1037645436")

  // add field
  collection.fields.addAt(12, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_520427368",
    "hidden": false,
    "id": "relation291929305",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "driver",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1037645436")

  // remove field
  collection.fields.removeById("relation291929305")

  return app.save(collection)
})
