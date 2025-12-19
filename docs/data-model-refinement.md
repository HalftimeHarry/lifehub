# Data Model Refinement Plan
**Branch:** `33-data-model-cleanup`  
**Goal:** Transform from personal ledger to portfolio-grade financial tracker

## Current State Analysis

### Production Data (as of Dec 19, 2025)
- **47 expenses** ($12,756 total)
- **6 people** (Dustin, Alexis, Charlie, Carol, Josh, JJ)
- **7 budgets** ($6,600 total monthly)
- **5 trips** (incomplete data)
- **Status:** 40 approved, 7 upcoming

### Existing Collections

#### expenses
**Current fields:**
- `title` (text, required) - e.g., "Dustin - Ona - Expense - Nov 29, 2025"
- `amount` (number, required)
- `type` (select) - expense | income
- `category` (select) - subscription, bank, entertainment, food, lodging, etc.
- `subcategory` (select) - dining_out, groceries, software, etc.
- `status` (select) - approved | upcoming
- `date` (datetime)
- `notes` (text) - **Contains repeated metadata** ⚠️
- `for` (relation → people)
- `budget` (relation → budgets)
- `trip` (relation → trips)
- `appointment` (relation → appointments)
- `shift`, `service_detail` (relations)
- `vendor` (text)
- `receipt` (file)
- `recurring` (boolean)
- `active` (boolean, required)

#### people
**Current fields:**
- `name` (text)
- `email` (text)
- `phone` (text)

#### budgets
**Current fields:**
- `name` (text)
- `amount` (number)
- `period` (text) - currently undefined for all

#### trips
**Current fields:**
- `name`, `from`, `to`, `transport`
- `startDate`, `endDate`
- Currently all undefined in production

## Problems Identified

### 1. Repetition & Noise
**Issue:** Every expense note contains:
```
Type: Expense
Amount: $25.00
Category: Subscription
Service: Ona
Date: Nov 29, 2025

For: Dustin
Email: dustin@fligolf.com
Phone: +16262223107
```

**Impact:**
- 47/47 records have metadata in notes
- Clutters UI
- Makes search/filtering harder
- Duplicates data already in structured fields

### 2. Mixed Concepts
**Issue:** Single `expenses` record combines:
- Transaction data (amount, date, type)
- Person reference (but metadata repeated in notes)
- Context (trip, appointment, shift)
- Receipt/documentation
- Status/workflow

**Impact:**
- Hard to aggregate (e.g., "all trip expenses")
- Can't easily query "all subscriptions"
- Analytics require parsing notes

### 3. Underused Status Field
**Current:** `approved` | `upcoming`

**Missing opportunities:**
- Cash flow forecasting (upcoming bills)
- Reconciliation tracking
- Reminder triggers
- Monthly projections

### 4. Category Limitations
**Current:** Flat list (subscription, bank, entertainment, etc.)

**Missing:**
- Type dimension (income vs expense)
- Group dimension (fixed vs variable, business vs personal)
- Tax categorization
- Budget alignment

### 5. Incomplete Trip Data
**Issue:** 5 trips exist but all have undefined fields

**Impact:**
- 8 expenses reference trips
- Can't generate trip summaries
- No budget tracking per trip

## Proposed Refinements

### Phase 1: Normalize Person & Category (This Branch)

#### 1.1 Clean Up Person Reference
**Current:** `for` relation exists, but metadata repeated in notes

**Action:**
- ✅ Keep `for` relation (already correct)
- ❌ Remove person metadata from notes
- Add migration to clean existing notes

#### 1.2 Enhance Categories
**Add fields to existing category values:**

```javascript
// New category structure (keep as select for now, normalize later)
category: {
  // Existing values preserved
  values: [
    'subscription', 'bank', 'entertainment', 'food', 
    'lodging', 'travel', 'utilities', 'rental_income', 
    'salary', 'retail', 'other'
  ]
}

// Add new fields to expenses
categoryType: 'income' | 'expense'  // derived from type field
categoryGroup: 'fixed' | 'variable' | 'travel' | 'business' | 'personal'
```

**Migration strategy:**
1. Add `categoryGroup` as optional field
2. Backfill based on category:
   - subscription → fixed
   - salary, rental_income → fixed
   - travel, lodging → travel
   - food, entertainment, retail → variable
3. Make required after backfill

#### 1.3 Clean Notes Field
**Action:**
- Remove all auto-generated metadata
- Keep only user-entered notes
- Preserve receipt references if needed

### Phase 2: Separate Transaction Context (Future)

#### 2.1 Create TransactionContext (Optional)
```javascript
// Future: Only if needed for complex queries
transactionContext {
  transactionId (relation → expenses)
  tripId (relation → trips)
  subscriptionId (relation → subscriptions)
  appointmentId (relation → appointments)
}
```

**Decision:** Skip for now - existing relations work fine

#### 2.2 Enhance Trips
**Add required fields:**
- `name` (required)
- `startDate`, `endDate` (required)
- `budget` (optional)
- `status` (planned | active | completed)

**Add computed:**
- `totalSpent` (sum of related expenses)
- `overBudget` (boolean)

### Phase 3: Subscription Engine (Future Branch)

#### 3.1 Create Subscriptions Collection
```javascript
subscriptions {
  service (text, required)
  category (relation → categories)
  cadence ('monthly' | 'annual' | 'quarterly')
  expectedAmount (number)
  active (boolean)
  nextBillingDate (date)
  lastExpenseId (relation → expenses)
}
```

#### 3.2 Auto-Generate Upcoming
- Cron job creates `upcoming` expenses
- Links to subscription record
- Flags anomalies (amount mismatch)

### Phase 4: Enhanced Status Workflow (Future Branch)

#### 4.1 Expand Status Values
```javascript
status: 'upcoming' | 'approved' | 'reconciled' | 'disputed'
```

#### 4.2 Add Workflow Fields
```javascript
expenses {
  // ... existing fields
  reconciledDate (date)
  reconciledBy (relation → users)
  bankTransactionId (text)
}
```

## Migration Strategy

### Safety Rules
1. ✅ All new fields are optional initially
2. ✅ Backfill before making required
3. ✅ Never rename fields (add new → migrate → remove old)
4. ✅ Test with production data in dev
5. ✅ Verify UI renders old records

### Rollback Plan
- All migrations have down() functions
- Schema changes are additive
- Can revert to previous main

## Success Metrics

### Phase 1 (This Branch)
- [ ] Notes field cleaned (no metadata)
- [ ] categoryGroup added and backfilled
- [ ] UI shows cleaner expense list
- [ ] All 47 existing records still render
- [ ] No data loss

### Future Phases
- [ ] Trip summaries auto-calculate
- [ ] Subscription auto-generation working
- [ ] Cash flow forecast dashboard
- [ ] Fixed vs variable spend charts

## Next Steps

1. Create schema migration for `categoryGroup`
2. Write data migration script to clean notes
3. Update UI components to use new fields
4. Test with production data
5. Create PR for review
