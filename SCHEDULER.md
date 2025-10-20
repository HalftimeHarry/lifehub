# Scheduler Function Documentation

The scheduler function (`netlify/functions/scheduler.ts`) runs every 10 minutes on Netlify and sends SMS reminders for upcoming events.

## How It Works

### 1. Trigger Schedule

- Runs every 10 minutes via Netlify scheduled functions
- Configured in `netlify.toml`: `cron = "*/10 * * * *"`

### 2. Reminder Logic

For each collection (appointments, shifts, trips, tasks):

1. **Query upcoming items** within the lookahead window (default: 90 minutes)
2. **Check notification window** using `inWindow()` function
3. **Send SMS** if the item is in the 10-minute notification window
4. **Mark as notified** by setting `notified_at` timestamp

### 3. Notification Window

The `inWindow()` function determines if a reminder should be sent:

```typescript
function inWindow(startISO: string, offsetMin: number) {
	const now = dayjs();
	const target = dayjs(startISO).subtract(offsetMin, 'minute');
	// Trigger when target time is within the last 10 minutes window
	return now.diff(target, 'minute') >= 0 && now.diff(target, 'minute') < 10;
}
```

**Example:**

- Event starts at 3:00 PM
- `notify_offset_minutes` = 60
- Target notification time: 2:00 PM
- Reminder sent when current time is between 2:00 PM and 2:10 PM

### 4. SMS Message Format

```
[LifeHub] {title} at {formatted_date_time}
```

Example:

```
[LifeHub] Doctor Appointment at Mon, Jan 15 2:00 PM
```

## Collections Processed

| Collection   | Start Field | Phone Field | Offset Field            | Default Offset |
| ------------ | ----------- | ----------- | ----------------------- | -------------- |
| appointments | `start`     | `phone`     | `notify_offset_minutes` | 60 min         |
| shifts       | `start`     | `phone`     | `notify_offset_minutes` | 120 min        |
| trips        | `depart_at` | `phone`     | `notify_offset_minutes` | 180 min        |
| tasks        | `due`       | `phone`     | `notify_offset_minutes` | 30 min         |

## Environment Variables

Required in Netlify dashboard (Site settings → Environment variables):

```bash
# PocketBase
VITE_POCKETBASE_URL=https://your-pocketbase-host.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM=+1234567890

# Notification Settings
NOTIFY_TIMEZONE=America/Los_Angeles
REMINDER_LOOKAHEAD_MIN=90
```

### Variable Details

- **VITE_POCKETBASE_URL**: Your PocketBase instance URL
- **TWILIO_ACCOUNT_SID**: Twilio account SID
- **TWILIO_AUTH_TOKEN**: Twilio auth token
- **TWILIO_FROM**: Your Twilio phone number (E.164 format)
- **NOTIFY_TIMEZONE**: Timezone for formatting times in SMS (default: America/Los_Angeles)
- **REMINDER_LOOKAHEAD_MIN**: How far ahead to query for upcoming items (default: 90 minutes)

## Preventing Duplicate Notifications

The function prevents duplicate notifications by:

1. **Filtering out already notified items**: `notified_at = null` in the query
2. **10-minute window**: Only sends if within the 10-minute window after target time
3. **Updating notified_at**: Marks item as notified immediately after sending

## Error Handling

- Each collection is processed independently
- If one collection fails, others continue processing
- Errors are logged but don't stop the function
- Returns 200 with list of sent notifications on success
- Returns 500 with error details on critical failure

## Response Format

### Success

```json
{
	"ok": true,
	"sent": ["appointments:abc123", "shifts:def456", "tasks:ghi789"],
	"timestamp": "2024-01-15T14:00:00.000Z"
}
```

### Error

```json
{
	"error": "Scheduler failed",
	"message": "Connection timeout"
}
```

## Testing Locally

You can test the scheduler function locally using Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run function locally
netlify functions:invoke scheduler
```

Or create a test event in PocketBase:

1. Create an appointment with `start` time = now + 60 minutes
2. Set `notify_offset_minutes` = 60
3. Add your phone number to `phone` field
4. Wait for the next 10-minute window
5. Check if SMS is received

## Deployment

The function is automatically deployed with your Netlify site:

1. Push code to GitHub
2. Netlify builds and deploys
3. Scheduled function starts running every 10 minutes
4. Check Netlify Functions logs for execution details

## Monitoring

View function logs in Netlify dashboard:

1. Go to **Functions** tab
2. Click on **scheduler**
3. View **Function log** for execution history
4. Check for errors or sent notifications

## Customization

### Change Notification Window

Modify the `inWindow()` function to adjust the 10-minute window:

```typescript
// Change to 5-minute window
return now.diff(target, 'minute') >= 0 && now.diff(target, 'minute') < 5;
```

### Add More Collections

Add to the `collections` array:

```typescript
{
  name: 'your_collection',
  start: 'start_field',
  phone: 'phone_field',
  offset: 'offset_field'
}
```

### Customize SMS Message

Modify the message format:

```typescript
const body = `🔔 Reminder: ${title} starts at ${when}. Location: ${item.location || 'TBD'}`;
```

## Troubleshooting

### No SMS received

- Check Twilio credentials are correct
- Verify phone number is in E.164 format (+1234567890)
- Check `notified_at` is null in PocketBase
- Verify event time is within notification window
- Check Netlify function logs for errors

### Duplicate notifications

- Ensure `notified_at` is being updated
- Check if multiple scheduler instances are running
- Verify 10-minute window logic is working

### Function not running

- Check `netlify.toml` cron configuration
- Verify function is deployed (check Netlify dashboard)
- Check Netlify build logs for errors
- Ensure environment variables are set
