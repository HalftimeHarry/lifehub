# LifeHub

A personal life management dashboard built with SvelteKit and PocketBase, featuring automated SMS reminders via Twilio.

## Features

- 📅 **Appointments** - Medical, meetings, and personal events
- 💼 **Shifts** - Work schedule management
- ✈️ **Travel** - Trip planning and tracking
- ✅ **Tasks** - To-do items with priorities
- 📱 **SMS Reminders** - Automated notifications via Twilio with one-click toggle
- 🔄 **Real-time Sync** - PocketBase backend with live updates
- 📊 **Dashboard** - Upcoming items with tabs and SMS controls

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Start PocketBase
npm run pb

# Start development server
npm run dev
```

## Documentation

### Setup & Deployment
- [SETUP.md](./SETUP.md) - Local development setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment to Railway & Netlify
- [TWILIO_CREDENTIALS_GUIDE.md](./TWILIO_CREDENTIALS_GUIDE.md) - **START HERE** - Get your Twilio credentials
- [TWILIO_SETUP.md](./TWILIO_SETUP.md) - Twilio SMS configuration guide
- [SMS_TESTING_GUIDE.md](./SMS_TESTING_GUIDE.md) - Testing SMS reminders

### Database & Architecture
- [SCHEMA.md](./SCHEMA.md) - PocketBase collections schema
- [COLLECTIONS_SETUP.md](./COLLECTIONS_SETUP.md) - Collection configuration details
- [SCHEDULER.md](./SCHEDULER.md) - Automated reminder system

## Tech Stack

- **Frontend:** SvelteKit, Tailwind CSS, shadcn-svelte
- **Backend:** PocketBase (SQLite)
- **Deployment:** 
  - Frontend: Netlify (with scheduled functions)
  - Backend: Railway
- **Notifications:** Twilio SMS
- **Validation:** Zod
- **Date/Time:** dayjs

## Project Structure

```
lifehub/
├── src/
│   ├── lib/
│   │   ├── components/ui/    # shadcn-svelte components
│   │   ├── pb.ts             # PocketBase client
│   │   ├── types.ts          # TypeScript types
│   │   └── utils.ts          # Utility functions
│   └── routes/               # SvelteKit routes
│       ├── appointments/
│       ├── shifts/
│       ├── trips/
│       └── tasks/
├── netlify/
│   └── functions/
│       └── scheduler.ts      # SMS reminder function
├── pocketbase/               # PocketBase installation
└── static/                   # Static assets
```

## Development

```bash
# Run linting
npm run lint

# Format code
npm run format

# Type check
npm run check

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Build for production
npm run build
```

## Testing

The project uses Vitest for testing. Tests are located in `src/tests/`.

**Test Coverage:**
- Auto-completion logic (time-based, notification-based)
- Notification system (window calculation, message formatting)
- Phone number validation
- Multi-collection handling

**Running Tests:**
```bash
# Watch mode (recommended for development)
npm run test

# Run once and exit
npm run test:run

# Interactive UI
npm run test:ui
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick overview:**
1. Deploy PocketBase to Railway using the template
2. Import your schema to Railway
3. Push code to GitHub
4. Connect repository to Netlify
5. Set environment variables
6. Deploy!

The scheduler function will automatically run every 10 minutes to send SMS reminders.

## License

MIT
