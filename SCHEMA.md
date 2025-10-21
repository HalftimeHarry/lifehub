# PocketBase Schema

This document describes the collections and fields to create in PocketBase Admin UI.

## Use Case

LifeHub is designed for couples (like Alexis and Dustin) who need to coordinate their schedules and manage appointments for people they care for (like Carol and Charlie). 

**Key Concept:** Everyone (users and non-users) is tracked in the `people` collection. This creates a unified model where:
- **Alexis and Dustin** are in people AND can log in as users
- **Carol and Charlie** are in people but cannot log in
- **Appointments** can be for anyone using the `for` field

Users can:
- Create appointments for themselves or others
- Track work shifts across multiple jobs
- Plan trips together
- Manage shared tasks
- Get SMS reminders for all events

## Collections

### 1. people

Tracks everyone in the system - both users (Alexis, Dustin) and non-users (Carol, Charlie).

**Fields:**
- `name` (text, required) - Full name
- `phone` (text) - Phone number for SMS notifications
- `email` (text) - Email address (optional)
- `relationship` (text) - Relationship type (e.g., "Partner", "Mother", "Friend")
- `notes` (text) - Additional notes about the person
- `image` (file) - Profile photo (jpg, png)
- `created_by` (relation → users, optional) - User who created this person

**Examples:**
```json
{
  "name": "Alexis",
  "phone": "+15551234567",
  "email": "alexis@example.com",
  "relationship": "Partner",
  "notes": "Primary caretaker for Carol",
  "image": "alexis_photo.jpg"
}
```

```json
{
  "name": "Carol",
  "phone": "+15559876543",
  "relationship": "Mother",
  "notes": "Prefers morning appointments",
  "image": "carol_photo.jpg",
  "created_by": "ALEXIS_USER_ID"
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

### 3. locations

Tracks places where appointments occur (doctor offices, hotels, restaurants, etc.).

**Fields:**

- `name` (text, required) - Location name
- `address` (text) - Full address
- `latitude` (number) - Latitude coordinate
- `longitude` (number) - Longitude coordinate
- `phone` (text) - Location phone number
- `notes` (text) - Additional notes about the location
- `type` (select: ["medical","hotel","restaurant","office","home","other"]) - Location type

**Examples:**

```json
{
	"name": "Downtown Medical Center",
	"address": "123 Main St, Suite 200, Springfield, IL 62701",
	"phone": "+15555551234",
	"type": "medical",
	"notes": "Parking in rear lot"
}
```

```json
{
	"name": "Hilton Garden Inn",
	"address": "456 Hotel Blvd, Chicago, IL 60601",
	"phone": "+15555555678",
	"type": "hotel",
	"notes": "Ask for room with view"
}
```

---

### 4. appointments

Medical appointments, meetings, and personal events. Can be for users or people they care for.

**Fields:**

- `title` (text, required) - Appointment title
- `start` (dateTime, required) - Start date/time
- `end` (dateTime) - End date/time
- `location` (relation → locations, optional) - Where the appointment takes place
- `notes` (text) - Additional notes
- `for` (relation → people, multiple, required) - Who this appointment is for (Carol, Charlie, Dustin, Alexis, etc.)
- `assigned_to` (relation → users, multiple) - Users assigned to this appointment (can be multiple)
- `created_by` (relation → users, optional) - User who created this appointment
- `driver` (relation → people, optional) - Who is driving/providing transportation
- `phone` (text) - Phone number for SMS notifications (overrides person's phone)
- `notify_offset_minutes` (number, default: 60) - Minutes before to send reminder
- `notified_at` (dateTime, optional) - Timestamp when notification was sent
- `type` (select: ["medical","meeting","personal","other"]) - Appointment type

**Examples:**

```json
{
	"title": "Carol's Doctor Appointment",
	"start": "2024-01-15T14:00:00Z",
	"end": "2024-01-15T15:00:00Z",
	"location": "DOWNTOWN_MEDICAL_CENTER_ID",
	"notes": "Annual checkup",
	"for": ["CAROL_PERSON_ID"],
	"driver": "ALEXIS_PERSON_ID",
	"notify_offset_minutes": 60,
	"type": "medical"
}
```

```json
{
	"title": "Hotel Check-in",
	"start": "2024-01-20T15:00:00Z",
	"location": "HILTON_GARDEN_INN_ID",
	"for": "DUSTIN_PERSON_ID",
	"type": "personal"
}
```

---

### 5. shifts

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

### 6. trips

Travel plans and trips.

**Fields:**

- `title` (text, required) - Trip title
- `depart_at` (dateTime, required) - Departure date/time
- `arrive_at` (dateTime) - Arrival date/time
- `origin` (text) - Starting location
- `destination` (text) - Destination
- `notes` (text) - Trip notes
- `assigned_to` (relation → users, multiple) - Users assigned to this trip (can be multiple)
- `created_by` (relation → users, optional) - User who created this trip
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

### 7. expenses

Track income and expenses with receipt images for appointments, trips, and general spending.

**Fields:**

- `title` (text, required) - Expense description
- `amount` (number, required) - Amount (positive for income, negative for expense)
- `category` (select: ["medical","travel","food","transportation","lodging","entertainment","other"]) - Expense category
- `date` (dateTime, required) - Date of expense
- `receipt` (file) - Receipt image (jpg, png, pdf)
- `notes` (text) - Additional notes
- `appointment` (relation → appointments, optional) - Related appointment
- `trip` (relation → trips, optional) - Related trip
- `for` (relation → people, optional) - Who this expense is for

**Examples:**

```json
{
	"title": "Carol's Doctor Visit Copay",
	"amount": -35.00,
	"category": "medical",
	"date": "2024-01-15T14:00:00Z",
	"notes": "Copay for annual checkup",
	"appointment": "APPOINTMENT_ID",
	"for": "CAROL_PERSON_ID"
}
```

```json
{
	"title": "Hotel Stay - Chicago",
	"amount": -250.00,
	"category": "lodging",
	"date": "2024-01-20T00:00:00Z",
	"receipt": "receipt_12345.jpg",
	"trip": "TRIP_ID"
}
```

```json
{
	"title": "Freelance Payment",
	"amount": 1500.00,
	"category": "other",
	"date": "2024-01-10T00:00:00Z",
	"notes": "Client project completed"
}
```

---

### 8. tasks

To-do items and tasks.

**Fields:**

- `title` (text, required) - Task title
- `due` (dateTime) - Due date/time
- `priority` (select: ["low","med","high"], default: "med") - Task priority
- `notes` (text) - Task notes
- `assigned_to` (relation → people, multiple) - People assigned to this task (can be multiple)
- `created_by` (relation → people, optional) - Person who created this task
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
