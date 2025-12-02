# Budget Tracking System

Automatic budget tracking by linking expenses to budgets.

## How It Works

### 1. Budgets Store Limits
Each budget has:
- **Name** - e.g., "Entertainment", "Groceries"
- **Category** - lodging, utilities, food, transportation, all, income
- **Amount** - Budget limit (e.g., $800)
- **Spent** - Auto-calculated from linked expenses
- **Days Left** - Time remaining in budget period

### 2. Expenses Link to Budgets
When creating an expense:
- Select a budget from the dropdown (optional)
- The expense amount is automatically added to that budget's spent total
- Budget cards update in real-time

### 3. Auto-Calculation
The system automatically:
- Sums all expenses linked to each budget
- Only counts expenses with status: `paid`, `upcoming`, or `approved`
- Excludes `canceled` and `rejected` expenses
- Updates budget totals when expenses are added/edited/deleted

## User Flow

### Creating a Tracked Expense

1. Click **"Add Expense"**
2. Fill in the form:
   - Amount: $45.99
   - Date: Today
   - Category: Retail
   - **Budget: Entertainment** ← Select budget
   - Store: Target
3. Click **"Save"**

**Result:**
- Expense is saved
- Entertainment budget updates: $46.99 / $800
- Budget card shows new progress bar

### Viewing Budget Status

Budget cards show:
- **Name** - Entertainment
- **Progress** - $46.99 / $800 (5.9%)
- **Status Emoji** - ✅ (good), ⚠️ (warning), ❌ (over)
- **Remaining** - $753.01 remaining
- **Days Left** - 15 days left

### Status Indicators

- **Good** (< 75%) - Green progress bar ✅
- **Caution** (75-89%) - Yellow progress bar ⚠️
- **Warning** (90-99%) - Orange progress bar ⚠️
- **Over** (≥ 100%) - Red progress bar ❌

## Budget Categories

Match expense categories to budgets:

| Budget Category | Expense Categories |
|----------------|-------------------|
| **lodging** | lodging |
| **utilities** | utilities |
| **food** | food |
| **transportation** | transportation |
| **all** | Any category |
| **income** | N/A (not used for expenses) |

## Example Budgets

### Monthly Groceries
```
Name: Groceries
Category: food
Amount: $600
Spent: $425 (auto-calculated)
Days Left: 15
Status: 70.8% - Good ✅
```

**Linked Expenses:**
- Ralphs - $85.50
- Vons - $120.00
- Costco - $219.50

### Entertainment
```
Name: Entertainment
Category: all
Amount: $250
Spent: $185 (auto-calculated)
Days Left: 15
Status: 74% - Good ✅
```

**Linked Expenses:**
- Netflix - $15.99
- Movie tickets - $45.00
- Concert - $124.01

## Benefits

✅ **Automatic Tracking** - No manual entry of spent amounts  
✅ **Real-time Updates** - Budget cards update instantly  
✅ **Visual Progress** - Color-coded progress bars  
✅ **Accurate Totals** - Calculated from actual expenses  
✅ **Flexible Linking** - Expenses can be unlinked (no budget)  
✅ **Status Filtering** - Only counts valid expenses  

## Technical Details

### Calculation Logic

```javascript
// For each budget
const budgetExpenses = expenses.filter(e => 
  e.budget === budget.id &&           // Linked to this budget
  e.type === 'expense' &&             // Is an expense (not income)
  e.status !== 'canceled' &&          // Not canceled
  e.status !== 'rejected'             // Not rejected
);

const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
```

### When Totals Update

- After adding a new expense
- After editing an expense
- After deleting an expense
- On page load/refresh

### Database Schema

**Expenses:**
- `budget` field (relation to budgets collection)
- Links expense to a specific budget

**Budgets:**
- `spent` field (number)
- Auto-updated from linked expenses
- Should not be manually edited

## Best Practices

1. **Create budgets first** before adding expenses
2. **Link expenses consistently** to track accurately
3. **Use meaningful budget names** (e.g., "Monthly Groceries" not "Budget 1")
4. **Set realistic amounts** based on spending patterns
5. **Review regularly** to stay within limits
6. **Update days_left** at the start of each period

## Troubleshooting

**Budget not updating?**
- Check that expense has a budget selected
- Verify expense status is not "canceled" or "rejected"
- Refresh the page to recalculate

**Wrong total?**
- Check all expenses linked to that budget
- Verify expense amounts are correct
- System recalculates on every page load

**Can't select budget?**
- Make sure budgets exist in PocketBase
- Check that budgets collection is loaded
- Verify budget dropdown shows options
