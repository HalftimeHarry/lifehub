# PocketBase Collections Setup Guide

## Access Admin UI

1. Open: [https://8090--019a0239-f67e-72da-830b-a2059790708a.eu-central-1-01.gitpod.dev/_/](https://8090--019a0239-f67e-72da-830b-a2059790708a.eu-central-1-01.gitpod.dev/_/)
2. Login with:
   - Email: `ddinsmore8@gmail.com`
   - Password: `MADcap(123)`

## Collections Already Created

The following collections exist but need fields added:
- ✅ jobs
- ✅ appointments
- ✅ shifts
- ✅ trips
- ✅ tasks

## New Collection Needed

You'll need to create this collection:
- ⚠️ **people** - For tracking non-user contacts (Carol, Charlie, etc.)

## Add Fields to Each Collection

### 1. people Collection (CREATE THIS FIRST)

Click **+ New collection** → Name it **people**

Then add these fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | ✅ Yes | - |
| phone | Text | ❌ No | - |
| email | Email | ❌ No | - |
| relationship | Text | ❌ No | - |
| notes | Text | ❌ No | - |
| created_by | Relation | ✅ Yes | Collection: users, Max select: 1 |

**For the `created_by` field:**
- Choose "Relation" type
- Collection: users
- Max select: 1
- Display fields: email

---

### 2. jobs Collection

Click on **jobs** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | ✅ Yes | - |
| color | Text | ❌ No | - |

### 3. appointments Collection

Click on **appointments** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| start | Date | ✅ Yes | - |
| end | Date | ❌ No | - |
| location | Text | ❌ No | - |
| notes | Text | ❌ No | - |
| person | Relation | ❌ No | Collection: people, Max select: 1, Display fields: name |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| notified_at | Date | ❌ No | - |
| type | Select | ❌ No | Values: `medical`, `meeting`, `personal`, `other` |
| created_by | Relation | ✅ Yes | Collection: users, Max select: 1 |

**For the `person` field:**
- Choose "Relation" type
- Collection: people
- Max select: 1
- Display fields: name

**For the `type` field:**
- Choose "Select" type
- Max select: 1
- Add values: medical, meeting, personal, other

**For the `created_by` field:**
- Choose "Relation" type
- Collection: users
- Max select: 1
- Display fields: email

### 4. shifts Collection

Click on **shifts** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| job | Relation | ✅ Yes | Collection: jobs, Max select: 1, Display fields: name |
| start | Date | ✅ Yes | - |
| end | Date | ✅ Yes | - |
| location | Text | ❌ No | - |
| notes | Text | ❌ No | - |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| notified_at | Date | ❌ No | - |

**For the `job` field:**
- Choose "Relation" type
- Collection: jobs
- Max select: 1
- Display fields: name

### 5. trips Collection

Click on **trips** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| depart_at | Date | ✅ Yes | - |
| arrive_at | Date | ❌ No | - |
| origin | Text | ❌ No | - |
| destination | Text | ❌ No | - |
| notes | Text | ❌ No | - |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| notified_at | Date | ❌ No | - |

### 6. tasks Collection

Click on **tasks** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| due | Date | ❌ No | - |
| priority | Select | ❌ No | Values: `low`, `med`, `high` |
| notes | Text | ❌ No | - |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| done | Bool | ❌ No | - |
| notified_at | Date | ❌ No | - |

**For the `priority` field:**
- Choose "Select" type
- Max select: 1
- Add values: low, med, high

## After Adding Fields

1. **Save each collection** after adding all fields
2. **Generate migrations**: Run `npm run pocketbase:migrate` or use the Admin UI
3. **Commit migrations** to git: The migration files will be in `pocketbase/pb_data/migrations/`

## Quick Tips

- **Text fields**: Leave min/max empty for unlimited length
- **Number fields**: Leave min/max empty, check "No decimal" for integers
- **Date fields**: Leave min/max empty
- **Select fields**: Add all values separated by commas or one per line
- **Relation fields**: Choose the target collection and display fields

## Verification

After adding all fields, you can verify by:
1. Going to each collection's "API Preview" tab
2. Checking that all fields appear in the schema
3. Creating a test record to ensure fields work correctly

## Next Steps

Once all fields are added:
1. The SvelteKit app will be able to fetch and display data
2. You can start adding records through the Admin UI
3. The scheduler function will be able to send SMS reminders
