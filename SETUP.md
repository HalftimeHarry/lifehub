# LifeHub Setup Guide

## Quick Start

### 1. Start PocketBase

```bash
npm run pb
```

PocketBase will be available at:

- **API:** `http://127.0.0.1:8090`
- **Admin UI:** `http://127.0.0.1:8090/_/`

### 2. Login to Admin UI

Navigate to `http://127.0.0.1:8090/_/` and login with:

**Email:** ddinsmore8@gmail.com  
**Password:** MADcap(123)

⚠️ **Security Note:** These are development credentials. Change them in production!

### 3. Create Collections

Follow the schema in `SCHEMA.md` to create these collections:

1. **jobs** - Job/position tracking
2. **appointments** - Medical, meetings, events
3. **shifts** - Work schedules
4. **trips** - Travel plans
5. **tasks** - To-do items

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at the Gitpod preview URL.

## Available Scripts

### Development

- `npm run dev` - Start Vite development server
- `npm run pb` - Start PocketBase server (alias for `npm run pocketbase`)
- `npm run pocketbase` - Start PocketBase on port 8090

### Building

- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Quality

- `npm run check` - Run TypeScript type checking with human-readable output
- `npm run check:watch` - Run type checking in watch mode
- `npm run lint` - Run ESLint and Prettier checks
- `npm run format` - Format code with Prettier

### Database

- `npm run pocketbase:migrate` - Run PocketBase migrations

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# PocketBase
VITE_POCKETBASE_URL=http://127.0.0.1:8090

# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890

# Notification Settings
NOTIFY_TIMEZONE=America/Los_Angeles
REMINDER_LOOKAHEAD_MIN=90
```

## Creating Collections via Admin UI

For each collection in `SCHEMA.md`:

1. Go to **Collections** in the sidebar
2. Click **New collection**
3. Enter collection name (e.g., "appointments")
4. Add fields according to the schema
5. Set field types and validation rules
6. Save the collection

### Example: Creating "appointments" Collection

1. Name: `appointments`
2. Add fields:
   - `title` (Text, Required)
   - `start` (Date, Required)
   - `end` (Date)
   - `location` (Text)
   - `notes` (Text)
   - `phone` (Text)
   - `notify_offset_minutes` (Number, Default: 60)
   - `notified_at` (Date)
   - `type` (Select: medical, meeting, personal, other)

## API Rules

For single-user development:

- Keep API rules open (no auth required)
- Or use admin token for all requests

For production:

- Add user authentication
- Set appropriate list/view/create/update/delete rules

## Migrations

After creating collections:

1. Migration files are auto-generated in `pocketbase/pb_data/migrations/`
2. Commit these files to git
3. On production, run: `./pocketbase migrate`

## Troubleshooting

### PocketBase won't start

```bash
# Check if port 8090 is in use
lsof -ti:8090

# Kill existing process
kill -9 $(lsof -ti:8090)

# Start PocketBase
npm run pb
```

### Can't access Admin UI

- Ensure PocketBase is running: `curl http://127.0.0.1:8090/api/health`
- Check logs: `tail -f /tmp/pocketbase.log`

### Connection errors in app

- Verify `VITE_POCKETBASE_URL` in `.env`
- Check PocketBase is running
- Verify collections are created
