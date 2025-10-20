/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_520427368")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_520427368")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != \"\" && created_by = @request.auth.id",
    "updateRule": "@request.auth.id != \"\" && created_by = @request.auth.id"
  }, collection)

  return app.save(collection)
})
