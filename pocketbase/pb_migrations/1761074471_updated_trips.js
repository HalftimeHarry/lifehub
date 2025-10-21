/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1630916145")

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "select1359872172",
    "maxSelect": 1,
    "name": "transport_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "plane",
      "car",
      "train",
      "bus",
      "uber",
      "lyft",
      "taxi",
      "boat",
      "bike",
      "walk",
      "free ride",
      "other"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1630916145")

  // update field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "select1359872172",
    "maxSelect": 1,
    "name": "transport_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "plane",
      "car",
      "train"
    ]
  }))

  return app.save(collection)
})
