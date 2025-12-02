# Manual Budget Import Instructions

Since automated migration requires valid authentication, here are the manual steps:

## Option 1: Via PocketBase Admin UI (Easiest)

1. Go to: https://pocketbase-production-f733.up.railway.app/_/
2. Login with: `ddinsmore8@gmail.com` / `MADcap(123)`
3. Navigate to **Collections** → **budgets**
4. Click **New Record** for each budget below:

### Budget 1: Monthly Housing
```
Name: Monthly Housing
Amount: 2500
Period: monthly
Start Date: 2025-01-01
Category: lodging
Type: expense
Account: bank
Alert Threshold: 90
Active: ✓
Rollover: ☐
Notes: Includes mortgage, HOA fees, and property-related expenses
```

### Budget 2: Monthly Utilities
```
Name: Monthly Utilities
Amount: 500
Period: monthly
Start Date: 2025-01-01
Category: utilities
Type: expense
Account: bank
Alert Threshold: 80
Active: ✓
Rollover: ☐
Notes: Electric, water, internet, phone, and other utilities
```

### Budget 3: Monthly Food & Groceries
```
Name: Monthly Food & Groceries
Amount: 800
Period: monthly
Start Date: 2025-01-01
Category: food
Type: expense
Account: bank
Alert Threshold: 85
Active: ✓
Rollover: ✓
Notes: Groceries, dining out, and food delivery
```

### Budget 4: Monthly Transportation
```
Name: Monthly Transportation
Amount: 600
Period: monthly
Start Date: 2025-01-01
Category: transportation
Type: expense
Account: bank
Alert Threshold: 80
Active: ✓
Rollover: ☐
Notes: Car payment, gas, insurance, maintenance, and parking
```

### Budget 5: Monthly Income Goal
```
Name: Monthly Income Goal
Amount: 5000
Period: monthly
Start Date: 2025-01-01
Category: all
Type: income
Account: all
Alert Threshold: 75
Active: ✓
Rollover: ☐
Notes: Total monthly income target from all sources
```

## Option 2: Via API (If you have a valid auth token)

First, get your auth token by logging into the app, then run these curl commands:

```bash
# Replace YOUR_AUTH_TOKEN with your actual token

curl -X POST "https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records" \
  -H "Authorization: YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monthly Housing","amount":2500,"period":"monthly","start_date":"2025-01-01","category":"lodging","type":"expense","account":"bank","alert_threshold":90,"active":true,"rollover":false,"notes":"Includes mortgage, HOA fees, and property-related expenses"}'

# Repeat for other budgets...
```

## Summary

**Total Monthly Budget:**
- Housing: $2,500
- Utilities: $500
- Food: $800
- Transportation: $600
- **Total Expenses: $4,400**
- **Income Goal: $5,000**
- **Monthly Surplus: $600**
