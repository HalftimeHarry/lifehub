# Dashboard Redesign Plan

## 🎯 Goals

1. **Bank Account Tracking** - Manual balance entry for all accounts
2. **Budget Overview** - Visual cards showing budget progress
3. **Enhanced Summaries** - Better financial overview with trends
4. **Advanced Filtering** - Forecast and analyze different scenarios

## 📊 New Dashboard Layout

### Section 1: Bank Accounts (Top)
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏦 BANK ACCOUNTS                                    [+ Add]     │
├─────────────────────────────────────────────────────────────────┤
│ Chase Checking (••1234)    Savings (••5678)    Business (••9012)│
│ $5,200.00                  $12,000.00           $3,500.00        │
│                                                                   │
│ Total Bank Balance: $20,700.00                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Manual balance entry (you update when needed)
- Show last 4 digits of account
- Color-coded by type
- Quick edit balance
- Total across all accounts

### Section 2: Budget Overview
```
┌─────────────────────────────────────────────────────────────────┐
│ 💰 BUDGETS - December 2025                         [View All]   │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│ │ 🏠 Housing       │ │ ⚡ Utilities     │ │ 🍔 Food         ││
│ │ $1,485 / $2,500  │ │ $450 / $500      │ │ $200 / $800     ││
│ │ ████████░░ 59%   │ │ ██████████ 90%   │ │ ███░░░░░░░ 25%  ││
│ │ ✅ $1,015 left   │ │ ⚠️ $50 left      │ │ ✅ $600 left    ││
│ │ 15 days left     │ │ 15 days left     │ │ 15 days left    ││
│ └──────────────────┘ └──────────────────┘ └──────────────────┘│
│ ┌──────────────────┐ ┌──────────────────┐                      │
│ │ 🚗 Transport     │ │ 💵 Income Goal   │                      │
│ │ $0 / $600        │ │ $17,215 / $5,000 │                      │
│ │ ░░░░░░░░░░ 0%    │ │ ██████████ 344%  │                      │
│ │ ✅ $600 left     │ │ 🎉 +$12,215      │                      │
│ │ 15 days left     │ │ 15 days left     │                      │
│ └──────────────────┘ └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Progress bars with color coding
  - Green: 0-75% (on track)
  - Yellow: 76-90% (warning)
  - Red: 91-100%+ (over budget)
- Amount remaining
- Days left in period
- Click to see detailed breakdown

### Section 3: Financial Summary (Enhanced)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📈 FINANCIAL SUMMARY                                            │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│ │ 💰 Total Income  │ │ 💸 Total Expenses│ │ 💵 Net Total    ││
│ │                  │ │                  │ │                  ││
│ │   $17,215.00     │ │   $6,635.00      │ │   $10,580.00    ││
│ │   📈 +15% vs     │ │   📉 -5% vs      │ │   🎯 Surplus    ││
│ │   last month     │ │   last month     │ │                  ││
│ │                  │ │                  │ │                  ││
│ │ [View Details]   │ │ [View Details]   │ │ [Forecast]      ││
│ └──────────────────┘ └──────────────────┘ └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Trend indicators (vs last month)
- Click to see detailed breakdown
- Forecast button for projections

### Section 4: Advanced Filters
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 FILTERS & FORECAST                                           │
├─────────────────────────────────────────────────────────────────┤
│ [Type ▼] [Category ▼] [Person ▼] [Date Range ▼] [Budget ▼]    │
│                                                                   │
│ [Status ▼] [Recurring Only] [Subcategory ▼] [Vendor ▼]         │
│                                                                   │
│ Forecast Mode: [Off] [Next Month] [Next Quarter] [Next Year]   │
└─────────────────────────────────────────────────────────────────┘
```

**New Filters:**
- Budget filter
- Status filter
- Recurring only toggle
- Subcategory filter
- Vendor filter
- Forecast mode

## 🗄️ New Collections

### 1. Bank Accounts Collection
```json
{
  "name": "bank_accounts",
  "fields": {
    "name": "Chase Checking",
    "type": "checking|savings|business|credit_card|investment|cash",
    "balance": 5200.00,
    "institution": "Chase Bank",
    "last_four": "1234",
    "active": true,
    "display_order": 1,
    "notes": "Primary checking account"
  }
}
```

## 🎨 UI Components to Create

### 1. BankAccountCard.svelte
- Display account name, type, balance
- Quick edit balance button
- Color-coded by type
- Show last 4 digits

### 2. BudgetCard.svelte
- Budget name and icon
- Progress bar with color coding
- Amount spent / total
- Amount remaining
- Days left in period
- Alert indicators

### 3. EnhancedSummaryCard.svelte
- Current total
- Trend indicator (vs last period)
- Percentage change
- Click to expand details

### 4. ForecastPanel.svelte
- Select forecast period
- Show projected income/expenses
- Based on recurring items
- Adjustable assumptions

## 📋 Implementation Steps

### Phase 1: Bank Accounts
1. ✅ Create bank_accounts collection
2. Create BankAccountCard component
3. Add bank accounts section to dashboard
4. Create "Add/Edit Bank Account" modal
5. Load and display bank accounts

### Phase 2: Budget Cards
1. Create BudgetCard component
2. Calculate budget usage from expenses
3. Add budget section to dashboard
4. Add click-through to budget details
5. Add alert indicators

### Phase 3: Enhanced Summaries
1. Update summary cards with trends
2. Add comparison to previous period
3. Add click-through to detailed breakdown
4. Add forecast button

### Phase 4: Advanced Filtering
1. Add budget filter dropdown
2. Add status filter dropdown
3. Add recurring toggle
4. Add subcategory filter
5. Add vendor filter
6. Add forecast mode selector

## 🎯 Sample Data

### Bank Accounts
```javascript
[
  { name: "Chase Checking", type: "checking", balance: 5200, last_four: "1234" },
  { name: "Savings Account", type: "savings", balance: 12000, last_four: "5678" },
  { name: "Business Account", type: "business", balance: 3500, last_four: "9012" }
]
```

### Budget Progress (Calculated)
```javascript
{
  housing: { spent: 1485, budget: 2500, percent: 59, status: "good" },
  utilities: { spent: 450, budget: 500, percent: 90, status: "warning" },
  food: { spent: 200, budget: 800, percent: 25, status: "good" },
  transportation: { spent: 0, budget: 600, percent: 0, status: "good" },
  income: { earned: 17215, goal: 5000, percent: 344, status: "excellent" }
}
```

## 🚀 Next Actions

Would you like me to:

**A)** Start with Bank Accounts (create collection + UI)
**B)** Start with Budget Cards (show budget progress)
**C)** Start with Enhanced Filters (add more filter options)
**D)** Do all of the above in sequence

Let me know which to prioritize!
