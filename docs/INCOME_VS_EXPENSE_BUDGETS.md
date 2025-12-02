# Income vs Expense Budgets

Understanding when to use budgets and when not to.

## Key Concept

**Budgets are for tracking spending, not income.**

## Why Income Doesn't Link to Budgets

### Income = Money Coming In
- Salary received
- Freelance payment
- Refund
- Gift received
- Business income

**Purpose:** Track earnings and cash inflows  
**Budget Link:** None (income isn't "spent")

### Expenses = Money Going Out
- Groceries purchased
- Gas filled up
- Rent paid
- Subscription charged
- Utilities billed

**Purpose:** Track spending against limits  
**Budget Link:** Yes (to track against budget limits)

## Form Behavior

### When Type = Income
- Budget dropdown is **hidden**
- Budget field automatically cleared
- No budget tracking needed
- Income categories shown

### When Type = Expense
- Budget dropdown is **visible**
- Can link to a budget (optional)
- Tracks spending against limit
- Expense categories shown

## Example Scenarios

### ✅ Correct: Expense with Budget
```
Type: Expense
Amount: $85.50
Category: Food
Budget: Groceries ← Links to budget
Status: Paid

Result: Groceries budget updates
  $425 → $510.50 / $600
```

### ✅ Correct: Expense without Budget
```
Type: Expense
Amount: $450
Category: Other
Budget: (none) ← No budget selected
Status: Paid

Result: Expense recorded, no budget updated
```

### ✅ Correct: Income (no budget)
```
Type: Income
Amount: $500
Category: Freelance
Budget: (field hidden) ← Not shown for income
Status: Paid

Result: Income recorded, no budget involved
```

### ❌ Incorrect: Income with Budget
```
Type: Income
Amount: $4,000
Category: Salary
Budget: Monthly Income ← DON'T DO THIS

Problem: Income isn't spending, shouldn't link to budgets
```

## Budget Types

### Expense Budgets (Spending Limits)
```
Name: Groceries
Category: food
Amount: $600 (limit)
Spent: $425 (auto-calculated from expenses)
Purpose: Control food spending
```

### Income "Budgets" (Goals)
If you want to track income goals, create a separate system:
- Use income transactions to track actual earnings
- Set goals separately (not in budgets collection)
- Compare actual income vs goals in reports

## Data Model

```
Bank Accounts
  ↓ Current balances (assets)
  
Income Transactions
  ↓ Money received (no budget link)
  
Expense Transactions
  ↓ Money spent (optional budget link)
  ↓
Budgets
  ↓ Spending limits
  ↓ Auto-calculate spent from linked expenses
```

## Best Practices

### For Income
1. ✅ Record as Income type
2. ✅ Leave budget field empty (it's hidden)
3. ✅ Use appropriate income category
4. ✅ Track in income reports

### For Expenses
1. ✅ Record as Expense type
2. ✅ Link to budget if tracking spending
3. ✅ Leave budget empty if one-off expense
4. ✅ Use appropriate expense category

### For Budgets
1. ✅ Create for expense categories only
2. ✅ Set spending limits
3. ✅ Let system calculate spent
4. ✅ Review progress regularly

## Common Questions

**Q: Can I create a budget for income?**  
A: Technically yes, but it's not recommended. Budgets are designed for tracking spending limits, not income goals.

**Q: What if I want to track income goals?**  
A: Use income transactions and compare totals to your goals. Create reports or dashboards for income tracking.

**Q: Should every expense link to a budget?**  
A: No, only if you want to track it against a spending limit. One-off or miscellaneous expenses can be unlinked.

**Q: What happens if I accidentally link income to a budget?**  
A: The system filters by type='expense', so income won't affect budget calculations. But it's cleaner to leave it unlinked.

## Summary

- **Income** = No budget link (field hidden)
- **Expenses** = Optional budget link (field visible)
- **Budgets** = Track expense spending only

Keep it simple: budgets are for controlling spending, not tracking income!
