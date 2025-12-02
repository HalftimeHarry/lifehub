# ⚠️ DEPRECATED - DO NOT USE

**This guide is outdated and should NOT be followed.**

Income transactions are separate from bank accounts and should be kept for proper financial tracking.

## Manual Deletion via PocketBase Admin UI

1. Go to: [https://pocketbase-production-f733.up.railway.app/_/](https://pocketbase-production-f733.up.railway.app/_/)
2. Login with your credentials
3. Navigate to **Collections** → **expenses**
4. Filter by: `type = "income"`
5. Select all income records
6. Click **Delete** button
7. Confirm deletion

## Why Delete Income Expenses?

- **Bank Accounts** now track account balances directly
- **Expenses** should focus on spending and budgets
- Income tracking is better handled at the account level
- Reduces duplicate data and confusion

## What to Keep

Keep all expense records where:
- `type = "expense"`
- Categories: retail, lodging, utilities, food, transportation, etc.
- These link to budgets and track actual spending

## After Deletion

The expenses dashboard will show:
- **Bank Accounts** - Current balances and totals
- **Budgets** - Spending vs. budget limits
- **Expenses** - Individual transactions (all expenses, no income)

This creates a cleaner separation:
- **Accounts** = What you have
- **Budgets** = What you can spend
- **Expenses** = What you spent
