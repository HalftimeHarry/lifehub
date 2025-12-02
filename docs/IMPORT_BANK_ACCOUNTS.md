# Import Bank Accounts Collection

## Step 1: Import Collection Schema

1. Go to PocketBase Admin: https://pocketbase-production-f733.up.railway.app/_/
2. Navigate to: **Collections** → **Import collections**
3. Copy and paste the JSON from `/tmp/bank_accounts_collection.json`
4. Click **Import**

## Step 2: Add Sample Bank Accounts

After importing the collection, add these sample accounts:

### Account 1: Chase Checking
```
name: Chase Checking
type: checking
balance: 5200
institution: Chase Bank
last_four: 1234
active: true
display_order: 1
notes: Primary checking account
```

### Account 2: Savings Account
```
name: Savings Account
type: savings
balance: 12000
institution: Chase Bank
last_four: 5678
active: true
display_order: 2
notes: Emergency fund
```

### Account 3: Business Account
```
name: Business Account
type: business
balance: 3500
institution: Bank of America
last_four: 9012
active: true
display_order: 3
notes: Business expenses
```

## Total Bank Balance: $20,700

## Quick Import via Admin UI

1. Go to Collections → bank_accounts
2. Click "New Record" for each account
3. Fill in the values above
4. Click "Create"

That's it! The dashboard will automatically load and display these accounts.
