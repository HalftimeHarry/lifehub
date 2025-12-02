# Budget Migration Guide

## 🎯 Goal
Import 5 sample budgets into your PocketBase database.

## 📦 What's Included

- **budgets_import.json** - Budget data (5 budgets)
- **migrate-budgets.mjs** - Automated migration script (requires auth)
- **generate-import-commands.mjs** - Generates curl commands
- **import-budgets-commands.sh** - Pre-generated curl commands
- **BUDGET_IMPORT_GUIDE.md** - Manual import guide

## 🚀 Quick Start - Choose Your Method

### Method 1: Using Curl Commands (Recommended)

**Step 1:** Get your auth token
1. Login to your app: https://5173--019ad10a-e46d-7d48-93f2-39a68eac6e8a.us-east-1-01.gitpod.dev
2. Open DevTools (F12)
3. Go to: Application → Local Storage → pocketbase_auth
4. Copy the `token` value

**Step 2:** Run the import commands
```bash
# Open the commands file
cat import-budgets-commands.sh

# Replace YOUR_TOKEN_HERE with your actual token in each command
# Then run each curl command
```

### Method 2: Manual Import via Admin UI (Easiest)

1. Go to: https://pocketbase-production-f733.up.railway.app/_/
2. Login with your credentials
3. Navigate to: Collections → budgets
4. Click "New Record" for each budget
5. Copy values from `BUDGET_IMPORT_GUIDE.md`

### Method 3: Automated Script (If you have valid credentials)

```bash
# Edit migrate-budgets.mjs and update credentials
# Then run:
node migrate-budgets.mjs
```

## 📊 Budgets to Import

| Name | Amount | Period | Category | Type |
|------|--------|--------|----------|------|
| Monthly Housing | $2,500 | monthly | lodging | expense |
| Monthly Utilities | $500 | monthly | utilities | expense |
| Monthly Food & Groceries | $800 | monthly | food | expense |
| Monthly Transportation | $600 | monthly | transportation | expense |
| Monthly Income Goal | $5,000 | monthly | all | income |

**Total:** $4,400 expenses / $5,000 income = $600 surplus

## ✅ Verification

After importing, verify in PocketBase Admin:
1. Go to Collections → budgets
2. You should see 5 records
3. Check that all fields are populated correctly

## 🐛 Troubleshooting

**Authentication Failed:**
- Verify your credentials are correct
- Try logging in via the Admin UI first
- Use Method 1 (curl commands) with a valid token

**Budget Already Exists:**
- The script will skip existing budgets
- Delete duplicates in Admin UI if needed

**Network Error:**
- Check that PocketBase is running
- Verify the URL is correct
- Check your internet connection

## 📝 Next Steps

After importing budgets:
1. ✅ Verify budgets in Admin UI
2. 🎨 Update frontend to display budgets
3. 🔗 Link expenses to budgets
4. 📊 Create budget dashboard
5. 📈 Add budget tracking and alerts
