#!/bin/bash

# Test SMS Reminder System
# This script tests the SMS sending functionality

echo "=== Testing SMS Reminder System ==="
echo ""

# Check if environment variables are set
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ] || [ -z "$TWILIO_FROM" ]; then
    echo "❌ Error: Twilio credentials not set in .env file"
    echo "Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM"
    exit 1
fi

echo "✅ Twilio credentials found"
echo ""

# Test 1: Send a test SMS directly
echo "Test 1: Sending test SMS..."
echo "To: $TWILIO_FROM (sending to yourself for testing)"
echo ""

curl -X POST http://localhost:8888/.netlify/functions/send-sms \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$TWILIO_FROM\",
    \"message\": \"Test SMS from LifeHub - If you receive this, SMS is working!\"
  }"

echo ""
echo ""

# Test 2: Check for reminders
echo "Test 2: Checking for upcoming reminders..."
echo ""

curl -X POST http://localhost:8888/.netlify/functions/check-reminders

echo ""
echo ""
echo "=== Test Complete ==="
echo ""
echo "Check your phone for the test SMS!"
echo "If you didn't receive it, check the Twilio console for errors."
