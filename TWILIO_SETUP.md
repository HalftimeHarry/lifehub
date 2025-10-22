# Twilio SMS Setup Guide

This guide will help you set up Twilio for SMS reminders in LifeHub.

## Step 1: Get Your Twilio Credentials

**📖 Detailed Guide:** See [TWILIO_CREDENTIALS_GUIDE.md](./TWILIO_CREDENTIALS_GUIDE.md) for step-by-step instructions with screenshots.

**Quick Summary:**

1. **Log in to Twilio Console**:
   - Visit: [https://console.twilio.com](https://console.twilio.com)
   - Sign in with your Twilio account

2. **Find Your Account SID and Auth Token**:
   - On the dashboard, look for **"Account Info"** box on the right
   - **Account SID**: Starts with `AC...` (copy it)
   - **Auth Token**: Click "Show" to reveal it, then copy
   - Both are in the same box on the main dashboard

3. **Get Your Twilio Phone Number**:
   - Left sidebar: **Phone Numbers** → **Manage** → **Active numbers**
   - Copy your phone number (format: `+1234567890`)
   - **Don't have one?** Click **"Buy a number"** ($1.15/month)
   - Make sure it has **SMS capability** enabled

## Step 2: Add Credentials to .env

Update your `.env` file with your Twilio credentials:

```env
# Twilio Configuration (for SMS notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM=+1234567890
```

Replace:
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your Account SID
- `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your Auth Token
- `+1234567890` with your Twilio phone number

## Step 3: Configure Netlify Environment Variables

For production (Netlify), add the same variables:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM`
   - `VITE_POCKETBASE_URL` (your Railway URL)
   - `NOTIFY_TIMEZONE` (e.g., `America/Los_Angeles`)
   - `REMINDER_LOOKAHEAD_MIN` (e.g., `90`)

## Step 4: How SMS Reminders Work

### Automatic Reminders

The system automatically sends SMS reminders based on:

1. **Scheduled Function**: Runs every 10 minutes on Netlify
2. **Lookahead Window**: Checks for events in the next 90 minutes (configurable)
3. **Notification Offset**: Each item has a `notify_offset_minutes` field (default: 30 minutes before)

### Collections with SMS Support

- **Appointments**: Reminds before `start` time
- **Shifts**: Reminds before `start` time
- **Trips**: Reminds before `depart_at` time
- **Tasks**: Reminds before `due` time

### Phone Number Requirements

For SMS reminders to work, each item must have:
1. A `phone` field with a valid phone number (E.164 format: `+1234567890`)
2. A start/due date in the future
3. A `notify_offset_minutes` value (how many minutes before to send reminder)

## Step 5: Testing SMS Reminders

### Test Locally

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Create a test appointment**:
   - Go to `/dashboard/appointments`
   - Click "Add Appointment"
   - Set start time to 35 minutes from now
   - Add a phone number (your test number)
   - Set notify offset to 30 minutes
   - Save

3. **Trigger the scheduler manually**:
   ```bash
   netlify functions:invoke scheduler
   ```

4. **Check your phone** for the SMS reminder

### Test in Production

1. **Deploy to Netlify** (with environment variables set)
2. **Create a test event** with your phone number
3. **Wait for the scheduled function** to run (every 10 minutes)
4. **Check your phone** for the SMS

## Step 6: SMS Message Format

The SMS messages are formatted as:

```
Reminder: [Title]
When: [Date/Time]
[Additional details if available]
```

Example:
```
Reminder: Doctor Appointment
When: Jan 15, 2025 at 2:00 PM
Location: 123 Main St
```

## Step 7: Dashboard SMS Controls

### Quick SMS Toggle (Coming Soon)

The dashboard will have:
- **Tabs** to filter upcoming items (All, Appointments, Tasks, Trips, Shifts)
- **SMS Toggle** for each item to enable/disable reminders
- **Edit Reminder Time** to adjust when the SMS is sent

### Manual SMS Send

You can also send immediate SMS reminders:
1. Click the SMS icon next to any upcoming item
2. Confirm the send
3. SMS will be sent immediately

## Troubleshooting

### SMS Not Sending

**Check Twilio credentials**:
- Verify Account SID starts with `AC`
- Verify Auth Token is correct
- Verify phone number is in E.164 format (`+1234567890`)

**Check Netlify logs**:
```bash
netlify functions:log scheduler
```

**Check phone number format**:
- Must include country code: `+1` for US
- No spaces, dashes, or parentheses
- Example: `+15551234567`

### SMS Sending to Wrong Number

- Check the `phone` field in PocketBase
- Verify the phone number is correct
- Update the record if needed

### SMS Not Received

- Check your phone can receive SMS
- Verify the number is not blocked
- Check Twilio console for delivery status
- Some carriers may block automated messages

### Scheduler Not Running

**Check Netlify function**:
- Go to Netlify dashboard → Functions
- Verify `scheduler` function is deployed
- Check function logs for errors

**Check schedule configuration**:
- File: `netlify.toml`
- Should have: `schedule = "*/10 * * * *"` (every 10 minutes)

## Cost Estimates

### Twilio Pricing (US)

- **SMS**: $0.0079 per message sent
- **Phone Number**: $1.15/month for a local number
- **Free Trial**: $15.50 credit for testing

### Example Monthly Cost

- 100 SMS reminders/month = $0.79
- Phone number = $1.15
- **Total**: ~$2/month

## Security Best Practices

1. **Never commit credentials** to git
2. **Use environment variables** for all secrets
3. **Rotate Auth Token** periodically
4. **Monitor usage** in Twilio console
5. **Set spending limits** in Twilio to avoid surprises

## Support

- **Twilio Docs**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Twilio Support**: [https://support.twilio.com](https://support.twilio.com)
- **Netlify Functions**: [https://docs.netlify.com/functions/overview/](https://docs.netlify.com/functions/overview/)

---

## Quick Reference

### Environment Variables

```env
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM=+1234567890
VITE_POCKETBASE_URL=https://your-app.railway.app

# Optional
NOTIFY_TIMEZONE=America/Los_Angeles
REMINDER_LOOKAHEAD_MIN=90
```

### Phone Number Format

```
✅ Correct: +15551234567
❌ Wrong: (555) 123-4567
❌ Wrong: 555-123-4567
❌ Wrong: 5551234567
```

### Testing Commands

```bash
# Test locally
netlify dev
netlify functions:invoke scheduler

# View logs
netlify functions:log scheduler

# Deploy
git push
```

---

Ready to set up SMS reminders! 📱
