# SMS Reminder Implementation

This document explains how the SMS reminder system works in LifeHub.

## Overview

The SMS reminder system automatically sends text message reminders for upcoming appointments, tasks, trips, and shifts. It uses Twilio for SMS delivery and Netlify Functions for serverless execution.

## Architecture

```
┌─────────────────┐
│   Dashboard     │ User toggles SMS reminder
│   (Frontend)    │ Updates phone field in PocketBase
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PocketBase    │ Stores items with:
│   (Database)    │ - phone (recipient number)
│                 │ - notify_offset_minutes (when to send)
│                 │ - notified_at (tracking)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ check-reminders │ Runs every 10 minutes
│ (Netlify Fn)    │ Checks for items needing reminders
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   send-sms      │ Sends SMS via Twilio
│ (Netlify Fn)    │ Marks item as notified
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Twilio      │ Delivers SMS to user
│   (SMS API)     │
└─────────────────┘
```

## Components

### 1. Frontend (Dashboard)

**File:** `src/routes/(app)/dashboard/+page.svelte`

The dashboard displays upcoming items with SMS reminder toggles:

```typescript
async function toggleSMSReminder(collection: string, id: string, currentPhone: string | null) {
  try {
    const newPhone = currentPhone ? null : $currentUser?.phone || '';
    await pb.collection(collection).update(id, { phone: newPhone });
    await loadUpcoming();
  } catch (error) {
    console.error('Error toggling SMS reminder:', error);
    alert('Failed to toggle SMS reminder');
  }
}
```

**How it works:**
- User clicks the bell icon next to an item
- If phone is empty, it sets it to the user's phone number (enables reminder)
- If phone is set, it clears it (disables reminder)
- The phone field determines if a reminder should be sent

### 2. Database Schema (PocketBase)

Each collection (appointments, tasks, trips, shifts) has these fields:

| Field | Type | Purpose |
|-------|------|---------|
| `phone` | text | Recipient phone number (E.164 format: +1234567890) |
| `notify_offset_minutes` | number | Minutes before event to send reminder (default: 60) |
| `notified_at` | date | Timestamp when reminder was sent (prevents duplicates) |

**Example:**
- Appointment at 3:00 PM
- `notify_offset_minutes` = 60
- Reminder sent at 2:00 PM (60 minutes before)

### 3. Check Reminders Function

**File:** `netlify/functions/check-reminders.ts`

**Trigger:** Runs every 10 minutes (configured in `netlify.toml`)

**Process:**
1. Queries PocketBase for items where:
   - Time is within the next 90 minutes (configurable via `REMINDER_LOOKAHEAD_MIN`)
   - `phone` field is not empty
   - `notified_at` is empty (not yet notified)
2. For each item, calculates notification time:
   ```
   notify_time = item_time - notify_offset_minutes
   ```
3. If `notify_time <= now`, sends SMS
4. Updates `notified_at` to prevent duplicate sends

