# Bank Accounts Edit Feature

Quick update functionality for bank account balances.

## How It Works

### 1. View Accounts
- On the expenses dashboard, click the **Bank Accounts** summary card
- Modal opens showing all accounts with their current balances

### 2. Edit Balance
- Each account card has a **pencil icon** (✏️) button on the right
- Click the pencil icon to open the edit modal

### 3. Update Balance
- Edit modal shows:
  - Account name and details
  - Current balance (highlighted)
  - Input field for new balance
- Enter the new balance amount
- Click **Save Changes**

### 4. Confirmation
- Success toast notification appears
- Modal closes automatically
- Account list refreshes with new balance
- Summary card updates with new total

## Features

✅ **Quick Access** - Edit directly from the accounts modal  
✅ **Visual Feedback** - Current balance shown for reference  
✅ **Validation** - Ensures valid number input  
✅ **Real-time Update** - Changes reflect immediately  
✅ **Error Handling** - Shows error messages if update fails  
✅ **Toast Notifications** - Success/error feedback

## User Flow

```
Dashboard
  ↓ Click "Bank Accounts" card
Bank Accounts Modal
  ↓ Click pencil icon on any account
Edit Account Modal
  ↓ Enter new balance
  ↓ Click "Save Changes"
Success Toast + Modal closes
  ↓ Data refreshes
Updated balance shown in modal & summary card
```

## Components

- **BankAccountsSummaryCard** - Main summary card on dashboard
- **BankAccountsModal** - Lists all accounts with edit buttons
- **EditBankAccountModal** - Edit form for updating balance

## API

Updates are saved to PocketBase:
```javascript
pb.collection('bank_accounts').update(accountId, {
  balance: newBalance
});
```

## Example Use Cases

1. **Daily Balance Check** - Update after checking bank app
2. **Transaction Recording** - Adjust after making purchases
3. **Reconciliation** - Match with bank statements
4. **Quick Corrections** - Fix typos or errors

## Notes

- Only the balance can be edited (name, type, institution are fixed)
- Changes are saved immediately to the database
- All users see the updated balance
- No undo feature - be careful when updating
