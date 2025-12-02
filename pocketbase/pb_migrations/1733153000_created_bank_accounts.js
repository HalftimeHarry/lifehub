/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "bank_accounts_001",
    "created": "2025-12-02 15:30:00.000Z",
    "updated": "2025-12-02 15:30:00.000Z",
    "name": "bank_accounts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "name_field",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "type_field",
        "name": "type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "checking",
            "savings",
            "business",
            "credit_card",
            "investment",
            "cash"
          ]
        }
      },
      {
        "system": false,
        "id": "balance_field",
        "name": "balance",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "institution_field",
        "name": "institution",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "last_four_field",
        "name": "last_four",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 4,
          "max": 4,
          "pattern": "^[0-9]{4}$"
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("bank_accounts_001");

  return dao.deleteCollection(collection);
})