**Environment Variables:**
- `VITE_POCKETBASE_URL` - PocketBase API URL
- `TWILIO_ACCOUNT_SID` - Twilio account identifier
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_FROM` - Twilio phone number
- `NOTIFY_TIMEZONE` - Timezone for formatting times (default: America/Los_Angeles)
- `REMINDER_LOOKAHEAD_MIN` - How far ahead to check (default: 90 minutes)

### 4. Send SMS Function

**File:** `netlify/functions/send-sms.ts`

**Purpose:** Sends individual SMS messages via Twilio

**API:**
```bash
POST /.netlify/functions/send-sms
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Reminder: Doctor appointment at 3:00 PM"
}
```

**Response:**
```json
{
  "success": true,
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

## Configuration

### Environment Variables

Add these to your `.env` file and Netlify environment:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM=+1234567890

# Notification Settings
NOTIFY_TIMEZONE=America/Los_Angeles
REMINDER_LOOKAHEAD_MIN=90
```

### Netlify Scheduled Function

**File:** `netlify.toml`

```toml
[[scheduled.functions]]
  name = "check-reminders"
  cron = "*/10 * * * *"  # Every 10 minutes
```

**Cron Schedule Options:**
- `*/10 * * * *` - Every 10 minutes
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours

## Testing

### Local Testing

1. **Start Netlify Dev:**
   ```bash
   netlify dev
   ```

2. **Run test script:**
   ```bash
   ./test-sms.sh
   ```

3. **Manual test:**
   ```bash
   # Test send-sms function
   curl -X POST http://localhost:8888/.netlify/functions/send-sms \
     -H "Content-Type: application/json" \
     -d '{"to": "+1234567890", "message": "Test message"}'

   # Test check-reminders function
   curl -X POST http://localhost:8888/.netlify/functions/check-reminders
   ```

### Production Testing

1. **Deploy to Netlify:**
   ```bash
   git push origin main
   ```

2. **Check Netlify Functions logs:**
   - Go to Netlify Dashboard
   - Click on your site
   - Go to "Functions" tab
   - Click on "check-reminders"
   - View logs

3. **Manually trigger:**
   ```bash
   curl -X POST https://your-site.netlify.app/.netlify/functions/check-reminders
   ```

## Usage

### For Users

1. **Enable SMS reminder:**
   - Go to Dashboard
   - Find an upcoming item
   - Click the bell icon (🔔)
   - Icon turns green when enabled

2. **Disable SMS reminder:**
   - Click the green bell icon
   - Icon turns gray when disabled

3. **Receive reminder:**
   - SMS sent automatically based on `notify_offset_minutes`
   - Default: 60 minutes before event
   - Message format: "Reminder: [Title] at [Time]"

### For Developers

**Add SMS to new collection:**

1. Add fields to PocketBase collection:
   ```javascript
   phone: text (optional)
   notify_offset_minutes: number (optional, default: 60)
   notified_at: date (optional)
   ```

2. Add to `check-reminders.ts`:
   ```typescript
   // Check your_collection
   try {
     const items = await pb.collection('your_collection').getFullList({
       filter: `time_field >= "${nowStr}" && time_field <= "${lookaheadStr}" && phone != "" && notified_at = ""`
     });
     
     items.forEach(item => {
       const notifyTime = new Date(new Date(item.time_field).getTime() - (item.notify_offset_minutes || 60) * 60000);
       if (notifyTime <= now) {
         itemsToNotify.push({
           id: item.id,
           title: item.title,
           phone: item.phone,
           notify_offset_minutes: item.notify_offset_minutes || 60,
           notified_at: item.notified_at,
           collection: 'your_collection',
           time: item.time_field
         });
       }
     });
   } catch (err) {
     console.error('[Reminders] Error fetching your_collection:', err);
   }
   ```

## Troubleshooting

### SMS not sending

1. **Check Twilio credentials:**
   ```bash
   # In Netlify Dashboard > Site settings > Environment variables
   # Verify all three are set:
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_FROM
   ```

2. **Check phone number format:**
   - Must be E.164 format: `+1234567890`
   - Include country code
   - No spaces, dashes, or parentheses

3. **Check Twilio Trial account:**
   - Trial accounts can only send to verified numbers
   - Verify recipient number in Twilio Console
   - Or upgrade to paid account

4. **Check function logs:**
   ```bash
   # Netlify Dashboard > Functions > check-reminders > Logs
   ```

### Reminders sent too early/late

1. **Check timezone:**
   ```env
   NOTIFY_TIMEZONE=America/Los_Angeles
   ```

2. **Check notify_offset_minutes:**
   - Default is 60 minutes
   - Adjust per item in PocketBase

3. **Check cron schedule:**
   - Runs every 10 minutes
   - May send up to 10 minutes after calculated time

### Duplicate reminders

- Check `notified_at` field is being updated
- Check for multiple scheduled functions running
- Check Netlify function logs for errors

## Cost Considerations

### Twilio Pricing (as of 2024)

- **SMS (US):** $0.0079 per message
- **Trial Account:** $15.50 credit (free)
- **Example:** 100 reminders/month = $0.79

### Netlify Pricing

- **Functions:** 125,000 requests/month (free tier)
- **Scheduled Functions:** Included in free tier
- **Example:** 4,320 checks/month (every 10 min) = well within free tier

## Security

1. **Never commit credentials:**
   - Use `.env` file (gitignored)
   - Set in Netlify environment variables

2. **Validate phone numbers:**
   - E.164 format validation in send-sms function
   - Prevents invalid numbers

3. **Rate limiting:**
   - Twilio has built-in rate limits
   - Consider adding application-level limits for production

4. **Authentication:**
   - Functions are public but stateless
   - No sensitive data exposed
   - Consider adding API key for production

## Future Enhancements

- [ ] Custom reminder messages per item
- [ ] Multiple reminders per item (e.g., 24h and 1h before)
- [ ] SMS confirmation/reply handling
- [ ] User preference for reminder timing
- [ ] SMS delivery status tracking
- [ ] Retry failed SMS sends
- [ ] Support for international numbers
- [ ] Group SMS for shared items
