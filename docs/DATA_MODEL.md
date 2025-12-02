# LifeHub Data Model

Understanding the financial tracking system.

## Core Concepts

### 1. Bank Accounts (Assets)
**What they are:** Current balances of your accounts  
**Purpose:** Track what you have right now  
**Examples:**
- Checking account: $5,483
- Savings account: $7,993
- Business account: $394

**Key Points:**
- Represents current state of assets
- Updated manually when balances change
- Not linked to individual transactions
- Shows total available funds

### 2. Income (Money Coming In)
**What it is:** Money you receive  
**Purpose:** Track earnings and cash inflows  
**Examples:**
- Salary/wages
- Freelance payment
- Refund
- Gift received
- Business income

**Key Points:**
- Type: `income`
- Can be paid (received) or upcoming (expected)
- Separate from bank account balances
- Used for forecasting future income

### 3. Expenses (Money Going Out)
**What they are:** Money you spend  
**Purpose:** Track spending and budget usage  
**Examples:**
- Groceries: $85.50
- Gas: $45.00
- Rent: $1,500
- Netflix: $15.99

**Key Points:**
- Type: `expense`
- Can be paid (completed) or upcoming (scheduled)
- Links to budgets for tracking
- Used for spending analysis

### 4. Budgets (Spending Limits)
**What they are:** Planned spending limits by category  
**Purpose:** Control spending and track progress  
**Examples:**
- Groceries: $600/month
- Entertainment: $250/month
- Gas & Transport: $300/month

**Key Points:**
- Sets spending goals
- Auto-calculates spent from linked expenses
- Shows progress and remaining amount
- Helps with financial planning

## Data Flow

### Recording Income

```
Receive Payment
  ↓
Add Income Transaction
  - Type: Income
  - Amount: $2,500
  - Category: Salary
  - Status: Paid
  - Date: Today
  ↓
Update Bank Account Balance
  - Manually adjust checking account
  - New balance: $5,483 + $2,500 = $7,983
```

### Recording Expenses

```
Make Purchase
  ↓
Add Expense Transaction
  - Type: Expense
  - Amount: $85.50
  - Category: Food
  - Budget: Groceries
  - Status: Paid
  - Date: Today
  ↓
Budget Auto-Updates
  - Groceries: $425 → $510.50 / $600
  ↓
Update Bank Account Balance
  - Manually adjust checking account
  - New balance: $7,983 - $85.50 = $7,897.50
```

## Status Types

### Paid
- Transaction completed
- Money already moved
- Historical record
- Used in reports

### Upcoming
- Transaction scheduled
- Money not yet moved
- Future projection
- Used in forecasting

### Approved
- Transaction verified
- Older than 30 days
- Auto-set by system
- Historical record

### Canceled
- Transaction didn't happen
- Not counted in totals
- Kept for reference

### Rejected
- Transaction denied
- Not counted in totals
- Kept for audit trail

## Use Cases

### Daily Expense Entry
1. Buy groceries at Ralphs: $85.50
2. Add expense:
   - Type: Expense
   - Amount: $85.50
   - Category: Food
   - Budget: Groceries
   - Store: Ralphs
   - Status: Paid
3. Budget updates automatically
4. Later: Update bank account balance

### Unexpected Income
1. Receive freelance payment: $500
2. Add income:
   - Type: Income
   - Amount: $500
   - Category: Freelance
   - Status: Paid
3. Later: Update bank account balance

### Recurring Bills
1. Netflix charges monthly: $15.99
2. Add expense:
   - Type: Expense
   - Amount: $15.99
   - Category: Subscription
   - Service: Netflix
   - Status: Paid
   - Recurring: Yes
3. Next month: Duplicate and update date

### Future Planning
1. Rent due in 5 days: $1,500
2. Add expense:
   - Type: Expense
   - Amount: $1,500
   - Category: Lodging
   - Status: Upcoming
   - Date: Due date
3. Shows in projections
4. When paid: Change status to Paid

## Reporting & Forecasting

### Current State
- **Bank Accounts:** What you have now
- **Total Assets:** Sum of all account balances

### Historical Analysis
- **Income (Paid):** What you earned
- **Expenses (Paid):** What you spent
- **Net:** Income - Expenses
- **Budget Performance:** Spent vs. Limits

### Future Projections
- **Upcoming Income:** Expected earnings
- **Upcoming Expenses:** Scheduled bills
- **Projected Balance:** Current + Upcoming Income - Upcoming Expenses
- **Budget Forecast:** Will you stay within limits?

## Best Practices

### 1. Enter Transactions Promptly
- Add expenses same day or next day
- Record income when received
- Keep receipts for reference

### 2. Use Status Correctly
- **Paid:** Money already moved
- **Upcoming:** Money will move soon
- Don't use "Upcoming" for past dates

### 3. Link to Budgets
- Always link expenses to budgets when applicable
- Helps track spending patterns
- Enables budget alerts

### 4. Update Bank Accounts Regularly
- Check balances weekly
- Use edit feature in bank accounts modal
- Keep in sync with actual accounts

### 5. Review Regularly
- Check budget progress weekly
- Review upcoming expenses
- Adjust budgets as needed

## Example Month

### Starting Balance
- Checking: $5,000
- Savings: $10,000
- **Total Assets: $15,000**

### Income (Paid)
- Salary: $4,000
- Freelance: $500
- **Total Income: $4,500**

### Expenses (Paid)
- Rent: $1,500
- Groceries: $425
- Gas: $280
- Entertainment: $185
- Utilities: $145
- **Total Expenses: $2,535**

### Net
- Income - Expenses = $4,500 - $2,535 = **$1,965 surplus**

### Ending Balance (Projected)
- Starting: $15,000
- Plus Income: $4,500
- Minus Expenses: $2,535
- **Ending: $16,965**

### Budget Performance
- Groceries: $425 / $600 (71%) ✅
- Gas: $280 / $300 (93%) ⚠️
- Entertainment: $185 / $250 (74%) ✅
- Utilities: $145 / $200 (73%) ✅

## Key Differences

| Concept | Purpose | Updates | Timeframe |
|---------|---------|---------|-----------|
| **Bank Accounts** | Current assets | Manual | Right now |
| **Income** | Money received | Per transaction | Past & Future |
| **Expenses** | Money spent | Per transaction | Past & Future |
| **Budgets** | Spending limits | Auto from expenses | Period (month) |

## Summary

- **Bank Accounts** = Assets (what you have)
- **Income** = Earnings (what comes in)
- **Expenses** = Spending (what goes out)
- **Budgets** = Limits (what you plan to spend)

All work together to give you complete financial visibility and control!
