/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_520427368")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select537150624",
    "maxSelect": 1,
    "name": "relationship",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Friend",
      "X"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_520427368")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select537150624",
    "maxSelect": 1,
    "name": "relationship",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Friend",
      "Ex"
    ]
  }))

  return app.save(collection)
})
