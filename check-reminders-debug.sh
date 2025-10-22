#!/bin/bash

echo "=== Checking Reminder Status ==="
echo ""
echo "Current time: $(date)"
echo ""
echo "Triggering reminder check..."
echo ""

curl -X POST https://alexis123.netlify.app/.netlify/functions/check-reminders -v 2>&1 | grep -E "success|checked|results|error"

echo ""
echo ""
echo "=== What to check ==="
echo "1. Go to Dashboard"
echo "2. Find your appointment/task"
echo "3. Click the bell icon (should turn green)"
echo "4. Run this script again"
echo ""
echo "The appointment needs:"
echo "  - Phone number set (bell icon green)"
echo "  - Time within next 90 minutes"
echo "  - notify_offset_minutes set (default: 60)"
echo "  - notified_at empty (not already sent)"
