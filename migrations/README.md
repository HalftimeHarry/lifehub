# Data Migrations - Phase 1: Data Model Cleanup

## Overview
These migrations clean up the data model to prepare for Jan 2026 production use.

## Safety
- All migrations are **read-heavy, write-light**
- No data deletion
- All changes are additive
- Can be run multiple times (idempotent)
- Preview mode before applying changes

## Prerequisites
1. PocketBase admin credentials in `.env`
2. Node.js installed
3. Dependencies installed (`npm install`)

## Migration Order

### 1. Add Category Group
**File:** `01-add-category-group.mjs`

**What it does:**
- Adds `categoryGroup` field to expenses
- Backfills based on existing category values
- Enables fixed vs variable, business vs personal filtering

**Steps:**
```bash
# Run migration (will prompt to add field via Admin UI)
node migrations/01-add-category-group.mjs

# After adding field in Admin UI, run again
node migrations/01-add-category-group.mjs

# Review results, then make field required in Admin UI
```

**Mapping:**
- `subscription`, `salary`, `rental_income`, `utilities`, `bank` → `fixed`
- `food`, `entertainment`, `retail`, `other` → `variable`
- `travel`, `lodging` → `travel`
- `ona` → `business`
- `alexis` → `personal`

### 2. Clean Notes Field
**File:** `02-clean-notes.mjs`

**What it does:**
- Removes auto-generated metadata from notes
- Preserves user-entered content
- Reduces UI clutter

**Steps:**
```bash
# Preview changes (shows first 5 records)
node migrations/02-clean-notes.mjs

# Apply changes
AUTO_CONFIRM=true node migrations/02-clean-notes.mjs
```

**What gets removed:**
- `Type: Expense`
- `Amount: $X.XX`
- `Category: ...`
- `Service: ...`
- `Date: ...`
- `For: ...`
- `Email: ...`
- `Phone: ...`

**What gets kept:**
- User-entered notes after "Additional Notes:"
- Any content not matching metadata patterns

### 3. Fix Budget Period
**File:** `03-fix-budget-period.mjs`

**What it does:**
- Adds `period` field to budgets
- Sets all existing budgets to `monthly`
- Fixes undefined period values

**Steps:**
```bash
# Run migration (will prompt to add field via Admin UI)
node migrations/03-fix-budget-period.mjs

# After adding field in Admin UI, run again
node migrations/03-fix-budget-period.mjs

# Review results, then make field required in Admin UI
```

## Running All Migrations

```bash
# Run in order
node migrations/01-add-category-group.mjs
# → Add field in Admin UI, run again
# → Make required in Admin UI

AUTO_CONFIRM=true node migrations/02-clean-notes.mjs

node migrations/03-fix-budget-period.mjs
# → Add field in Admin UI, run again
# → Make required in Admin UI
```

## Verification

After all migrations:

```bash
# Check expenses
node -e "
import PocketBase from 'pocketbase';
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
const expenses = await pb.collection('expenses').getFullList();
console.log('Expenses with categoryGroup:', expenses.filter(e => e.categoryGroup).length);
console.log('Expenses with clean notes:', expenses.filter(e => !e.notes?.includes('Type:')).length);
"

# Check budgets
node -e "
import PocketBase from 'pocketbase';
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
const budgets = await pb.collection('budgets').getFullList();
console.log('Budgets with period:', budgets.filter(b => b.period).length);
"
```

## Rollback

If needed, you can manually revert:

### Rollback categoryGroup
```bash
node -e "
import PocketBase from 'pocketbase';
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
const expenses = await pb.collection('expenses').getFullList();
for (const expense of expenses) {
  await pb.collection('expenses').update(expense.id, { categoryGroup: null });
}
console.log('Rolled back categoryGroup');
"
```

### Rollback notes
**Warning:** Original notes are overwritten. Only rollback if you have a backup.

### Rollback period
```bash
node -e "
import PocketBase from 'pocketbase';
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
const budgets = await pb.collection('budgets').getFullList();
for (const budget of budgets) {
  await pb.collection('budgets').update(budget.id, { period: null });
}
console.log('Rolled back period');
"
```

## Next Steps

After migrations complete:
1. Update UI components to use `categoryGroup`
2. Add filters for fixed/variable/travel/business/personal
3. Remove metadata generation from expense creation
4. Test with production data
5. Create PR for review

## Troubleshooting

### "Cannot find module 'pocketbase'"
```bash
npm install
```

### "Authentication failed"
Check `.env` file has correct credentials:
```
VITE_POCKETBASE_URL=https://pocketbase-production-f733.up.railway.app
POCKETBASE_ADMIN_EMAIL=ddinsmore8@gmail.com
POCKETBASE_ADMIN_PASSWORD=MADcap(123)
```

### "Field does not exist"
Add the field via PocketBase Admin UI first, then run migration again.

### Migration hangs
Check network connection to Railway PocketBase instance.
