# Trips First-Class Refinement
**Branch:** `35-trips-first-class`  
**Goal:** Make trips a first-class feature with proper aggregation and budget tracking

## Current State Analysis

### Trips Collection Schema
**Current fields:**
- `title` (text) - e.g., "Las Vegas on 12/22"
- `origin` (text) - e.g., "San Diego"
- `destination` (text) - e.g., "Las Vegas"
- `transport_type` (select) - plane, car
- `depart_at` (datetime)
- `arrive_at` (datetime)
- `status` (select) - pending, completed
- `color` (text) - UI color code
- `people` (relation → people, multi-select)
- `assigned_to` (relation → users, multi-select)
- `notes` (text)
- `notify_offset_minutes` (number)
- `notified_at` (datetime)
- `phone` (text)
- `ticket_image` (file, multi)

### Production Data
**5 trips:**
1. **AZ to SD** (completed)
   - Nov 10, 2025
   - Arizona → San Diego
   - Plane
   - 0 expenses

2. **Meet up in Palm Desert** (completed)
   - Nov 5, 2025
   - San Diego → Palm Desert
   - Car
   - 0 expenses

3. **Las Vegas on 12/22** (pending)
   - Dec 22, 2025
   - San Diego → Las Vegas
   - Plane
   - **4 expenses: $1,168** (lodging, travel, retail, entertainment)

4. **Arcadia** (completed)
   - Dec 8, 2025
   - San Diego → Arcadia, CA
   - Car
   - **2 expenses: $107** (lodging, retail)

5. **SD to Arcadia** (pending)
   - Dec 25-26, 2025
   - San Diego → Arcadia, CA
   - Car
   - **2 expenses: $600** (lodging, entertainment)

**Total: 8 expenses across 3 trips = $1,875**

### Expense Distribution by Trip
```
Las Vegas on 12/22: $1,168
  - Entertainment: $700
  - Lodging: $170
  - Travel: $212
  - Retail: $86

Arcadia: $107
  - Lodging: $100
  - Retail: $7

SD to Arcadia: $600
  - Lodging: $300
  - Entertainment: $300
```

## Problems Identified

### 1. No Budget Tracking
**Issue:** Trips have no budget field
- Can't set expected spend
- Can't track over/under budget
- No alerts for budget overruns

### 2. No Expense Aggregation
**Issue:** Trip totals not calculated
- Must manually sum expenses
- No category breakdown per trip
- No real-time spend tracking

### 3. Inconsistent Status Usage
**Current:** `pending` | `completed`

**Missing:**
- `planned` - Trip is scheduled but not started
- `active` - Trip is in progress
- `cancelled` - Trip was cancelled

### 4. Missing Financial Fields
**No tracking for:**
- Estimated cost
- Actual cost (computed from expenses)
- Budget variance
- Cost per person

### 5. No Trip Summary View
**Missing:**
- Total spent
- Expenses by category
- Budget status
- Cost breakdown

## Proposed Enhancements

### Phase 1: Add Financial Fields (This Branch)

#### 1.1 Add Budget Field
```javascript
trips {
  // ... existing fields
  budget: number (optional) // Expected total cost
}
```

#### 1.2 Add Computed Fields (API/Hooks)
```javascript
// Computed on read
tripSummary {
  totalExpenses: number      // Sum of all linked expenses
  expenseCount: number       // Count of linked expenses
  budgetRemaining: number    // budget - totalExpenses
  overBudget: boolean        // totalExpenses > budget
  categoryBreakdown: {       // Expenses grouped by category
    lodging: number,
    travel: number,
    food: number,
    entertainment: number,
    retail: number,
    other: number
  }
}
```

#### 1.3 Enhance Status Field
**Update values:**
- `planned` - Trip scheduled, no expenses yet
- `active` - Trip in progress, has expenses
- `completed` - Trip finished
- `cancelled` - Trip cancelled

**Auto-update logic:**
- If trip has expenses → `active`
- If trip end date passed → `completed`

### Phase 2: Trip Summary API (This Branch)

#### 2.1 Create Trip Summary Endpoint
```javascript
// GET /api/trips/{id}/summary
{
  trip: {
    id: "gtvgyinoknt1fo0",
    title: "Las Vegas on 12/22",
    origin: "San Diego",
    destination: "Las Vegas",
    depart_at: "2025-12-22T14:00:00Z",
    arrive_at: "2025-12-22T17:15:00Z",
    status: "active",
    budget: 1500
  },
  summary: {
    totalExpenses: 1168,
    expenseCount: 4,
    budgetRemaining: 332,
    overBudget: false,
    percentUsed: 77.87,
    categoryBreakdown: {
      entertainment: 700,
      lodging: 170,
      travel: 212,
      retail: 86
    }
  },
  expenses: [
    // List of expenses for this trip
  ]
}
```

#### 2.2 Create Trip List with Summaries
```javascript
// GET /api/trips?include=summary
[
  {
    trip: { ... },
    summary: { totalExpenses, expenseCount, ... }
  }
]
```

### Phase 3: UI Enhancements (Separate PR)

#### 3.1 Trip Detail View
**Add:**
- Budget input field
- Total spent display
- Budget remaining/overage indicator
- Category breakdown chart
- Expense list filtered to trip

