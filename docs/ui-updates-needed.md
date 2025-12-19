# UI Updates After Migration

## Overview
After Phase 1 migration completes, these UI components need updates to leverage the new schema fields.

## New Fields Available

### expenses collection
- `categoryGroup` (select): `fixed` | `variable` | `travel` | `business` | `personal`

### budgets collection
- `period` (select): `weekly` | `monthly` | `quarterly` | `annual`

## Components to Update

### 1. Expense List View
**File:** `src/routes/expenses/+page.svelte` (or similar)

**Add:**
- Display `categoryGroup` badge next to category
- Filter dropdown for categoryGroup
- Color coding by categoryGroup:
  - `fixed` → blue
  - `variable` → orange
  - `travel` → purple
  - `business` → green
  - `personal` → gray

**Example:**
```svelte
<div class="expense-item">
  <span class="category">{expense.category}</span>
  <span class="badge badge-{expense.categoryGroup}">
    {expense.categoryGroup}
  </span>
</div>
```

### 2. Expense Form (Create/Edit)
**File:** `src/routes/expenses/new/+page.svelte` (or similar)

**Add:**
- `categoryGroup` selector
- Auto-suggest categoryGroup based on selected category
- Remove metadata generation in notes field

**Remove:**
- Auto-generation of person metadata in notes
- Auto-generation of transaction details in notes

**Example:**
```svelte
<select bind:value={expense.categoryGroup} required>
  <option value="">Select group...</option>
  <option value="fixed">Fixed</option>
  <option value="variable">Variable</option>
  <option value="travel">Travel</option>
  <option value="business">Business</option>
  <option value="personal">Personal</option>
</select>
```

### 3. Budget List View
**File:** `src/routes/budgets/+page.svelte` (or similar)

**Add:**
- Display period next to budget name
- Group budgets by period
- Period filter

**Example:**
```svelte
<div class="budget-item">
  <h3>{budget.name}</h3>
  <span class="period">{budget.period}</span>
  <span class="amount">${budget.amount}</span>
</div>
```

### 4. Budget Form (Create/Edit)
**File:** `src/routes/budgets/new/+page.svelte` (or similar)

**Add:**
- `period` selector (required)
- Default to `monthly`

**Example:**
```svelte
<select bind:value={budget.period} required>
  <option value="weekly">Weekly</option>
  <option value="monthly">Monthly</option>
  <option value="quarterly">Quarterly</option>
  <option value="annual">Annual</option>
</select>
```

### 5. Dashboard/Analytics (New)
**File:** `src/routes/dashboard/+page.svelte` (create if doesn't exist)

**Add:**
- Fixed vs Variable expense chart
- Business vs Personal breakdown
- Travel expense summary
- Budget period grouping

**Example queries:**
```javascript
// Fixed expenses this month
const fixedExpenses = expenses.filter(e => 
  e.categoryGroup === 'fixed' && 
  e.status === 'approved' &&
  isThisMonth(e.date)
);

// Business expenses YTD
const businessExpenses = expenses.filter(e =>
  e.categoryGroup === 'business' &&
  e.status === 'approved' &&
  isThisYear(e.date)
);
```

### 6. Filters Component (New/Update)
**File:** `src/lib/components/ExpenseFilters.svelte`

**Add:**
- categoryGroup multi-select filter
- Quick filters:
  - "Fixed only"
  - "Variable only"
  - "Business only"
  - "Travel only"

**Example:**
```svelte
<div class="filters">
  <label>
    <input type="checkbox" bind:checked={filters.fixed} />
    Fixed
  </label>
  <label>
    <input type="checkbox" bind:checked={filters.variable} />
    Variable
  </label>
  <label>
    <input type="checkbox" bind:checked={filters.travel} />
    Travel
  </label>
  <label>
    <input type="checkbox" bind:checked={filters.business} />
    Business
  </label>
  <label>
    <input type="checkbox" bind:checked={filters.personal} />
    Personal
  </label>
</div>
```

## Styling Updates

### Add to Tailwind/CSS
```css
/* Category group badges */
.badge-fixed { @apply bg-blue-100 text-blue-800; }
.badge-variable { @apply bg-orange-100 text-orange-800; }
.badge-travel { @apply bg-purple-100 text-purple-800; }
.badge-business { @apply bg-green-100 text-green-800; }
.badge-personal { @apply bg-gray-100 text-gray-800; }

/* Period indicators */
.period-weekly { @apply text-sm text-gray-600; }
.period-monthly { @apply text-sm text-blue-600; }
.period-quarterly { @apply text-sm text-purple-600; }
.period-annual { @apply text-sm text-green-600; }
```

## API/Data Fetching Updates

### Update PocketBase queries
```javascript
// Fetch with categoryGroup
const expenses = await pb.collection('expenses').getList(1, 50, {
  sort: '-date',
  filter: 'categoryGroup = "fixed"'
});

// Fetch budgets with period
const budgets = await pb.collection('budgets').getList(1, 50, {
  sort: 'period,name'
});
```

## Validation Updates

### Form validation
```javascript
// Expense form
const expenseSchema = z.object({
  // ... existing fields
  categoryGroup: z.enum(['fixed', 'variable', 'travel', 'business', 'personal']),
  notes: z.string().optional() // No longer auto-generated
});

// Budget form
const budgetSchema = z.object({
  // ... existing fields
  period: z.enum(['weekly', 'monthly', 'quarterly', 'annual'])
});
```

## Testing Checklist

After UI updates:
- [ ] Expense list displays categoryGroup badges
- [ ] Expense form has categoryGroup selector
- [ ] Expense form no longer auto-generates metadata in notes
- [ ] Budget list displays period
- [ ] Budget form has period selector
- [ ] Filters work with categoryGroup
- [ ] Dashboard shows fixed vs variable breakdown
- [ ] All existing records render correctly
- [ ] No console errors
- [ ] Mobile responsive

## Priority Order

1. **High Priority** (Required for migration)
   - Remove metadata generation from expense form
   - Add categoryGroup selector to expense form
   - Add period selector to budget form

2. **Medium Priority** (Improves UX)
   - Display categoryGroup in expense list
   - Display period in budget list
   - Add categoryGroup filters

3. **Low Priority** (Nice to have)
   - Dashboard analytics
   - Color coding
   - Advanced filters

## Implementation Notes

- Keep backward compatibility (old records without categoryGroup should still render)
- Use optional chaining: `expense.categoryGroup?.toLowerCase()`
- Provide defaults: `categoryGroup ?? 'variable'`
- Test with production data before deploying

## Next Steps

1. Complete Phase 1 migration
2. Verify all 47 expenses have categoryGroup
3. Implement High Priority UI updates
4. Test with production data
5. Deploy UI updates
6. Implement Medium/Low Priority updates
