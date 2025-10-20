# PocketBase Setup

This directory contains the PocketBase backend for LifeHub.

## Installation

PocketBase is already installed in this directory. The binary and data are gitignored.

## Running PocketBase

### Start the server
```bash
npm run pocketbase
# or shorthand
npm run pb
```

PocketBase will run on `http://127.0.0.1:8090`

Admin UI: `http://127.0.0.1:8090/_/`

### Run migrations
```bash
npm run pocketbase:migrate
```

## Development Workflow

### Local Development
1. Run PocketBase locally: `npm run pb`
2. Create your schema and collections via the Admin UI
3. PocketBase automatically creates migration files in `pb_data/migrations/`
4. Commit these migration files to version control

### Migration Files
- Migration files are stored in `pocketbase/pb_data/migrations/`
- These files should be committed to git
- They allow you to version control your database schema

### Exporting/Importing Data

#### Export collections to JSON
```bash
cd pocketbase
./pocketbase export collections
```

This creates JSON files in `pb_data/backups/` that you can:
- Use for seeding production
- Share with team members
- Keep as backups

#### Import collections from JSON
```bash
cd pocketbase
./pocketbase import collections <backup-file>
```

### Production Deployment

When deploying to production:
1. Copy migration files from `pb_data/migrations/` to production
2. Run migrations: `./pocketbase migrate`
3. Import initial data from JSON exports if needed

## Directory Structure

```
pocketbase/
├── pocketbase              # Binary (gitignored)
├── pb_data/                # Data directory (gitignored)
│   ├── data.db            # SQLite database
│   ├── migrations/        # Migration files (commit these!)
│   ├── backups/           # JSON exports
│   └── types.d.ts         # TypeScript types
├── CHANGELOG.md
├── LICENSE.md
└── README.md              # This file
```

## Important Notes

- The `pocketbase` binary and `pb_data/` directory are gitignored
- Migration files in `pb_data/migrations/` should be committed
- Use JSON exports for data seeding and backups
- PocketBase version: 0.30.4
