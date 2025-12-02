# Budget Import Guide

## All 5 Budgets - Exact Field Values

Copy and paste these exact values into PocketBase Admin UI:

---

## Budget 1: Monthly Housing

```
name: Monthly Housing
amount: 2500
period: monthly
start_date: 2025-01-01 00:00:00.000Z
end_date: (leave empty)
category: lodging
type: expense
account: bank
for: (leave empty or select person)
alert_threshold: 90
active: true (checked)
rollover: false (unchecked)
notes: Includes mortgage, HOA fees, and property-related expenses
```

---

## Budget 2: Monthly Utilities

```
name: Monthly Utilities
amount: 500
period: monthly
start_date: 2025-01-01 00:00:00.000Z
end_date: (leave empty)
category: utilities
type: expense
account: bank
for: (leave empty or select person)
alert_threshold: 80
active: true (checked)
rollover: false (unchecked)
notes: Electric, water, internet, phone, and other utilities
```

---

## Budget 3: Monthly Food & Groceries

```
name: Monthly Food & Groceries
amount: 800
period: monthly
start_date: 2025-01-01 00:00:00.000Z
end_date: (leave empty)
category: food
type: expense
account: bank
for: (leave empty or select person)
alert_threshold: 85
active: true (checked)
rollover: true (CHECKED - unused budget carries over)
notes: Groceries, dining out, and food delivery
```

---

## Budget 4: Monthly Transportation

```
name: Monthly Transportation
amount: 600
period: monthly
start_date: 2025-01-01 00:00:00.000Z
end_date: (leave empty)
category: transportation
type: expense
account: bank
for: (leave empty or select person)
alert_threshold: 80
active: true (checked)
rollover: false (unchecked)
notes: Car payment, gas, insurance, maintenance, and parking
```

---

## Budget 5: Monthly Income Goal

```
name: Monthly Income Goal
amount: 5000
period: monthly
start_date: 2025-01-01 00:00:00.000Z
end_date: (leave empty)
category: all
type: income
account: all
for: (leave empty or select person)
alert_threshold: 75
active: true (checked)
rollover: false (unchecked)
notes: Total monthly income target from all sources
```

---

## Quick Reference Table

| Budget Name | Amount | Period | Category | Type | Account | Alert % | Rollover |
|-------------|--------|--------|----------|------|---------|---------|----------|
| Monthly Housing | $2,500 | monthly | lodging | expense | bank | 90% | No |
| Monthly Utilities | $500 | monthly | utilities | expense | bank | 80% | No |
| Monthly Food & Groceries | $800 | monthly | food | expense | bank | 85% | **Yes** |
| Monthly Transportation | $600 | monthly | transportation | expense | bank | 80% | No |
| Monthly Income Goal | $5,000 | monthly | all | income | all | 75% | No |

**Total Monthly Expenses:** $4,400  
**Monthly Income Goal:** $5,000  
**Expected Surplus:** $600

---

## Import Steps

1. Go to: https://pocketbase-production-f733.up.railway.app/_/
2. Login with your credentials
3. Navigate to: **Collections** → **budgets**
4. Click **New Record** for each budget
5. Copy/paste the values from above
6. Click **Create** for each one

**Note:** The `for` field is optional - leave empty for household-wide budgets, or select a specific person if the budget is for them.
