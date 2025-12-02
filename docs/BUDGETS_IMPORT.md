# Budgets Collection Import Guide

This guide explains how to create and import the `budgets` collection into PocketBase via the production UI.

## Collection Schema

**Collection Name:** `budgets`  
**Collection Type:** Base Collection

### Fields

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | Yes | - |
| category | Select | Yes | Values: `lodging`, `utilities`, `food`, `transportation`, `all`, `income` |
| amount | Number | Yes | Min: 0 |
| spent | Number | Yes | Min: 0 |
| days_left | Number | No | Min: 0, No decimal (integer) |

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
3. Enter collection name: `budgets`

### 3. Add Fields

Click **"+ New field"** for each field:

#### Field 1: name
- Type: **Text**
- Name: `name`
- Required: ✓ **Yes**

#### Field 2: category
- Type: **Select**
- Name: `category`
- Required: ✓ **Yes**
- Max select: `1`
- Values (one per line):
  ```
  lodging
  utilities
  food
  transportation
  all
  income
  ```

#### Field 3: amount
- Type: **Number**
- Name: `amount`
- Required: ✓ **Yes**
- Min: `0`

#### Field 4: spent
- Type: **Number**
- Name: `spent`
- Required: ✓ **Yes**
- Min: `0`

#### Field 5: days_left
- Type: **Number**
- Name: `days_left`
- Required: ☐ No
- Min: `0`
- No decimal: ✓ **Yes** (integer only)

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
    "name": "Monthly Rent",
    "category": "lodging",
    "amount": 1500,
    "spent": 1500,
    "days_left": 15
  },
  {
    "name": "Utilities",
    "category": "utilities",
    "amount": 200,
    "spent": 145,
    "days_left": 15
  },
  {
    "name": "Groceries",
    "category": "food",
    "amount": 600,
    "spent": 425,
    "days_left": 15
  },
  {
    "name": "Gas & Transport",
    "category": "transportation",
    "amount": 300,
    "spent": 280,
    "days_left": 15
  },
  {
    "name": "Entertainment",
    "category": "all",
    "amount": 250,
    "spent": 185,
    "days_left": 15
  }
]
```

### Individual Records with Status

If importing one at a time:

**Record 1: Monthly Rent** - 100% spent (at budget) ✅
```json
{"name": "Monthly Rent", "category": "lodging", "amount": 1500, "spent": 1500, "days_left": 15}
```

**Record 2: Utilities** - 72.5% spent (good) ✅
```json
{"name": "Utilities", "category": "utilities", "amount": 200, "spent": 145, "days_left": 15}
```

**Record 3: Groceries** - 70.8% spent (good) ✅
```json
{"name": "Groceries", "category": "food", "amount": 600, "spent": 425, "days_left": 15}
```

**Record 4: Gas & Transport** - 93.3% spent (warning) ⚠️
```json
{"name": "Gas & Transport", "category": "transportation", "amount": 300, "spent": 280, "days_left": 15}
```

**Record 5: Entertainment** - 74% spent (good) ✅
```json
{"name": "Entertainment", "category": "all", "amount": 250, "spent": 185, "days_left": 15}
```

## Budget Status Indicators

The BudgetCard component shows visual status based on percentage spent:

- **Good** (< 75%): Green progress bar ✅
- **Caution** (75-89%): Yellow progress bar ⚠️
- **Warning** (90-99%): Orange progress bar ⚠️
- **Over** (≥ 100%): Red progress bar ❌

## Verification

After import, verify the collection:

1. Check the collection appears in the Collections list
2. View records in the admin UI
3. Test API access: `https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records`
4. Refresh the expenses dashboard to see budget cards with progress bars

## Related Files

- Component: `src/lib/components/BudgetCard.svelte`
- Dashboard: `src/routes/(app)/dashboard/expenses/+page.svelte`
- Bank Accounts Import: `docs/BANK_ACCOUNTS_IMPORT.md`

## Notes

- The `days_left` field can be manually updated or automated via a cron job
- Budget amounts and spent values should be updated regularly
- Consider creating a monthly reset script to zero out `spent` values at the start of each month
