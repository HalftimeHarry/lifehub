# Dashboard "No Upcoming Items" Troubleshooting

If you see "No upcoming items. Add your first event!" on the dashboard, here's how to troubleshoot:

## Quick Checks

### 1. Check Browser Console

1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Look for messages starting with `[Dashboard]`
4. You should see:
   ```
   [Dashboard] Loading upcoming items from: 2025-01-15T...
   [Dashboard] Loaded appointments: 1
   [Dashboard] Loaded tasks: 0
   [Dashboard] Loaded trips: 0
   [Dashboard] Loaded shifts: 0
   ```

### 2. Verify Appointment Was Created

1. Go to `/dashboard/appointments`
2. Check if your test appointment is listed
3. Verify the start time is in the future

### 3. Check the Start Time

The appointment must have:
- **Start time in the future** (not in the past)
- **Proper date format** in PocketBase

### 4. Use the Refresh Button

1. On the dashboard, click the **"Refresh"** button (top right of Upcoming section)
2. Check browser console for any errors

## Common Issues

### Issue 1: Appointment Start Time is in the Past

**Problem:** If you set the start time incorrectly, it won't show as "upcoming"

**Solution:**
1. Go to `/dashboard/appointments`
2. Find your appointment
3. Edit it
4. Set start time to **at least 5 minutes in the future**
5. Save
6. Go back to `/dashboard` and click "Refresh"

### Issue 2: PocketBase Connection Error

**Problem:** Can't connect to PocketBase

**Solution:**
1. Check browser console for errors
2. Verify PocketBase URL in `.env`:
   ```
   VITE_POCKETBASE_URL=https://pocketbase-production-f733.up.railway.app
   ```
3. Make sure Railway PocketBase is running
4. Try accessing: `https://pocketbase-production-f733.up.railway.app/_/`

### Issue 3: Date Format Issue

**Problem:** Date not being saved correctly

**Solution:**
1. Check browser console for errors when creating appointment
2. Make sure you're using the datetime-local input correctly
3. Format should be: `YYYY-MM-DDTHH:MM`

### Issue 4: Filter Not Working

**Problem:** Data exists but filter is excluding it

**Solution:**
1. Check browser console logs
2. Look for the filter being used:
   ```
   filter: `start >= '2025-01-15T20:00:00.000Z'`
   ```
3. Compare with your appointment's start time in PocketBase

## Debugging Steps

### Step 1: Check PocketBase Directly

1. Go to: `https://pocketbase-production-f733.up.railway.app/_/`
2. Log in as admin
3. Click on **"appointments"** collection
4. Find your test appointment
5. Check the **"start"** field value
6. Make sure it's in the future

### Step 2: Check Browser Network Tab

1. Open DevTools → **Network** tab
2. Refresh the dashboard
3. Look for requests to PocketBase
4. Check if they're successful (200 status)
5. Click on the request and view the response

### Step 3: Manual Filter Test

In browser console, run:
```javascript
const now = new Date().toISOString();
console.log('Current time:', now);

// Test fetching appointments
const appointments = await pb.collection('appointments').getFullList({
  filter: `start >= '${now}'`,
  sort: 'start'
});
console.log('Found appointments:', appointments);
```

## Quick Fix: Create a Test Appointment

If nothing is working, try creating a simple test:

1. **Go to `/dashboard/appointments`**
2. **Click "Add Appointment"**
3. **Fill in:**
   - Title: `Test`
   - Start: **Tomorrow at 10:00 AM**
   - Type: `medical`
   - For: Check yourself
   - Assign to me: Check
4. **Save**
5. **Go to `/dashboard`**
6. **Click "Refresh"**

You should now see it!

## Still Not Working?

### Check These:

1. **Is the dev server running?**
   ```bash
   npm run dev
   ```

2. **Are you logged in?**
   - Check if you see your name at the top
   - If not, log in again

3. **Is PocketBase running?**
   - Visit: `https://pocketbase-production-f733.up.railway.app/_/`
   - Should show login page

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)
   - Or clear cache in DevTools

5. **Check for JavaScript errors:**
   - Open Console tab
   - Look for red error messages
   - Share them if you need help

## Expected Behavior

When working correctly, you should see:

```
┌─────────────────────────────────────────────┐
│ Upcoming                        [Refresh]   │
│ Your next events and tasks                  │
├─────────────────────────────────────────────┤
│ All (1) │ 📅 1 │ ✅ 0 │ ✈️ 0 │ 🕐 0 │    │
├─────────────────────────────────────────────┤
│                                             │
│  Test SMS Reminder          appointment    │
│  Jan 15, 2025 at 3:35 PM          🔕      │
│                                             │
└─────────────────────────────────────────────┘
```

## Console Logs to Look For

**Success:**
```
[Dashboard] Loading upcoming items from: 2025-01-15T20:00:00.000Z
[Dashboard] Loaded appointments: 1
[Dashboard] Loaded tasks: 0
[Dashboard] Loaded trips: 0
[Dashboard] Loaded shifts: 0
```

**Error:**
```
[Dashboard] Error loading upcoming items: [error message]
```

---

**Need more help?** Check the browser console and share any error messages you see!
