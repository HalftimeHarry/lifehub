# Schema Changes - Phase 1: Data Model Cleanup

## Changes to `expenses` Collection

### Add New Fields

#### 1. `categoryGroup` (select, optional → required after backfill)
**Purpose:** Enable fixed vs variable, business vs personal filtering

**Values:**
- `fixed` - Recurring, predictable (subscriptions, rent, salary)
- `variable` - Fluctuating (food, entertainment, retail)
- `travel` - Trip-related (lodging, transportation during trips)
- `business` - Business expenses (separate from personal)
- `personal` - Personal expenses

**Migration mapping:**
```javascript
const categoryGroupMapping = {
  // Fixed
  'subscription': 'fixed',
  'salary': 'fixed',
  'rental_income': 'fixed',
  'utilities': 'fixed',
  'bank': 'fixed',  // Assuming bank fees
  
  // Variable
  'food': 'variable',
  'entertainment': 'variable',
  'retail': 'variable',
  'other': 'variable',
  
  // Travel
  'travel': 'travel',
  'lodging': 'travel',
  
  // Business (will need manual review)
  'ona': 'business',
  'alexis': 'personal'  // Assuming personal
};
```

### Modify Existing Fields

#### 2. `notes` Field Cleanup
**Current:** Contains auto-generated metadata
**Target:** Only user-entered notes

**Cleanup pattern:**
```javascript
// Remove these patterns from notes:
- "Type: Expense\r\n"
- "Amount: $X.XX\r\n"
- "Category: ...\r\n"
- "Service: ...\r\n"
- "Date: ...\r\n"
- "For: ...\r\n"
- "Email: ...\r\n"
- "Phone: ...\r\n"
- "Additional Notes:\r\n"

// Keep only:
- User-entered text after "Additional Notes:"
- Or set to empty string if no user notes
```

#### 3. `category` Field Enhancement
**Current values:** Keep as-is
**Action:** No changes to existing values

**Future consideration:** Normalize to separate `categories` collection
- Not in this phase
- Would require more complex migration
- Current select field works for now

## Changes to `people` Collection

### No Schema Changes
**Reason:** Already properly structured
- `name`, `email`, `phone` are sufficient
- Relations from expenses work correctly

**Future enhancement (not this phase):**
- Add `type` field (personal | business | entity)
- Add `entity` relation (for LLC, etc.)

## Changes to `budgets` Collection

### Fix Existing Field

#### 1. `period` Field
**Current:** All records have `undefined`
**Action:** Set default value

**Options:**
- Add default: `'monthly'`
- Backfill existing records to `'monthly'`
- Make required after backfill

**Values:**
```javascript
period: 'weekly' | 'monthly' | 'quarterly' | 'annual'
```

## Changes to `trips` Collection

### Fix Incomplete Data

#### 1. Make Core Fields Required
**Current:** All optional, all undefined in production
**Action:** 
- Keep optional for now (8 expenses reference trips)
- Add validation in UI
- Clean up or complete existing trip records

**Future (not this phase):**
- Add `status` field (planned | active | completed)
- Add `budget` field
- Add computed `totalSpent` (via API/hooks)

## Migration Order

### Step 1: Add Optional Fields
```javascript
// expenses collection
- Add categoryGroup (select, optional)

// budgets collection  
- Add period (select, optional, default: 'monthly')
```

### Step 2: Backfill Data
```javascript
// For each expense:
1. Set categoryGroup based on category mapping
2. Clean notes field (remove metadata)

// For each budget:
1. Set period to 'monthly'
```

### Step 3: Make Fields Required
```javascript
// expenses collection
- Make categoryGroup required

// budgets collection
- Make period required
```

### Step 4: Verify
```javascript
// Check all records:
1. All expenses have categoryGroup
2. All budgets have period
3. Notes are clean
4. UI renders correctly
```

## PocketBase Migration Files

### File 1: Add Fields
**Filename:** `{timestamp}_add_category_group_and_period.js`

```javascript
migrate((app) => {
  // Add categoryGroup to expenses
  const expenses = app.findCollectionByNameOrId("pbc_1691921218");
  expenses.fields.addAt(X, new Field({
    "hidden": false,
    "id": "select_category_group",
    "maxSelect": 1,
    "name": "categoryGroup",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": ["fixed", "variable", "travel", "business", "personal"]
  }));
  
  // Add period to budgets
  const budgets = app.findCollectionByNameOrId("budgets_collection_id");
  budgets.fields.addAt(Y, new Field({
    "hidden": false,
    "id": "select_period",
    "maxSelect": 1,
    "name": "period",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": ["weekly", "monthly", "quarterly", "annual"]
  }));
  
  return app.save(expenses) && app.save(budgets);
});
```

### File 2: Data Migration Script
**Filename:** `migrate-data-cleanup.mjs`

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(
  process.env.POCKETBASE_ADMIN_EMAIL,
  process.env.POCKETBASE_ADMIN_PASSWORD
);

// Backfill categoryGroup
// Clean notes
// Set budget periods
```

### File 3: Make Required
**Filename:** `{timestamp}_make_fields_required.js`

```javascript
migrate((app) => {
  const expenses = app.findCollectionByNameOrId("pbc_1691921218");
  const categoryGroupField = expenses.fields.getById("select_category_group");
  categoryGroupField.required = true;
  
  const budgets = app.findCollectionByNameOrId("budgets_collection_id");
  const periodField = budgets.fields.getById("select_period");
  periodField.required = true;
  
  return app.save(expenses) && app.save(budgets);
});
```

## Testing Checklist

### Before Migration
- [ ] Export production data
- [ ] Test migration on local PocketBase
- [ ] Verify all 47 expenses process correctly
- [ ] Check UI renders with new fields

### After Migration
- [ ] All expenses have categoryGroup
- [ ] All budgets have period
- [ ] Notes are clean (no metadata)
- [ ] UI displays correctly
- [ ] Filters work with new categoryGroup
- [ ] No console errors

### Rollback Test
- [ ] Run down() migration
- [ ] Verify data restored
- [ ] UI still works

## UI Changes Required

### Expense List View
**Add:**
- Display categoryGroup badge
- Filter by categoryGroup
- Remove redundant info from display

**Remove:**
- Don't show metadata that's in structured fields

### Expense Form
**Add:**
- categoryGroup selector (auto-suggest based on category)
- Clean notes field (no auto-generation)

### Budget List View
**Add:**
- Display period
- Group by period

### Analytics/Dashboard (Future)
**Enable:**
- Fixed vs Variable charts
- Business vs Personal breakdown
- Travel spend tracking
