# ✅ Ready to Start: Data Model Cleanup

## Current Status

**Branch:** `33-data-model-cleanup`  
**Production Access:** ✅ Verified  
**Migration Scripts:** ✅ Created  
**Documentation:** ✅ Complete  
**Safety Guardrails:** ✅ In place  

## What's Been Prepared

### 1. Analysis Complete
- ✅ 47 expenses analyzed
- ✅ 6 people verified
- ✅ 7 budgets checked
- ✅ 5 trips reviewed
- ✅ All 47 expenses have metadata pollution in notes
- ✅ All 7 budgets have undefined periods

### 2. Migration Scripts Ready
```
migrations/
├── 00-add-fields-via-api.mjs      # Attempted programmatic field addition
├── 01-add-category-group.mjs      # Backfill categoryGroup
├── 02-clean-notes.mjs             # Remove metadata from notes
├── 03-fix-budget-period.mjs       # Set budget periods
├── test-readiness.mjs             # Verify before running
└── README.md                      # Detailed instructions
```

### 3. Documentation Created
```
docs/
├── data-model-refinement.md       # Full refinement plan
├── schema-changes.md              # Detailed schema changes
└── ui-updates-needed.md           # UI component updates

MIGRATION-PLAN.md                  # Step-by-step execution guide
READY-TO-START.md                  # This file
```

## The Plan

### Phase 1: Data Model Cleanup (This Branch)

**Problems we're fixing:**
1. **Metadata pollution** - All 47 expenses have auto-generated metadata in notes
2. **Missing category dimensions** - Can't filter fixed vs variable, business vs personal
3. **Undefined budget periods** - All 7 budgets have `period: undefined`

**Solutions:**
1. Add `categoryGroup` field to expenses (fixed, variable, travel, business, personal)
2. Clean notes field (remove metadata, keep user content)
3. Add `period` field to budgets (weekly, monthly, quarterly, annual)

### What This Enables

**Immediate:**
- Fixed vs Variable expense filtering
- Business vs Personal separation
- Travel expense tracking
- Clean, readable notes
- Budget period clarity

**Future:**
- Cash flow forecasting (fixed expenses)
- Tax export (business vs personal)
- Trip budget tracking
- Subscription management
- Analytics dashboards

## How to Execute

### Step 1: Test Readiness (2 min)
```bash
node migrations/test-readiness.mjs
```

**Expected output:**
```
⚠️  ALMOST READY

Next steps:
  1. Add missing schema fields via PocketBase Admin UI
  2. Run this test again to verify
  3. Then run migrations
```

### Step 2: Add Schema Fields (5 min)

**Access PocketBase Admin UI:**
```
URL: https://pocketbase-production-f733.up.railway.app/_/
Email: ddinsmore8@gmail.com
Password: MADcap(123)
```

**Add to `expenses` collection:**
1. Collections → expenses → Edit
2. Add field:
   - Name: `categoryGroup`
   - Type: Select (single)
   - Values: `fixed`, `variable`, `travel`, `business`, `personal`
   - Required: No
3. Save

**Add to `budgets` collection:**
1. Collections → budgets → Edit
2. Add field:
   - Name: `period`
   - Type: Select (single)
   - Values: `weekly`, `monthly`, `quarterly`, `annual`
   - Required: No
3. Save

### Step 3: Verify Fields Added (1 min)
```bash
node migrations/test-readiness.mjs
```

**Expected output:**
```
🎉 READY TO MIGRATE!

Next steps:
  1. node migrations/01-add-category-group.mjs
  2. AUTO_CONFIRM=true node migrations/02-clean-notes.mjs
  3. node migrations/03-fix-budget-period.mjs
```

### Step 4: Run Migrations (10 min)
```bash
# Backfill categoryGroup (maps category → categoryGroup)
node migrations/01-add-category-group.mjs

# Clean notes (removes metadata, keeps user content)
AUTO_CONFIRM=true node migrations/02-clean-notes.mjs

# Set budget periods (all → monthly)
node migrations/03-fix-budget-period.mjs
```

### Step 5: Make Fields Required (2 min)

**In PocketBase Admin UI:**
1. Collections → expenses → Edit field `categoryGroup`
2. Check "Required"
3. Save

4. Collections → budgets → Edit field `period`
5. Check "Required"
6. Save

### Step 6: Verify Results (5 min)
```bash
node migrations/test-readiness.mjs
```

**Check:**
- All 47 expenses have categoryGroup
- All 47 expenses have clean notes
- All 7 budgets have period
- No errors in console

## Safety Features

### Idempotent
- All scripts can run multiple times safely
- Skip records already processed
- No duplicate updates

### Preview Mode
- Migration 02 shows preview before applying
- Set `AUTO_CONFIRM=true` to skip

### Error Handling
- Detailed error messages
- Progress logging every 10 records
- Continues on individual failures

### Rollback
- Can clear fields if needed
- Notes cleaning is NOT reversible (backup first if concerned)

## What Happens to Data

### categoryGroup Mapping
```
subscription → fixed
salary → fixed
rental_income → fixed
utilities → fixed
bank → fixed

food → variable
entertainment → variable
retail → variable
other → variable

travel → travel
lodging → travel

ona → business
alexis → personal
```

### Notes Cleaning
**Before:**
```
Type: Expense
Amount: $25.00
Category: Subscription
Service: Ona
Date: Nov 29, 2025

For: Dustin
Email: dustin@fligolf.com
Phone: +16262223107

Additional Notes:
This is my actual note
```

**After:**
```
This is my actual note
```

### Budget Period
**Before:** `period: undefined`  
**After:** `period: 'monthly'`

## After Migration

### Immediate Next Steps
1. Update UI components (see `docs/ui-updates-needed.md`)
2. Remove metadata generation from expense form
3. Add categoryGroup selector to forms
4. Test with production data

### Future Phases
- **Phase 2:** Trips first-class (issue #35)
- **Phase 3:** Subscriptions engine (issue #36)
- **Phase 4:** UI density cleanup (issue #37)
- **Phase 5:** Forecast dashboard (issue #38)

## Questions?

**Detailed docs:**
- `MIGRATION-PLAN.md` - Full execution plan
- `docs/data-model-refinement.md` - Complete refinement strategy
- `docs/schema-changes.md` - Schema change details
- `migrations/README.md` - Migration instructions

**Need help?**
- Run `node migrations/test-readiness.mjs` to check status
- All migrations have detailed logging
- Rollback procedures documented in `MIGRATION-PLAN.md`

## Ready?

You have everything you need to:
1. ✅ Understand the problem
2. ✅ Execute the solution
3. ✅ Verify the results
4. ✅ Rollback if needed

**Estimated time:** 30 minutes total

**Next command:**
```bash
node migrations/test-readiness.mjs
```

Let's make this app production-ready for Jan 2026! 🚀
