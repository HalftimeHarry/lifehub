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

## New Collections Needed

You'll need to create these collections:
- ⚠️ **people** - For tracking non-user contacts (Carol, Charlie, etc.)
- ⚠️ **locations** - For tracking places (doctor offices, hotels, etc.)
- ⚠️ **expenses** - For tracking income/expenses with receipt images

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
| image | File | ❌ No | Max files: 1, Max size: 5MB, Types: image/jpeg, image/png |
| created_by | Relation | ❌ No | Collection: users, Max select: 1 |

**For the `image` field:**
- Choose "File" type
- Max select: 1
- Max size: 5242880 (5MB)
- Allowed types: image/jpeg, image/png

**For the `created_by` field:**
- Choose "Relation" type
- Collection: users
- Max select: 1
- Display fields: email

**API Rules for people collection:**

Go to the **API Rules** tab and set:

- **List/Search rule:** `@request.auth.id != ""`
  - Allows any authenticated user to view people
  
- **View rule:** `@request.auth.id != ""`
  - Allows any authenticated user to view individual person records
  
- **Create rule:** `@request.auth.id != ""`
  - Allows any authenticated user to create people
  
- **Update rule:** `@request.auth.id != "" && created_by = @request.auth.id`
  - Allows users to update only people they created
  
- **Delete rule:** `@request.auth.id != "" && created_by = @request.auth.id`
  - Allows users to delete only people they created

---

### 2. locations Collection (CREATE THIS)

Click **+ New collection** → Name it **locations**

**Note:** After adding fields, go to **API Rules** tab and set:
- **List/Search:** `@request.auth.id != ""`
- **View:** `@request.auth.id != ""`
- **Create:** `@request.auth.id != ""`
- **Update:** `@request.auth.id != ""`
- **Delete:** `@request.auth.id != ""`

Then add these fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | ✅ Yes | - |
| address | Text | ❌ No | - |
| latitude | Number | ❌ No | - |
| longitude | Number | ❌ No | - |
| phone | Text | ❌ No | - |
| notes | Text | ❌ No | - |
| type | Select | ❌ No | Values: `medical`, `hotel`, `restaurant`, `office`, `home`, `other` |

**For the `type` field:**
- Choose "Select" type
- Max select: 1
- Add values: medical, hotel, restaurant, office, home, other

---

### 3. jobs Collection

Click on **jobs** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | ✅ Yes | - |
| color | Text | ❌ No | - |

### 4. appointments Collection

Click on **appointments** → **Fields** tab → **+ New field**

**Note:** After adding fields, go to **API Rules** tab and set:
- **List/Search:** `@request.auth.id != ""`
- **View:** `@request.auth.id != ""`
- **Create:** `@request.auth.id != ""`
- **Update:** `@request.auth.id != ""`
- **Delete:** `@request.auth.id != ""`

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| start | Date | ✅ Yes | - |
| end | Date | ❌ No | - |
| location | Relation | ❌ No | Collection: locations, Max select: 1, Display fields: name |
| notes | Text | ❌ No | - |
| for | Relation | ✅ Yes | Collection: people, Max select: Multiple, Display fields: name |
| assigned_to | Relation | ❌ No | Collection: users, Max select: Multiple, Display fields: email |
| created_by | Relation | ❌ No | Collection: users, Max select: 1, Display fields: email |
| driver | Relation | ❌ No | Collection: people, Max select: 1, Display fields: name |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| notified_at | Date | ❌ No | - |
| type | Select | ❌ No | Values: `medical`, `meeting`, `personal`, `other` |

**For the `location` field:**
- Choose "Relation" type
- Collection: locations
- Max select: 1
- Display fields: name

**For the `for` field:**
- Choose "Relation" type
- Collection: people
- Max select: 1
- Display fields: name

**For the `assigned_to` field:**
- Choose "Relation" type
- Collection: users
- Max select: Multiple (unlimited)
- Display fields: email

