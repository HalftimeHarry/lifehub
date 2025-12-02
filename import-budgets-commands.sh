🚀 Budget Import Commands Generator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Instructions:
1. Login to your app at: https://5173--019ad10a-e46d-7d48-93f2-39a68eac6e8a.us-east-1-01.gitpod.dev
2. Open browser DevTools (F12)
3. Go to Application/Storage → Local Storage
4. Find "pocketbase_auth" and copy the "token" value
5. Replace YOUR_TOKEN_HERE in the commands below
6. Run each command in your terminal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Import Commands:

# Budget 1: Monthly Housing
curl -X POST "https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monthly Housing","amount":2500,"period":"monthly","start_date":"2025-01-01 00:00:00.000Z","end_date":"","category":"lodging","type":"expense","account":"bank","for":"","alert_threshold":90,"active":true,"rollover":false,"notes":"Includes mortgage, HOA fees, and property-related expenses"}'

# Budget 2: Monthly Utilities
curl -X POST "https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monthly Utilities","amount":500,"period":"monthly","start_date":"2025-01-01 00:00:00.000Z","end_date":"","category":"utilities","type":"expense","account":"bank","for":"","alert_threshold":80,"active":true,"rollover":false,"notes":"Electric, water, internet, phone, and other utilities"}'

# Budget 3: Monthly Food & Groceries
curl -X POST "https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monthly Food & Groceries","amount":800,"period":"monthly","start_date":"2025-01-01 00:00:00.000Z","end_date":"","category":"food","type":"expense","account":"bank","for":"","alert_threshold":85,"active":true,"rollover":true,"notes":"Groceries, dining out, and food delivery"}'

# Budget 4: Monthly Transportation
curl -X POST "https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monthly Transportation","amount":600,"period":"monthly","start_date":"2025-01-01 00:00:00.000Z","end_date":"","category":"transportation","type":"expense","account":"bank","for":"","alert_threshold":80,"active":true,"rollover":false,"notes":"Car payment, gas, insurance, maintenance, and parking"}'

# Budget 5: Monthly Income Goal
curl -X POST "https://pocketbase-production-f733.up.railway.app/api/collections/budgets/records" \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monthly Income Goal","amount":5000,"period":"monthly","start_date":"2025-01-01 00:00:00.000Z","end_date":"","category":"all","type":"income","account":"all","for":"","alert_threshold":75,"active":true,"rollover":false,"notes":"Total monthly income target from all sources"}'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Alternative: Import via PocketBase Admin UI
   Go to: https://pocketbase-production-f733.up.railway.app/_/
   Navigate to: Collections → budgets → New Record
   Copy values from BUDGET_IMPORT_GUIDE.md

