# Add Budget Feature

Create new budgets directly from the Budgets modal.

## How to Use

### 1. Open Budgets Modal
- Click the **Budgets** summary card on the dashboard
- Modal opens showing all existing budgets

### 2. Click "New Budget"
- Button in top-right corner of modal
- Opens inline form at top of modal

### 3. Fill in Budget Details

**Required Fields:**
- **Budget Name** - Descriptive name (e.g., "Monthly Groceries")
- **Category** - Select from dropdown
- **Amount** - Budget limit in dollars

**Categories Available:**
- Lodging
- Utilities
- Food
- Transportation
- All Categories

### 4. Create Budget
- Click **"Create Budget"** button
- Budget is saved to PocketBase
- Form closes automatically
- Budget list refreshes
- Success notification appears

### 5. Budget Auto-Initializes
- `spent: 0` (no spending yet)
- `days_left: [calculated]` (days until end of month)
- Ready to link expenses

## Form Layout

```
┌─────────────────────────────────────────────────────┐
│ Create New Budget                              [X]  │
├─────────────────────────────────────────────────────┤
│ Budget Name *        Category *        Amount *     │
│ [Monthly Groceries]  [Food ▼]         [$] [600]    │
│                                                      │
│                           [Cancel] [Create Budget]  │
└─────────────────────────────────────────────────────┘
```

## Example: Create Groceries Budget

**Step 1:** Click Budgets card → Click "New Budget"

**Step 2:** Fill form:
```
Budget Name: Monthly Groceries
Category: Food
Amount: 600
```

**Step 3:** Click "Create Budget"

**Result:**
```
Budget created:
  Name: Monthly Groceries
  Category: food
  Amount: $600
  Spent: $0 (auto)
  Days Left: 15 (auto)
  Status: 0% used ✅
```

## Validation

**Required Fields:**
- Budget Name cannot be empty
- Amount cannot be empty
- Amount must be a valid number
- Amount must be greater than 0

**Error Messages:**
- "Please fill in all required fields"
- "Please enter a valid amount"
- "Failed to create budget" (if server error)

## Features

✅ **Inline Form** - No separate page needed  
✅ **Quick Creation** - 3 fields, done  
✅ **Auto-Initialize** - Spent and days_left set automatically  
✅ **Instant Refresh** - New budget appears immediately  
✅ **Toast Notifications** - Success/error feedback  
✅ **Cancel Option** - Close form without saving  

## After Creation

**Budget is ready to use:**
1. Shows in budgets list
2. Appears in expense form dropdown
3. Can link expenses to it
4. Tracks spending automatically

**Next Steps:**
1. Add expenses and link to this budget
2. Watch spending progress
3. Monitor budget status
4. Adjust amount if needed (via PocketBase admin)

## Workflow

```
Dashboard
  ↓ Click Budgets card
Budgets Modal
  ↓ Click "New Budget"
Add Budget Form
  ↓ Fill: Name, Category, Amount
  ↓ Click "Create Budget"
Success!
  ↓ Form closes
  ↓ Budget list refreshes
New budget appears in list
  ↓ Ready to use
Link expenses to budget
```

## Tips

1. **Use descriptive names** - "Monthly Groceries" not "Budget 1"
2. **Set realistic amounts** - Based on actual spending patterns
3. **Choose correct category** - Helps with filtering and reports
4. **Create before expenses** - So you can link expenses immediately
5. **Review regularly** - Adjust amounts as needed

## Technical Details

**Creates budget with:**
```javascript
{
  name: "Monthly Groceries",
  category: "food",
  amount: 600,
  spent: 0  // Auto-initialized
}
```

**System auto-calculates:**
- `days_left` - Days until end of month
- Updates on page load

**Budget immediately available:**
- In budgets list
- In expense form dropdown
- For expense linking

## Summary

Quick budget creation right from the Budgets modal - no need to go to PocketBase admin!
