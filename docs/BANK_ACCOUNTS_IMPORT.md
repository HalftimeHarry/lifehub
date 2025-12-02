# Bank Accounts Collection Import Guide

This guide explains how to create and import the `bank_accounts` collection into PocketBase via the production UI.

## Collection Schema

**Collection Name:** `bank_accounts`  
**Collection Type:** Base Collection

### Fields

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | Yes | - |
| type | Select | Yes | Values: `checking`, `savings`, `business`, `credit_card`, `investment`, `cash` |
| balance | Number | Yes | - |
| institution | Text | No | - |
| last_four | Text | No | Min: 4, Max: 4, Pattern: `^[0-9]{4}$` |

### API Rules

Set all rules to empty string `""` to allow public access:
- List rule: `""`
- View rule: `""`
- Create rule: `""`
- Update rule: `""`
- Delete rule: `""`

## Import Steps

### 1. Access PocketBase Admin UI

Navigate to: [https://pocketbase-production-f733.up.railway.app/_/](https://pocketbase-production-f733.up.railway.app/_/)

Login with credentials from `.env`:
- Email: `ddinsmore8@gmail.com`
- Password: `MADcap(123)`

### 2. Create Collection

1. Click **"New collection"**
2. Select **"Base collection"**
3. Enter collection name: `bank_accounts`

### 3. Add Fields

Click **"+ New field"** for each field:

#### Field 1: name
- Type: **Text**
- Name: `name`
- Required: ✓ **Yes**

#### Field 2: type
- Type: **Select**
- Name: `type`
- Required: ✓ **Yes**
- Max select: `1`
- Values (one per line):
  ```
  checking
  savings
  business
  credit_card
  investment
  cash
  ```

#### Field 3: balance
- Type: **Number**
- Name: `balance`
- Required: ✓ **Yes**

#### Field 4: institution
- Type: **Text**
- Name: `institution`
- Required: ☐ No

#### Field 5: last_four
- Type: **Text**
- Name: `last_four`
- Required: ☐ No
- Min length: `4`
- Max length: `4`
- Pattern: `^[0-9]{4}$`

### 4. Set API Rules

In the **"API Rules"** tab:
- List rule: `""`
- View rule: `""`
- Create rule: `""`
- Update rule: `""`
- Delete rule: `""`

### 5. Save Collection

Click **"Create"** to save the collection.

## Sample Data

### JSON Array for Bulk Import

Copy this entire JSON array to import all records at once:

```json
[
  {
    "name": "Chase Checking",
    "type": "checking",
    "balance": 5420.50,
    "institution": "Chase Bank",
    "last_four": "1234"
  },
  {
    "name": "Ally Savings",
    "type": "savings",
    "balance": 12500.00,
    "institution": "Ally Bank",
    "last_four": "5678"
  },
  {
    "name": "Business Account",
    "type": "business",
    "balance": 8750.25,
    "institution": "Wells Fargo",
    "last_four": "9012"
  },
  {
    "name": "Chase Sapphire",
    "type": "credit_card",
    "balance": -2340.00,
    "institution": "Chase Bank",
    "last_four": "3456"
  }
]
```

### Individual Records

If importing one at a time:

**Record 1: Chase Checking**
```json
{"name": "Chase Checking", "type": "checking", "balance": 5420.50, "institution": "Chase Bank", "last_four": "1234"}
```

**Record 2: Ally Savings**
```json
{"name": "Ally Savings", "type": "savings", "balance": 12500.00, "institution": "Ally Bank", "last_four": "5678"}
```

**Record 3: Business Account**
```json
{"name": "Business Account", "type": "business", "balance": 8750.25, "institution": "Wells Fargo", "last_four": "9012"}
```

**Record 4: Credit Card**
```json
{"name": "Chase Sapphire", "type": "credit_card", "balance": -2340.00, "institution": "Chase Bank", "last_four": "3456"}
```

## Verification

After import, verify the collection:

1. Check the collection appears in the Collections list
2. View records in the admin UI
3. Test API access: `https://pocketbase-production-f733.up.railway.app/api/collections/bank_accounts/records`
4. Refresh the expenses dashboard to see bank account cards

## Related Files

- Component: `src/lib/components/BankAccountCard.svelte`
- Dashboard: `src/routes/(app)/dashboard/expenses/+page.svelte`
- Budgets Import: `docs/BUDGET_IMPORT_GUIDE.md`
