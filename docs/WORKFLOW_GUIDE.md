# LifeHub Workflow Guide

Day-to-day usage and forecasting workflows.

## Daily Workflow

### Morning: Check Dashboard
1. View **Bank Accounts** - Current balances
2. Check **Budgets** - Spending progress
3. Review **Upcoming Expenses** - Bills due soon
4. Check **Upcoming Income** - Expected payments

### During Day: Record Transactions

#### Recording an Expense (Paid)
```
Buy groceries at Ralphs: $85.50
  ↓
Click "Add Transaction"
  ↓
Fill form:
  - Type: Expense ✓ (default)
  - Amount: $85.50
  - Date: Today
  - Category: Food
  - Budget: Groceries
  - Store: Ralphs
  - Status: Paid ✓ (default)
  - For: Your name ✓ (auto-selected)
  ↓
Save
  ↓
Budget updates: Groceries $425 → $510.50 / $600
```

#### Recording Unexpected Income
```
Receive freelance payment: $500
  ↓
Click "Add Transaction"
  ↓
Fill form:
  - Type: Income ← Switch from Expense
  - Amount: $500
  - Date: Today
  - Category: Freelance
  - Status: Paid
  - For: Your name
  ↓
Save
  ↓
Shows in Total Income
```

#### Recording Future Bill
```
Rent due in 5 days: $1,500
  ↓
Click "Add Transaction"
  ↓
Fill form:
  - Type: Expense
  - Amount: $1,500
  - Date: Due date (5 days from now)
  - Category: Lodging
  - Budget: Monthly Housing
  - Status: Upcoming ← Important!
  - For: Your name
  ↓
Save
  ↓
Shows in projections
```

### Evening: Update Bank Balances
1. Check actual bank account balances
2. Click **Bank Accounts** card
3. Click pencil icon on each account
4. Update to match real balance
5. Save

## Weekly Workflow

### Sunday Planning
1. **Review Past Week**
   - Filter: Status = Paid
   - Check spending by category
   - Compare to budgets

2. **Plan Next Week**
   - Filter: Status = Upcoming
   - Review bills due
   - Check expected income

3. **Update Budgets**
   - Check progress (% used)
   - Adjust if needed
   - Plan remaining spending

## Monthly Workflow

### End of Month
1. **Close Out Month**
   - Mark all paid expenses as "Approved"
   - Verify all transactions recorded
   - Update final bank balances

2. **Review Performance**
   - Total Income vs Total Expenses
   - Budget performance by category
   - Net surplus/deficit

3. **Reset for New Month**
   - Update budget "days_left" to 30
   - Clear or archive old transactions
   - Set new spending goals

### Start of Month
1. **Add Recurring Bills**
   - Rent/mortgage
   - Subscriptions
   - Insurance
   - Utilities (estimated)

2. **Add Expected Income**
   - Salary (if known)
   - Regular payments
   - Status: Upcoming

3. **Review Budgets**
   - Reset spent amounts if needed
   - Adjust limits based on last month

## Forecasting Workflows

### 1-Month Projection

**Current State:**
```
Bank Accounts: $13,870
```

**Expected Income (Upcoming):**
```
Salary (15th): $4,000
Freelance: $500
Total: $4,500
```

**Expected Expenses (Upcoming):**
```
Rent (1st): $1,500
Utilities: $200
Groceries: $600
Gas: $300
Entertainment: $250
Total: $2,850
```

**Projected End Balance:**
```
Current: $13,870
+ Income: $4,500
- Expenses: $2,850
= Projected: $15,520
```

### 2-Month Projection

**Month 1:**
- Starting: $13,870
- Income: $4,500
- Expenses: $2,850
- Ending: $15,520

**Month 2:**
- Starting: $15,520
- Income: $4,500 (estimated)
- Expenses: $2,850 (estimated)
- Ending: $17,170

**Trend:** +$1,650/month surplus

## Filtering for Reports

### View Paid Transactions Only
```
Status: Paid
Date Range: Past 30 Days
```
**Use:** Historical spending analysis

### View Upcoming Transactions
```
Status: Upcoming
Date Range: Next 30 Days
```
**Use:** Cash flow forecasting

### View Income Only
```
Type: Income
Status: All
Date Range: All Time
```
**Use:** Income tracking and trends

### View Expenses by Category
```
Type: Expense
Category: Food
Status: Paid
Date Range: Past 30 Days
```
**Use:** Category-specific analysis

### View Budget Performance
```
Type: Expense
Status: Paid
Date Range: Past 30 Days
```
Then check Budget cards for progress

## Quick Actions

### Fast Expense Entry (Most Common)
1. Click "Add Transaction"
2. Enter amount
3. Select store (if retail)
4. Save
   - Type: Expense (default)
   - Category: Retail (default)
   - Status: Paid (default)
   - For: You (auto-selected)

### Update Account Balance
1. Click Bank Accounts card
2. Click pencil on account
3. Enter new balance
4. Save

### Check Budget Status
1. Scroll to Budgets section
2. View progress bars
3. Check emoji indicators:
   - ✅ Good (< 75%)
   - ⚠️ Warning (75-99%)
   - ❌ Over (≥ 100%)

## Best Practices

### Daily
- ✅ Record expenses same day
- ✅ Keep receipts
- ✅ Check upcoming bills

### Weekly
- ✅ Update bank balances
- ✅ Review budget progress
- ✅ Plan next week's spending

### Monthly
- ✅ Close out previous month
- ✅ Review performance
- ✅ Set new goals
- ✅ Add recurring bills

### Always
- ✅ Use correct status (Paid vs Upcoming)
- ✅ Link expenses to budgets
- ✅ Keep bank balances current
- ✅ Record unexpected income

## Common Scenarios

### Scenario: Unexpected Car Repair
```
1. Add expense:
   - Amount: $450
   - Category: Transportation
   - Budget: (none or create "Emergency")
   - Status: Paid
   
2. Update bank balance:
   - Subtract $450 from checking
   
3. Adjust other budgets if needed:
   - Reduce entertainment budget
   - Postpone non-essential spending
```

### Scenario: Bonus Payment
```
1. Add income:
   - Amount: $1,000
   - Category: Business Income
   - Status: Paid
   
2. Update bank balance:
   - Add $1,000 to checking
   
3. Allocate funds:
   - Increase savings
   - Pay down debt
   - Increase budget limits
```

### Scenario: Monthly Bill Paid
```
1. Find upcoming expense:
   - Filter: Status = Upcoming
   - Find: Netflix $15.99
   
2. Edit transaction:
   - Change Status: Upcoming → Paid
   - Verify date
   
3. Budget auto-updates:
   - Entertainment: $185 → $200.99 / $250
```

## Tips for Accuracy

1. **Enter transactions promptly** - Don't wait days
2. **Use correct dates** - Actual transaction date
3. **Link to budgets** - Enables tracking
4. **Update bank balances** - Keep in sync
5. **Use Upcoming status** - For future bills
6. **Review regularly** - Catch errors early

## Summary

- **Daily:** Record transactions, check dashboard
- **Weekly:** Update balances, review budgets
- **Monthly:** Close out, review, plan ahead
- **Always:** Use correct status, link to budgets, stay current

This workflow keeps your finances accurate and enables powerful forecasting!
