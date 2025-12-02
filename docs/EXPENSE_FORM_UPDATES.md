# Expense Form Updates

Updated expense form with better defaults for daily use.

## Changes Made

### 1. Removed Income Type
- **Before:** Form had Income/Expense toggle buttons
- **After:** Form is expense-only (income tracked via bank accounts)
- **Why:** Bank accounts now handle income/balances, expenses focus on spending

### 2. Updated Default Values
- **Type:** Always `expense` (hidden from UI)
- **Category:** Defaults to `retail` (most common daily expense)
- **Status:** Defaults to `paid` (most entries are completed transactions)

### 3. Auto-Assign Current User
- **For field:** Automatically selects logged-in user's person record
- **How:** Matches user email with people collection
- **Benefit:** One less field to fill out for personal expenses

### 4. Simplified UI
- Removed Income/Expense toggle (always expense)
- Dialog title changed from "Add Expense/Income" to "Add Expense"
- Cleaner, faster form for daily expense entry

## New Workflow

### Adding a Retail Expense (Most Common)

1. Click **"Add Expense"** button
2. Form opens with defaults:
   - Type: Expense (hidden)
   - Category: Retail ✓
   - Status: Paid ✓
   - For: Your name ✓
3. Fill in:
   - Amount
   - Date
   - Store (if retail)
   - Optional: Receipt image
4. Click **"Save"**

**Result:** 3-4 fields instead of 7-8!

### Other Expense Types

Just change the category dropdown:
- **Lodging** - Rent, hotel
- **Utilities** - Electric, water, internet
- **Food** - Groceries, restaurants
- **Transportation** - Gas, parking, car payment
- **Medical** - Doctor, pharmacy
- **Subscription** - Netflix, Spotify

### Upcoming Expenses

Change status to **"Upcoming"** for:
- Bills due later
- Scheduled payments
- Future purchases

## Data Structure

### What Goes Where

**Bank Accounts:**
- Current balances
- Account totals
- Quick balance updates

**Budgets:**
- Spending limits by category
- Progress tracking
- Days remaining

**Expenses:**
- Individual transactions
- Receipt tracking
- Budget references
- All are type="expense"

## Migration Steps

1. **Delete income expenses** from PocketBase (see `DELETE_INCOME_EXPENSES.md`)
2. **Keep all expense records** (type="expense")
3. **Use bank accounts** for balance tracking going forward

## Benefits

✅ Faster data entry (fewer fields)  
✅ Better defaults for common use  
✅ Auto-assigns current user  
✅ Cleaner separation of concerns  
✅ Focus on spending, not income  
✅ Retail-first (most common category)  

## Example: Quick Retail Entry

**Before (7 fields):**
1. Type → Expense
2. Category → Retail
3. Status → Paid
4. For → Select your name
5. Amount → $45.99
6. Date → Today
7. Store → Target

**After (3 fields):**
1. Amount → $45.99
2. Date → Today
3. Store → Target

Everything else is pre-filled!
