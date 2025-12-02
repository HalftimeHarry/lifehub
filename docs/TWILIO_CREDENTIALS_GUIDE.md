# Getting Your Twilio Credentials - Step by Step

This guide shows you exactly where to find your Twilio credentials.

## What You Need

You need 3 things from Twilio:
1. **Account SID** - Your account identifier (starts with `AC`)
2. **Auth Token** - Your secret authentication token
3. **Phone Number** - Your Twilio phone number (format: `+1234567890`)

---

## Step 1: Log In to Twilio

1. Go to: [https://console.twilio.com](https://console.twilio.com)
2. Sign in with your Twilio account
3. You'll land on the **Console Dashboard**

---

## Step 2: Find Your Account SID and Auth Token

### On the Dashboard (Main Page)

When you first log in, you'll see a section called **"Account Info"** on the right side:

```
┌─────────────────────────────────────┐
│         Account Info                │
├─────────────────────────────────────┤
│                                     │
│  ACCOUNT SID                        │
│  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │
│  [Copy icon]                        │
│                                     │
│  AUTH TOKEN                         │
│  ••••••••••••••••••••••••••••••••  │
│  [Show] [Copy icon]                 │
│                                     │
└─────────────────────────────────────┘
```

### To Get Account SID:
1. Look for **"ACCOUNT SID"** in the Account Info box
2. It starts with `AC` followed by 32 characters
3. Click the **copy icon** to copy it
4. Example: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (32 characters after AC)

### To Get Auth Token:
1. Look for **"AUTH TOKEN"** in the Account Info box
2. It's hidden by default (shows as dots: ••••••••)
3. Click the **"Show"** button to reveal it
4. Click the **copy icon** to copy it
5. Example: `1234567890abcdef1234567890abcdef`

**⚠️ Important:** Keep your Auth Token secret! Don't share it or commit it to git.

---

## Step 3: Get Your Twilio Phone Number

### If You Already Have a Phone Number:

1. In the left sidebar, click **"Phone Numbers"**
2. Click **"Manage"**
3. Click **"Active numbers"**
4. You'll see a list of your phone numbers

```
┌─────────────────────────────────────────────┐
│  Active Numbers                             │
├─────────────────────────────────────────────┤
│                                             │
│  +1 555 123 4567                           │
│  Voice, SMS                                 │
│  [Manage]                                   │
│                                             │
└─────────────────────────────────────────────┘
```

5. Copy the phone number (including the `+1`)
6. Remove any spaces or dashes
7. Format: `+15551234567`

### If You DON'T Have a Phone Number Yet:

1. In the left sidebar, click **"Phone Numbers"**
2. Click **"Manage"**
3. Click **"Buy a number"**
4. You'll see the number search page

```
┌─────────────────────────────────────────────┐
│  Buy a Number                               │
├─────────────────────────────────────────────┤
│                                             │
│  Country: United States                     │
│  Number or Location: [Search box]           │
│                                             │
│  Capabilities:                              │
│  ☑ Voice                                    │
│  ☑ SMS                                      │
│  ☐ MMS                                      │
│                                             │
│  [Search]                                   │
│                                             │
└─────────────────────────────────────────────┘
```

5. Make sure **"SMS"** is checked (required for text messages)
6. Click **"Search"**
7. You'll see available numbers:

```
┌─────────────────────────────────────────────┐
│  Available Numbers                          │
├─────────────────────────────────────────────┤
│                                             │
│  +1 (555) 123-4567                         │
│  Voice, SMS                                 │
│  $1.15/month                                │
│  [Buy]                                      │
│                                             │
│  +1 (555) 234-5678                         │
│  Voice, SMS                                 │
│  $1.15/month                                │
│  [Buy]                                      │
│                                             │
└─────────────────────────────────────────────┘
```

8. Click **"Buy"** on any number you like
9. Confirm the purchase
10. Copy your new number (format: `+15551234567`)

**💰 Cost:** $1.15/month per phone number

---

## Step 4: Add Credentials to Your .env File

Now that you have all 3 pieces of information, add them to your `.env` file:

```env
# Twilio Configuration (for SMS notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM=+15551234567
```

Replace:
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Account SID
- `your_auth_token_here` with your actual Auth Token
- `+15551234567` with your actual Twilio phone number

**⚠️ Important:** 
- No spaces around the `=` sign
- No quotes around the values
- Phone number must include `+1` (for US numbers)
- No spaces or dashes in phone number

---

## Step 5: Verify Your Credentials

### Quick Check:

1. **Account SID**:
   - ✅ Starts with `AC`
   - ✅ Exactly 34 characters long
   - ✅ Only letters and numbers

2. **Auth Token**:
   - ✅ Exactly 32 characters long
   - ✅ Only letters and numbers

3. **Phone Number**:
   - ✅ Starts with `+1` (for US)
   - ✅ Total of 12 characters (including `+1`)
   - ✅ No spaces, dashes, or parentheses
   - ✅ Example: `+15551234567`

### Test Your Credentials:

Create a simple test file `test-twilio.js`:

```javascript
const twilio = require('twilio');

const accountSid = 'AC...your_sid...';
const authToken = '...your_token...';
const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: 'Test message from LifeHub!',
    from: '+15551234567', // Your Twilio number
    to: '+15559876543'    // Your personal phone number
  })
  .then(message => console.log('✅ SMS sent! Message SID:', message.sid))
  .catch(error => console.error('❌ Error:', error.message));
```

Run it:
```bash
node test-twilio.js
```

If successful, you'll see:
```
✅ SMS sent! Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

And you'll receive a text message!

---

## Common Issues

### "Authentication Error" or "Invalid Credentials"

**Problem:** Account SID or Auth Token is wrong

**Solution:**
1. Go back to Twilio Console
2. Double-check you copied the full Account SID (starts with `AC`)
3. Click "Show" on Auth Token and copy again
4. Make sure no extra spaces were copied

### "Invalid 'From' Phone Number"

**Problem:** Phone number format is wrong

**Solution:**
1. Must include country code: `+1` for US
2. No spaces: `+15551234567` ✅ not `+1 555 123 4567` ❌
3. No dashes: `+15551234567` ✅ not `+1-555-123-4567` ❌
4. No parentheses: `+15551234567` ✅ not `+1(555)123-4567` ❌

### "The number you are trying to message is not verified"

**Problem:** You're on a Twilio trial account

**Solution:**
1. Go to Twilio Console
2. Click **"Phone Numbers"** → **"Manage"** → **"Verified Caller IDs"**
3. Click **"Add a new Caller ID"**
4. Enter your personal phone number
5. Verify it with the code Twilio sends you
6. Now you can send SMS to that number

**Or:** Upgrade your Twilio account (removes this restriction)

### "Insufficient funds"

**Problem:** Your Twilio account balance is $0

**Solution:**
1. Go to Twilio Console
2. Click **"Billing"** in the left sidebar
3. Add funds or add a credit card
4. Trial accounts get $15.50 free credit

---

## Visual Reference

### Where Everything Is Located:

```
Twilio Console
├── Dashboard (Home)
│   └── Account Info (right side)
│       ├── Account SID ← Copy this
│       └── Auth Token ← Click "Show", then copy
│
├── Phone Numbers (left sidebar)
│   └── Manage
│       ├── Active numbers ← Your phone numbers
│       └── Buy a number ← Get a new number
│
└── Billing (left sidebar)
    └── Add funds or credit card
```

---

## Quick Copy Template

Once you have your credentials, copy this template and fill it in:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC________________________________
TWILIO_AUTH_TOKEN=________________________________
TWILIO_FROM=+1__________

# Example (DO NOT USE THESE - they're placeholders):
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token_here
# TWILIO_FROM=+15551234567
```

---

## Security Reminders

1. ✅ **DO** keep your Auth Token secret
2. ✅ **DO** use environment variables
3. ✅ **DO** add `.env` to `.gitignore`
4. ❌ **DON'T** commit credentials to git
5. ❌ **DON'T** share your Auth Token
6. ❌ **DON'T** post credentials in screenshots

---

## Next Steps

Once you have your credentials in `.env`:

1. ✅ Restart your dev server: `npm run dev`
2. ✅ Add your phone number in `/dashboard/people`
3. ✅ Create a test appointment
4. ✅ Enable SMS reminder on dashboard
5. ✅ Wait for the text message!

---

## Need Help?

- **Twilio Support**: [https://support.twilio.com](https://support.twilio.com)
- **Twilio Docs**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Console**: [https://console.twilio.com](https://console.twilio.com)

---

**You're all set!** 🎉📱
