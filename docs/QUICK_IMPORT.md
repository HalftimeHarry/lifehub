# Quick Import Guide - Bank Accounts & Budgets

## Step 1: Access PocketBase Admin

Go to: [https://pocketbase-production-f733.up.railway.app/_/](https://pocketbase-production-f733.up.railway.app/_/)

Login:
- Email: `ddinsmore8@gmail.com`
- Password: `MADcap(123)`

---

## Step 2: Import Bank Accounts

1. Click **Collections** in the left sidebar
2. Click on **bank_accounts** collection
3. Click the **"New record"** button (top right)
4. Fill in the form for each account below, or use the import feature if available

### Account 1: Bank of America Savings
```
name: Bank of America Savings account
type: savings
balance: 7993.00
institution: Bank of America
last_four: 0030
```

### Account 2: Business Checking
```
name: Business checking account
type: business
balance: 394.00
institution: US Bank
last_four: 4545
```

### Account 3: Checking Main
```
name: Checking Main
type: checking
balance: 5483.00
institution: Bank of America Advantage
last_four: 9131
```

---

## Step 3: Import Budgets

1. Still in **Collections**, click on **budgets** collection
2. Click the **"New record"** button
3. Fill in the form for each budget below

### Budget 1: Monthly Rent
```
name: Monthly Rent
category: lodging
amount: 1500
spent: 1500
days_left: 15
```

### Budget 2: Utilities
```
name: Utilities
category: utilities
amount: 200
spent: 145
days_left: 15
```

### Budget 3: Groceries
```
name: Groceries
category: food
amount: 600
spent: 425
days_left: 15
```

### Budget 4: Gas & Transport
```
name: Gas & Transport
category: transportation
amount: 300
spent: 280
days_left: 15
```

### Budget 5: Entertainment
```
name: Entertainment
category: all
amount: 250
spent: 185
days_left: 15
```

---

## Step 4: Verify

1. Go back to your app: `/dashboard/expenses`
2. Refresh the page
3. You should now see:
   - **Bank Accounts section** with 1 summary card showing total balance ($13,870.00)
   - Click the card to open a modal with all 3 individual accounts
   - **Budgets section** with 5 cards showing progress bars

---

## Alternative: Bulk Import via JSON

If PocketBase has a bulk import feature:

1. Go to Collections → bank_accounts
2. Look for "Import" or "Import records" button
3. Copy the contents of `docs/bank_accounts_data.json`
4. Paste and import
5. Repeat for budgets collection with `docs/budgets_data.json`

---

## Troubleshooting

**If you don't see the data after import:**
1. Check browser console for errors (F12)
2. Verify the collections have records in PocketBase admin
3. Check that API rules are set to `""` (empty string) for public access
4. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**If cards still don't appear:**
- The frontend is fetching from: `https://pocketbase-production-f733.up.railway.app/api/collections/bank_accounts/records`
- Test this URL in your browser to see if data is returned
