# LifeHub

A personal life management dashboard built with SvelteKit and PocketBase, featuring automated SMS reminders via Twilio.

## Features

- 📅 **Appointments** - Medical, meetings, and personal events
- 💼 **Shifts** - Work schedule management
- ✈️ **Travel** - Trip planning and tracking
- ✅ **Tasks** - To-do items with priorities
- 📱 **SMS Reminders** - Automated notifications via Twilio
- 🔄 **Real-time Sync** - PocketBase backend with live updates

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

- [SETUP.md](./SETUP.md) - Complete setup guide
- [SCHEMA.md](./SCHEMA.md) - PocketBase collections schema
- [SCHEDULER.md](./SCHEDULER.md) - Automated reminder system
- [pocketbase/README.md](./pocketbase/README.md) - PocketBase configuration

## Tech Stack

- **Frontend:** SvelteKit, Tailwind CSS, shadcn-svelte
- **Backend:** PocketBase
- **Deployment:** Netlify (with scheduled functions)
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

# Build for production
npm run build
```

## Deployment

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables (see [SCHEDULER.md](./SCHEDULER.md))
4. Deploy!

The scheduler function will automatically run every 10 minutes to send SMS reminders.

## License

MIT
