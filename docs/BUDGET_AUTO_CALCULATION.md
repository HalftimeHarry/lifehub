# Budget Auto-Calculation System

How budgets automatically track spending and time remaining.

## Overview

Budgets now auto-calculate two key metrics:
1. **Spent** - Total from linked expenses
2. **Days Left** - Days remaining in current month

## How It Works

### Creating a Budget

**You only set:**
- Name (e.g., "Groceries")
- Category (e.g., "food")
- Amount (e.g., $600)

**System auto-calculates:**
- Spent: $0 (initially)
- Days Left: Days until end of month

### Linking Expenses

When you add an expense and link it to a budget:

```
Add Expense:
  Amount: $85.50
  Category: Food
  Budget: Groceries ← Link here
  Status: Paid
  
System automatically:
  1. Finds all expenses linked to "Groceries"
  2. Sums amounts (only paid/upcoming/approved)
  3. Updates budget.spent
  4. Calculates days_left
```

### What Gets Counted

**Included in spent total:**
- Status: `paid`
- Status: `upcoming`
- Status: `approved`
- Type: `expense`

**Excluded from spent total:**
- Status: `canceled`
- Status: `rejected`
- Type: `income`

## Auto-Calculation Logic

### Spent Amount

```javascript
// For each budget
const budgetExpenses = expenses.filter(e => 
  e.budget === budget.id &&           // Linked to this budget
  e.type === 'expense' &&             // Is an expense
  e.status !== 'canceled' &&          // Not canceled
  e.status !== 'rejected'             // Not rejected
);

const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);

// Update budget
budget.spent = totalSpent;
```

### Days Left

```javascript
// Calculate days until end of current month
const now = new Date();
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
const daysLeft = Math.ceil((lastDayOfMonth - now) / (1000 * 60 * 60 * 24));

// Update budget
budget.days_left = daysLeft;
```

## When Updates Happen

Budgets recalculate automatically:

1. **After adding expense** - New expense linked to budget
2. **After editing expense** - Amount or budget link changed
3. **After deleting expense** - Expense removed from budget
4. **On page load** - Ensures accuracy on refresh

## Example Flow

### Day 1: Create Budget
```
Create Budget:
  Name: Groceries
  Category: food
  Amount: $600
  
Result:
  spent: $0 (auto)
  days_left: 30 (auto)
  Status: 0% used ✅
```

### Day 5: Add First Expense
```
Add Expense:
  Amount: $85.50
  Budget: Groceries
  Status: Paid
  
Budget Updates:
  spent: $0 → $85.50 (auto)
  days_left: 30 → 25 (auto)
  Status: 14.3% used ✅
```

### Day 12: Add More Expenses
```
Add Expense #2: $120.00
Add Expense #3: $45.75
  
Budget Updates:
  spent: $85.50 → $251.25 (auto)
  days_left: 25 → 18 (auto)
  Status: 41.9% used ✅
```

### Day 28: Near End of Month
```
Add Expense #4: $95.00
  
Budget Updates:
  spent: $251.25 → $346.25 (auto)
  days_left: 18 → 2 (auto)
  Status: 57.7% used ✅
```

### Day 31: Month Ends
```
System automatically:
  days_left: 2 → 30 (new month)
  spent: Stays at $346.25 (historical)
  
Manual action needed:
  - Review last month's spending
  - Optionally reset spent to $0 for new month
  - Or create new budget for new month
```

## Budget Schema

### Required Fields (You Set)
- `name` - Budget name
- `category` - Budget category
- `amount` - Budget limit

### Auto-Calculated Fields (System Sets)
- `spent` - Total from linked expenses (optional, defaults to 0)
- `days_left` - Days until end of month (optional)

### System Fields (Automatic)
- `id` - Unique identifier
- `created` - Creation timestamp
- `updated` - Last update timestamp

## Import Example

**Minimal budget data (recommended):**
```json
[
  {
    "name": "Groceries",
    "category": "food",
    "amount": 600
  },
  {
    "name": "Gas & Transport",
    "category": "transportation",
    "amount": 300
  },
  {
    "name": "Entertainment",
    "category": "all",
    "amount": 250
  }
]
```

System will automatically set:
- `spent: 0`
- `days_left: [days until end of month]`

## Monthly Reset Options

### Option 1: Manual Reset
At start of each month:
1. Go to PocketBase admin
2. Edit each budget
3. Set `spent: 0`
4. System auto-updates `days_left`

### Option 2: Create New Budgets
At start of each month:
1. Archive/delete old budgets
2. Create new budgets with same amounts
3. System starts fresh with `spent: 0`

### Option 3: Keep Historical
Don't reset:
1. Let `spent` accumulate
2. Use date filters to see monthly spending
3. Create reports from expense data

## Benefits

✅ **No manual entry** - Spent calculates automatically  
✅ **Always accurate** - Updates with every expense  
✅ **Time tracking** - Days left auto-updates daily  
✅ **Real-time feedback** - See progress instantly  
✅ **Historical data** - Track spending over time  
✅ **Flexible periods** - Works with any timeframe  

## Troubleshooting

**Budget not updating?**
- Check expense has budget selected
- Verify expense status is not canceled/rejected
- Refresh page to trigger recalculation

**Wrong spent amount?**
- Check all expenses linked to budget
- Verify expense amounts are correct
- System recalculates on every page load

**Days left not updating?**
- System calculates based on current date
- Updates automatically when page loads
- Should match days until end of month

## Summary

You set the **amount** (budget limit), system calculates:
- **Spent** from linked expenses
- **Days left** until end of month

Just link expenses to budgets and everything updates automatically!