#### 3.2 Trip List View
**Add:**
- Total spent column
- Budget status indicator
- Quick stats (expenses count, days until trip)

#### 3.3 Trip Summary Card
**New component:**
```svelte
<TripSummaryCard trip={trip}>
  <h3>{trip.title}</h3>
  <div class="dates">{formatDateRange(trip.depart_at, trip.arrive_at)}</div>
  <div class="budget">
    <span>Budget: ${trip.budget}</span>
    <span>Spent: ${summary.totalExpenses}</span>
    <span class={summary.overBudget ? 'over' : 'under'}>
      {summary.overBudget ? 'Over' : 'Remaining'}: ${Math.abs(summary.budgetRemaining)}
    </span>
  </div>
  <div class="breakdown">
    {#each Object.entries(summary.categoryBreakdown) as [category, amount]}
      <div>{category}: ${amount}</div>
    {/each}
  </div>
</TripSummaryCard>
```

## Implementation Plan

### Step 1: Add Budget Field (Manual - PocketBase Admin UI)
1. Collections → trips → Edit
2. Add field:
   - Name: `budget`
   - Type: Number
   - Min: 0
   - Required: No
3. Save

### Step 2: Backfill Trip Budgets (Optional)
```javascript
// Set budgets based on current spending + buffer
Las Vegas: $1,168 spent → set budget to $1,500
Arcadia: $107 spent → set budget to $200
SD to Arcadia: $600 spent → set budget to $800
```

### Step 3: Create Trip Summary API
**File:** `src/routes/api/trips/[id]/summary/+server.ts`

```typescript
import { pb } from '$lib/pocketbase';

export async function GET({ params }) {
  const tripId = params.id;
  
  // Get trip
  const trip = await pb.collection('trips').getOne(tripId);
  
  // Get expenses for trip
  const expenses = await pb.collection('expenses').getFullList({
    filter: `trip = "${tripId}"`
  });
  
  // Calculate summary
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = expenses.length;
  const budgetRemaining = (trip.budget || 0) - totalExpenses;
  const overBudget = budgetRemaining < 0;
  const percentUsed = trip.budget ? (totalExpenses / trip.budget) * 100 : 0;
  
  // Category breakdown
  const categoryBreakdown = {};
  expenses.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
  });
  
  return {
    trip,
    summary: {
      totalExpenses,
      expenseCount,
      budgetRemaining,
      overBudget,
      percentUsed,
      categoryBreakdown
    },
    expenses
  };
}
```

### Step 4: Update Trip List to Show Summaries
**File:** `src/routes/trips/+page.svelte`

```svelte
<script>
  import { onMount } from 'svelte';
  import { pb } from '$lib/pocketbase';
  
  let trips = [];
  let tripSummaries = {};
  
  onMount(async () => {
    trips = await pb.collection('trips').getFullList();
    
    // Fetch summaries for each trip
    for (const trip of trips) {
      const response = await fetch(`/api/trips/${trip.id}/summary`);
      const data = await response.json();
      tripSummaries[trip.id] = data.summary;
    }
  });
</script>

{#each trips as trip}
  <div class="trip-card">
    <h3>{trip.title}</h3>
    <p>{trip.origin} → {trip.destination}</p>
    
    {#if tripSummaries[trip.id]}
      <div class="summary">
        <span>Spent: ${tripSummaries[trip.id].totalExpenses}</span>
        {#if trip.budget}
          <span>Budget: ${trip.budget}</span>
          <span class:over={tripSummaries[trip.id].overBudget}>
            {tripSummaries[trip.id].overBudget ? 'Over' : 'Remaining'}: 
            ${Math.abs(tripSummaries[trip.id].budgetRemaining)}
          </span>
        {/if}
      </div>
    {/if}
  </div>
{/each}
```

## Migration Strategy

### Safety Rules
1. ✅ Budget field is optional (no required data)
2. ✅ Existing trips continue to work without budget
3. ✅ Summary API is read-only (no data changes)
4. ✅ UI gracefully handles missing budget

### Testing Checklist
- [ ] Budget field added to trips collection
- [ ] Trip summary API returns correct totals
- [ ] Category breakdown matches expense data
- [ ] Budget remaining calculated correctly
- [ ] Over budget flag works
- [ ] UI displays trip summaries
- [ ] Trips without budget still render
- [ ] Trips without expenses show $0

## Success Metrics

### Immediate Benefits
- ✅ Trip budget tracking
- ✅ Real-time expense totals
- ✅ Category breakdown per trip
- ✅ Budget variance visibility
- ✅ Over budget alerts

### Enables Future Features
- Trip cost forecasting
- Multi-person cost splitting
- Trip comparison (which trips cost most)
- Budget recommendations based on history
- Travel expense reports

## Next Steps After This Branch

1. **Phase 2:** Subscription engine (issue #36)
   - Auto-generate recurring expenses
   - Link subscriptions to trips if applicable

2. **Phase 3:** UI density cleanup (issue #37)
   - Improve trip card design
   - Add trip filters
   - Enhance mobile view

3. **Phase 4:** Forecast dashboard (issue #38)
   - Include upcoming trip budgets
   - Show trip spending trends
   - Alert on budget overruns
