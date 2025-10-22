# SMS Testing Guide

Quick guide to test SMS reminders in LifeHub.

## Prerequisites

1. ✅ Twilio account with credentials
2. ✅ Phone number added to your Twilio account
3. ✅ Environment variables set in `.env`

## Step 1: Add Your Twilio Credentials

Update `.env` with your actual Twilio credentials:

```env
TWILIO_ACCOUNT_SID=AC...your_actual_sid...
TWILIO_AUTH_TOKEN=...your_actual_token...
TWILIO_FROM=+1...your_twilio_number...
```

## Step 2: Add Your Phone Number to User Profile

1. Go to `/dashboard/people`
2. Find your user (or create one)
3. Add your phone number in E.164 format: `+15551234567`
4. Save

## Step 3: Test SMS Toggle on Dashboard

1. **Go to `/dashboard`**
2. **Create a test appointment**:
   - Go to `/dashboard/appointments`
   - Click "Add Appointment"
   - Title: "Test SMS Reminder"
   - Start time: 35 minutes from now
   - Save

3. **Return to dashboard** (`/dashboard`)
4. **Find your appointment** in the "Upcoming" section
5. **Click the bell icon** (🔔) to enable SMS reminder
   - Icon should turn green
   - Phone number is now set for this appointment

6. **Wait for the reminder**:
   - Scheduler runs every 10 minutes
   - Reminder sent 30 minutes before start time
   - Check your phone for SMS

## Step 4: Test Different Item Types

### Test Task Reminder

1. Go to `/dashboard/tasks`
2. Create task with due date 35 minutes from now
3. Go back to dashboard
4. Enable SMS reminder (bell icon)
5. Wait for SMS

### Test Trip Reminder

1. Go to `/dashboard/trips`
2. Create trip with departure 35 minutes from now
3. Go back to dashboard
4. Enable SMS reminder (bell icon)
5. Wait for SMS

### Test Shift Reminder

1. Go to `/dashboard/shifts`
2. Create shift starting 35 minutes from now
3. Go back to dashboard
4. Enable SMS reminder (bell icon)
5. Wait for SMS

## Step 5: Manual Scheduler Test (Local)

If you want to test immediately without waiting:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Run the scheduler function manually
netlify functions:invoke scheduler
```

This will:
- Check all upcoming items
- Send SMS for any items within the reminder window
- Show results in console

## Step 6: Check Twilio Console

1. Go to [https://console.twilio.com](https://console.twilio.com)
2. Navigate to **Monitor** → **Logs** → **Messaging**
3. See all SMS messages sent
4. Check delivery status
5. View any errors

## Understanding the SMS Flow

### When SMS is Sent

SMS is sent when:
1. Item has a `phone` number set
2. Item has a start/due time in the future
3. Current time is within the reminder window:
   - Default: 30 minutes before start time
   - Configurable via `notify_offset_minutes`

### SMS Message Format

```
Reminder: [Title]
When: [Date/Time]
[Additional details]
```

Example:
```
Reminder: Doctor Appointment
When: Jan 15, 2025 at 2:00 PM
Location: Main Street Clinic
```

## Dashboard Features

### Tabs

- **All**: Shows all upcoming items sorted by time
- **Appointments**: Only appointments
- **Tasks**: Only tasks
- **Trips**: Only trips
- **Shifts**: Only shifts

Each tab shows the count of items.

### SMS Toggle

- **Gray bell icon** (🔕): SMS reminder OFF
- **Green bell icon** (🔔): SMS reminder ON
- Click to toggle on/off
- Automatically uses your phone number from user profile

### Item Display

Each item shows:
- Title
- Date/time
- Type badge (for "All" tab)
- Additional details (location, destination, etc.)
- SMS toggle button

## Troubleshooting

### Bell Icon Not Showing

- Refresh the page
- Check browser console for errors
- Verify dashboard is loading data

### SMS Not Sending

**Check phone number format**:
```
✅ Correct: +15551234567
❌ Wrong: (555) 123-4567
❌ Wrong: 5551234567
```

**Check Twilio credentials**:
- Account SID starts with `AC`
- Auth Token is correct
- Phone number matches Twilio console

**Check timing**:
- Item must be 30-40 minutes in the future
- Scheduler runs every 10 minutes
- SMS sent 30 minutes before start time

### Toggle Not Working

- Check browser console for errors
- Verify PocketBase connection
- Check user has phone number in profile
- Try refreshing the page

## Production Testing

### Deploy to Netlify

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Add SMS reminders to dashboard"
   git push
   ```

2. **Add environment variables in Netlify**:
   - Go to Site settings → Environment variables
   - Add all Twilio variables
   - Redeploy if needed

3. **Test on production**:
   - Create test appointment
   - Enable SMS reminder
   - Wait for scheduled function to run
   - Check phone for SMS

### Monitor in Production

**Netlify Functions Log**:
```bash
netlify functions:log scheduler
```

**Or in Netlify dashboard**:
- Go to Functions
- Click on `scheduler`
- View logs

## Cost Tracking

### Monitor Twilio Usage

1. Go to Twilio Console
2. Navigate to **Usage** → **Messaging**
3. See SMS count and cost
4. Set up alerts for spending limits

### Estimated Costs

- **SMS**: $0.0079 per message
- **10 reminders/day**: ~$2.37/month
- **50 reminders/day**: ~$11.85/month

## Next Steps

1. ✅ Add your Twilio credentials to `.env`
2. ✅ Add your phone number to user profile
3. ✅ Create a test appointment 35 minutes from now
4. ✅ Enable SMS reminder on dashboard
5. ✅ Wait for SMS (or trigger manually)
6. ✅ Check Twilio console for delivery status

---

Happy testing! 📱✨