**For the `created_by` field:**
- Choose "Relation" type
- Collection: users
- Max select: 1
- Display fields: email

**For the `type` field:**
- Choose "Select" type
- Max select: 1
- Add values: medical, meeting, personal, other

### 5. shifts Collection

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

### 6. trips Collection

Click on **trips** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| depart_at | Date | ✅ Yes | - |
| arrive_at | Date | ❌ No | - |
| origin | Text | ❌ No | - |
| destination | Text | ❌ No | - |
| notes | Text | ❌ No | - |
| assigned_to | Relation | ❌ No | Collection: users, Max select: Multiple, Display fields: email |
| created_by | Relation | ❌ No | Collection: users, Max select: 1, Display fields: email |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| notified_at | Date | ❌ No | - |

**For the `assigned_to` field:**
- Choose "Relation" type
- Collection: users
- Max select: Multiple (unlimited)
- Display fields: email

**For the `created_by` field:**
- Choose "Relation" type
- Collection: users
- Max select: 1
- Display fields: email

---

### 7. tasks Collection

Click on **tasks** → **Fields** tab → **+ New field**

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| due | Date | ❌ No | - |
| priority | Select | ❌ No | Values: `low`, `med`, `high` |
| notes | Text | ❌ No | - |
| assigned_to | Relation | ❌ No | Collection: people, Multiple: ✅ Yes, Display fields: name |
| created_by | Relation | ❌ No | Collection: people, Max select: 1, Display fields: name |
| phone | Text | ❌ No | - |
| notify_offset_minutes | Number | ❌ No | - |
| done | Bool | ❌ No | - |
| notified_at | Date | ❌ No | - |

**For the `priority` field:**
- Choose "Select" type
- Max select: 1
- Add values: low, med, high

**For the `assigned_to` field:**
- Choose "Relation" type
- Collection: people
- Enable "Multiple" selection
- Display fields: name

**For the `created_by` field:**
- Choose "Relation" type
- Collection: people
- Max select: 1
- Display fields: name

---

### 8. expenses Collection (CREATE THIS)

Click **+ New collection** → Name it **expenses**

**Note:** After adding fields, go to **API Rules** tab and set:
- **List/Search:** `@request.auth.id != ""`
- **View:** `@request.auth.id != ""`
- **Create:** `@request.auth.id != ""`
- **Update:** `@request.auth.id != ""`
- **Delete:** `@request.auth.id != ""`

Then add these fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | ✅ Yes | - |
| amount | Number | ✅ Yes | Allow decimals |
| category | Select | ❌ No | Values: `medical`, `travel`, `food`, `transportation`, `lodging`, `entertainment`, `other` |
| date | Date | ✅ Yes | - |
| receipt | File | ❌ No | Max files: 1, Max size: 5MB, Types: image/jpeg, image/png, application/pdf |
| notes | Text | ❌ No | - |
| appointment | Relation | ❌ No | Collection: appointments, Max select: 1, Display fields: title |
| trip | Relation | ❌ No | Collection: trips, Max select: 1, Display fields: title |
| for | Relation | ❌ No | Collection: people, Max select: 1, Display fields: name |

**For the `amount` field:**
- Choose "Number" type
- Check "Allow decimals"
- Use positive values for income, negative for expenses

**For the `category` field:**
- Choose "Select" type
- Max select: 1
- Add values: medical, travel, food, transportation, lodging, entertainment, other

**For the `receipt` field:**
- Choose "File" type
- Max select: 1
- Max size: 5242880 (5MB)
- Allowed types: image/jpeg, image/png, application/pdf

**For the `appointment` field:**
- Choose "Relation" type
- Collection: appointments
- Max select: 1
- Display fields: title

**For the `trip` field:**
- Choose "Relation" type
- Collection: trips
- Max select: 1
- Display fields: title

**For the `for` field:**
- Choose "Relation" type
- Collection: people
- Max select: 1
- Display fields: name

---

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
