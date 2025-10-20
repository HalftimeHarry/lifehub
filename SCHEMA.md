# PocketBase Schema

This document describes the collections and fields to create in PocketBase Admin UI.

## Use Case

LifeHub is designed for couples (like Alexis and Dustin) who need to coordinate their schedules and manage appointments for people they care for (like Carol and Charlie). Users can:
- Create appointments for themselves or others
- Track work shifts across multiple jobs
- Plan trips together
- Manage shared tasks
- Get SMS reminders for all events

## Collections

### 1. people

Tracks non-user contacts (e.g., Carol, Charlie) who have appointments but don't log into the system.

**Fields:**
- `name` (text, required) - Full name
- `phone` (text) - Phone number for SMS notifications
- `email` (text) - Email address (optional)
- `relationship` (text) - Relationship to users (e.g., "Mother", "Father", "Client")
- `notes` (text) - Additional notes about the person
- `created_by` (relation → users) - User who created this person

**Example:**
```json
{
  "name": "Carol",
  "phone": "+15551234567",
  "email": "carol@example.com",
  "relationship": "Mother",
  "notes": "Prefers morning appointments",
  "created_by": "USER_ID"
}
```

---

### 2. jobs

Tracks different jobs/positions.

**Fields:**

- `name` (text, required) - Job name
- `color` (text) - Color code for UI display

**Example:**

```json
{
	"name": "Software Engineer",
	"color": "#3b82f6"
}
```

---

### 3. appointments

Medical appointments, meetings, and personal events. Can be for users or people they care for.

**Fields:**

- `title` (text, required) - Appointment title
- `start` (dateTime, required) - Start date/time
- `end` (dateTime) - End date/time
- `location` (text) - Location/address
- `notes` (text) - Additional notes
- `person` (relation → people, optional) - Person this appointment is for (e.g., Carol)
- `phone` (text) - Phone number for SMS notifications (overrides person's phone)
- `notify_offset_minutes` (number, default: 60) - Minutes before to send reminder
- `notified_at` (dateTime, optional) - Timestamp when notification was sent
- `type` (select: ["medical","meeting","personal","other"]) - Appointment type
- `created_by` (relation → users) - User who created this appointment

**Example:**

```json
{
	"title": "Carol's Doctor Appointment",
	"start": "2024-01-15T14:00:00Z",
	"end": "2024-01-15T15:00:00Z",
	"location": "123 Medical Center",
	"notes": "Annual checkup",
	"person": "PERSON_ID",
	"phone": "+15551234567",
	"notify_offset_minutes": 60,
	"type": "medical",
	"created_by": "USER_ID"
}
```

---

### 4. shifts

Work shifts for different jobs.

**Fields:**

- `job` (relation → jobs, required) - Related job
- `start` (dateTime, required) - Shift start time
- `end` (dateTime, required) - Shift end time
- `location` (text) - Work location
- `notes` (text) - Shift notes
- `phone` (text) - Phone number for SMS notifications
- `notify_offset_minutes` (number, default: 120) - Minutes before to send reminder
- `notified_at` (dateTime) - Timestamp when notification was sent

**Example:**

```json
{
	"job": "RELATION_ID",
	"start": "2024-01-15T09:00:00Z",
	"end": "2024-01-15T17:00:00Z",
	"location": "Office Building A",
	"notes": "Bring laptop",
	"phone": "+15551234567",
	"notify_offset_minutes": 120
}
```

---

### 5. trips

Travel plans and trips.

**Fields:**

- `title` (text, required) - Trip title
- `depart_at` (dateTime, required) - Departure date/time
- `arrive_at` (dateTime) - Arrival date/time
- `origin` (text) - Starting location
- `destination` (text) - Destination
- `notes` (text) - Trip notes
- `phone` (text) - Phone number for SMS notifications
- `notify_offset_minutes` (number, default: 180) - Minutes before to send reminder
- `notified_at` (dateTime) - Timestamp when notification was sent

**Example:**

```json
{
	"title": "Weekend Trip to SF",
	"depart_at": "2024-01-20T08:00:00Z",
	"arrive_at": "2024-01-20T12:00:00Z",
	"origin": "Los Angeles",
	"destination": "San Francisco",
	"notes": "Pack warm clothes",
	"phone": "+15551234567",
	"notify_offset_minutes": 180
}
```

---

### 6. tasks

To-do items and tasks.

**Fields:**

- `title` (text, required) - Task title
- `due` (dateTime) - Due date/time
- `priority` (select: ["low","med","high"], default: "med") - Task priority
- `notes` (text) - Task notes
- `phone` (text) - Phone number for SMS notifications
- `notify_offset_minutes` (number, default: 30) - Minutes before to send reminder
- `done` (bool, default: false) - Completion status
- `notified_at` (dateTime) - Timestamp when notification was sent

**Example:**

```json
{
	"title": "Submit report",
	"due": "2024-01-15T17:00:00Z",
	"priority": "high",
	"notes": "Include Q4 metrics",
	"phone": "+15551234567",
	"notify_offset_minutes": 30,
	"done": false
}
```

---

## Setup Instructions

1. Start PocketBase: `npm run pb`
2. Open Admin UI: `http://127.0.0.1:8090/_/`
3. Create each collection with the fields listed above
4. Set appropriate field types and validation rules
5. Configure API rules as needed (for single-user, can keep open or use admin token)

## API Rules (Optional)

For single-user applications, you can:

- Keep collections open (no auth required)
- Or lock with admin token for security

For multi-user:

- Add user authentication
- Set list/view rules to filter by user ID
- Set create/update/delete rules appropriately

## Migration Workflow

After creating collections:

1. PocketBase auto-generates migration files in `pb_data/migrations/`
2. Commit these files to git
3. On production, run `./pocketbase migrate` to apply schema changes
4. Use JSON exports for data seeding: `./pocketbase export collections`
