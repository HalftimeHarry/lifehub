// PocketBase collection types

export interface Person {
	id: string;
	name: string;
	phone?: string;
	email?: string;
	relationship?: string;
	notes?: string;
	image?: string; // file field
	created_by?: string;
	created: string;
	updated: string;
}

export interface Job {
	id: string;
	name: string;
	color?: string;
	created_by?: string; // relation ID to user
	assigned_to?: string[]; // relation IDs to users (multiple)
	created: string;
	updated: string;
}

export interface Location {
	id: string;
	name: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	phone?: string;
	notes?: string;
	type?: 'medical' | 'hotel' | 'restaurant' | 'office' | 'home' | 'other';
	created: string;
	updated: string;
}

export interface User {
	id: string;
	email: string;
	name?: string;
	avatar?: string;
	created: string;
	updated: string;
}

export interface Appointment {
	id: string;
	title: string;
	start: string;
	end?: string;
	location?: string; // relation ID to locations
	notes?: string;
	for?: string[]; // relation IDs to people (multiple - can be Carol, Charlie, Dustin, or Alexis)
	assigned_to?: string[]; // relation IDs to users (multiple)
	created_by?: string; // relation ID to user
	driver?: string; // relation ID to person who is driving
	phone?: string;
	notify_offset_minutes: number;
	notified_at?: string;
	type?: 'medical' | 'meeting' | 'personal' | 'other';
	created: string;
	updated: string;
}

export interface AppointmentExpanded extends Appointment {
	expand?: {
		for?: Person | Person[];
		location?: Location;
		assigned_to?: User[];
		created_by?: User;
		driver?: Person;
	};
}

export interface Shift {
	id: string;
	job: string; // relation ID to jobs
	start: string;
	end: string;
	location?: string;
	notes?: string;
	phone?: string;
	notify_offset_minutes?: number;
	notified_at?: string;
	assigned_to?: string[]; // relation IDs to users (multiple)
	created: string;
	updated: string;
}

export interface Trip {
	id: string;
	title: string;
	depart_at: string;
	arrive_at?: string;
	origin?: string;
	destination?: string;
	transport_type?: 'plane' | 'car' | 'train' | 'bus' | 'uber' | 'lyft' | 'taxi' | 'boat' | 'bike' | 'walk' | 'free ride' | 'other';
	notes?: string;
	color?: string;
	assigned_to?: string[]; // relation IDs to users (multiple) - legacy field
	people?: string[]; // relation IDs to people (multiple)
	created_by?: string; // relation ID to person
	phone?: string;
	notify_offset_minutes: number;
	notified_at?: string;
	ticket_image?: string; // file field for ticket/boarding pass
	created: string;
	updated: string;
}

export interface TripExpanded extends Trip {
	expand?: {
		assigned_to?: Person[];
		people?: Person[];
		created_by?: Person;
	};
}

export interface Task {
	id: string;
	title: string;
	due?: string;
	priority: 'low' | 'med' | 'high';
	notes?: string;
	color?: string;
	phone?: string;
	notify_offset_minutes: number;
	done: boolean;
	notified_at?: string;
	assigned_to?: string[]; // relation IDs to people (multiple)
	created_by?: string; // relation ID to person who created this
	created: string;
	updated: string;
}

export interface TaskExpanded extends Task {
	expand?: {
		assigned_to?: Person[];
		created_by?: Person;
	};
}

export interface Transportation {
	id: string;
	type: 'drive_self' | 'drive_other' | 'uber' | 'lyft' | 'taxi' | 'bus' | 'train' | 'plane' | 'other';
	driver_name?: string;
	driver_phone?: string;
	vehicle_info?: string;
	pickup_location?: string;
	pickup_time?: string;
	dropoff_location?: string;
	dropoff_time?: string;
	confirmation_number?: string;
	flight_number?: string;
	airline?: string;
	terminal?: string;
	gate?: string;
	seat?: string;
	notes?: string;
	appointment?: string; // relation ID to appointments
	trip?: string; // relation ID to trips
	for?: string[]; // relation IDs to people (multiple)
	cost?: number;
	created: string;
	updated: string;
}

export interface TransportationExpanded extends Transportation {
	expand?: {
		appointment?: Appointment;
		trip?: Trip;
		for?: Person[];
	};
}

export interface Expense {
	id: string;
	title: string;
	amount: number;
	type?: 'income' | 'expense';
	category?: 'medical' | 'travel' | 'food' | 'transportation' | 'lodging' | 'entertainment' | 'other';
	date: string;
	receipt?: string; // file field
	notes?: string;
	appointment?: string; // relation ID to appointments
	trip?: string; // relation ID to trips
	for?: string; // relation ID to people
	shift?: string; // relation ID to shifts
	created: string;
	updated: string;
}

export interface ExpenseExpanded extends Expense {
	expand?: {
		appointment?: Appointment;
		trip?: Trip;
		for?: Person;
	};
}

// Expanded types with relations
export interface JobExpanded extends Job {
	expand?: {
		created_by?: User;
		assigned_to?: User[];
	};
}

export interface ShiftExpanded extends Shift {
	expand?: {
		job?: Job;
		assigned_to?: User[];
	};
}
