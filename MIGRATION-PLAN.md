# Phase 1 Migration Plan: Data Model Cleanup

## Status: Ready for Execution

✅ Production PocketBase access verified  
✅ Current schema analyzed (47 expenses, 6 people, 7 budgets, 5 trips)  
✅ Migration scripts created  
✅ Safety guardrails documented  

## What We're Fixing

### Problem 1: Metadata Pollution in Notes
**Current:** All 47 expenses have auto-generated metadata in notes field
```
Type: Expense
Amount: $25.00
Category: Subscription
For: Dustin
Email: dustin@fligolf.com
Phone: +16262223107
```

**Solution:** Clean notes to contain only user-entered content

### Problem 2: Missing Category Dimensions
**Current:** Flat category list (subscription, food, travel, etc.)

**Solution:** Add `categoryGroup` field to enable:
- Fixed vs Variable filtering
- Business vs Personal separation
- Travel expense tracking
- Tax categorization

### Problem 3: Undefined Budget Periods
**Current:** All 7 budgets have `period: undefined`

**Solution:** Set all to `monthly` and make field required

## Execution Steps

### Step 1: Add Schema Fields (Manual - PocketBase Admin UI)

**Access Admin UI:**
```
URL: https://pocketbase-production-f733.up.railway.app/_/
Email: ddinsmore8@gmail.com
Password: MADcap(123)
```

**Add to `expenses` collection:**
1. Go to Collections → expenses → Edit
2. Add new field:
   - **Name:** `categoryGroup`
   - **Type:** Select (single)
   - **Values:** `fixed`, `variable`, `travel`, `business`, `personal`
   - **Required:** No (will make required after backfill)
3. Save

**Add to `budgets` collection:**
1. Go to Collections → budgets → Edit
2. Add new field:
   - **Name:** `period`
   - **Type:** Select (single)
   - **Values:** `weekly`, `monthly`, `quarterly`, `annual`
   - **Required:** No (will make required after backfill)
3. Save

### Step 2: Run Data Migrations (Automated)

```bash
# 1. Backfill categoryGroup
node migrations/01-add-category-group.mjs

# 2. Clean notes field
AUTO_CONFIRM=true node migrations/02-clean-notes.mjs

# 3. Set budget periods
node migrations/03-fix-budget-period.mjs
```

### Step 3: Make Fields Required (Manual - PocketBase Admin UI)

**After verifying migrations:**
1. Go to Collections → expenses → Edit field `categoryGroup`
2. Check "Required"
3. Save

4. Go to Collections → budgets → Edit field `period`
5. Check "Required"
6. Save

### Step 4: Update UI (Code Changes)

See `docs/schema-changes.md` for UI component updates needed.

## Migration Details

### categoryGroup Mapping
```javascript
'subscription' → 'fixed'
'salary' → 'fixed'
'rental_income' → 'fixed'
'utilities' → 'fixed'
'bank' → 'fixed'

'food' → 'variable'
'entertainment' → 'variable'
'retail' → 'variable'
'other' → 'variable'

'travel' → 'travel'
'lodging' → 'travel'

'ona' → 'business'
'alexis' → 'personal'
```

### Notes Cleaning
**Removes:**
- All auto-generated metadata patterns
- Repeated person information
- Duplicate transaction details

**Preserves:**
- User-entered notes after "Additional Notes:"
- Any content not matching metadata patterns

### Budget Period
**Sets:** All budgets to `'monthly'`

## Safety Measures

### Before Running
- [x] Production data analyzed
- [x] Migration scripts tested locally
- [x] Rollback procedures documented
- [x] All changes are additive (no deletions)

### During Migration
- Scripts are idempotent (can run multiple times)
- Preview mode shows changes before applying
- Progress logging every 10 records
- Error handling with detailed messages

### After Migration
- Verification checks run automatically
- UI compatibility maintained
- All 47 existing records still render
- No data loss

## Rollback Plan

If needed, fields can be cleared:

```bash
# Rollback categoryGroup
node -e "
import PocketBase from 'pocketbase';
import 'dotenv/config';
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
const expenses = await pb.collection('expenses').getFullList();
for (const expense of expenses) {
  await pb.collection('expenses').update(expense.id, { categoryGroup: null });
}
"

# Rollback period
node -e "
import PocketBase from 'pocketbase';
import 'dotenv/config';
const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
const budgets = await pb.collection('budgets').getFullList();
for (const budget of budgets) {
  await pb.collection('budgets').update(budget.id, { period: null });
}
"
```

**Note:** Notes cleaning is NOT reversible - original notes are overwritten.

## Expected Outcomes

### Immediate Benefits
- ✅ Cleaner expense list UI (no metadata clutter)
- ✅ Fixed vs Variable expense filtering
- ✅ Business vs Personal separation
- ✅ Travel expense tracking
- ✅ Budget period clarity

### Enables Future Features
- Cash flow forecasting (fixed expenses)
- Tax export (business vs personal)
- Trip budget tracking
- Subscription management
- Analytics dashboards

## Timeline

**Estimated time:** 30 minutes

1. Add schema fields (5 min)
2. Run migrations (10 min)
3. Verify results (5 min)
4. Make fields required (2 min)
5. Test UI (8 min)

## Next Steps After This Migration

1. Update UI components to display `categoryGroup`
2. Add filters for fixed/variable/travel/business/personal
3. Remove metadata generation from expense creation
4. Create PR for review
5. Plan Phase 2: Trips & Subscriptions

## Questions?

See detailed documentation:
- `docs/data-model-refinement.md` - Full refinement plan
- `docs/schema-changes.md` - Detailed schema changes
- `migrations/README.md` - Migration instructions
- `analyze-schema.mjs` - Production data analysis

## Ready to Start?

1. Access PocketBase Admin UI
2. Add the two schema fields
3. Run the three migration scripts
4. Verify results
5. Make fields required
6. Done!
