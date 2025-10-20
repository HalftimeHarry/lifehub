/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_777652154")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3112802451",
    "max": 0,
    "min": 0,
    "name": "driver_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3301792496",
    "max": 0,
    "min": 0,
    "name": "driver_phone",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3105096203",
    "max": 0,
    "min": 0,
    "name": "vehicle_info",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4137055384",
    "max": 0,
    "min": 0,
    "name": "pickup_location",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text299442215",
    "max": 0,
    "min": 0,
    "name": "pickup_time",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1738908931",
    "max": 0,
    "min": 0,
    "name": "dropoff_location",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3977502414",
    "max": 0,
    "min": 0,
    "name": "dropoff_time",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1232050308",
    "max": 0,
    "min": 0,
    "name": "confirmation_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2851491395",
    "max": 0,
    "min": 0,
    "name": "flight_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3960741624",
    "max": 0,
    "min": 0,
    "name": "airline",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2407208257",
    "max": 0,
    "min": 0,
    "name": "terminal",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3089864852",
    "max": 0,
    "min": 0,
    "name": "gate",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1029453414",
    "max": 0,
    "min": 0,
    "name": "seat",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(15, new Field({
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
  collection.fields.addAt(16, new Field({
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
  collection.fields.addAt(17, new Field({
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
  collection.fields.addAt(18, new Field({
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

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "number405181692",
    "max": null,
    "min": null,
    "name": "cost",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_777652154")

  // remove field
  collection.fields.removeById("text3112802451")

  // remove field
  collection.fields.removeById("text3301792496")

  // remove field
  collection.fields.removeById("text3105096203")

  // remove field
  collection.fields.removeById("text4137055384")

  // remove field
  collection.fields.removeById("text299442215")

  // remove field
  collection.fields.removeById("text1738908931")

  // remove field
  collection.fields.removeById("text3977502414")

  // remove field
  collection.fields.removeById("text1232050308")

  // remove field
  collection.fields.removeById("text2851491395")

  // remove field
  collection.fields.removeById("text3960741624")

  // remove field
  collection.fields.removeById("text2407208257")

  // remove field
  collection.fields.removeById("text3089864852")

  // remove field
  collection.fields.removeById("text1029453414")

  // remove field
  collection.fields.removeById("text18589324")

  // remove field
  collection.fields.removeById("relation4265146436")

  // remove field
  collection.fields.removeById("relation1985410363")

  // remove field
  collection.fields.removeById("relation4017424888")

  // remove field
  collection.fields.removeById("number405181692")

  return app.save(collection)
})
