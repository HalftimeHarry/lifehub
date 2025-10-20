// PocketBase collection types

export interface Person {
	id: string;
	name: string;
	phone?: string;
	email?: string;
	relationship?: string;
	notes?: string;
	created_by: string;
	created: string;
	updated: string;
}

export interface Job {
	id: string;
	name: string;
	color?: string;
	created: string;
	updated: string;
}

export interface Location {
	id: string;
	name: string;
	address?: string;
	phone?: string;
	notes?: string;
	type?: 'medical' | 'hotel' | 'restaurant' | 'office' | 'home' | 'other';
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
	for?: string; // relation ID to people (can be Carol, Charlie, Dustin, or Alexis)
	phone?: string;
	notify_offset_minutes: number;
	notified_at?: string;
	type?: 'medical' | 'meeting' | 'personal' | 'other';
	created: string;
	updated: string;
}

export interface AppointmentExpanded extends Appointment {
	expand?: {
		for?: Person;
		location?: Location;
	};
}

export interface Shift {
	id: string;
	job: string; // relation ID
	start: string;
	end: string;
	location?: string;
	notes?: string;
	phone?: string;
	notify_offset_minutes: number;
	notified_at?: string;
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
	notes?: string;
	phone?: string;
	notify_offset_minutes: number;
	notified_at?: string;
	created: string;
	updated: string;
}

export interface Task {
	id: string;
	title: string;
	due?: string;
	priority: 'low' | 'med' | 'high';
	notes?: string;
	phone?: string;
	notify_offset_minutes: number;
	done: boolean;
	notified_at?: string;
	created: string;
	updated: string;
}

export interface Expense {
	id: string;
	title: string;
	amount: number; // positive for income, negative for expense
	category?: 'medical' | 'travel' | 'food' | 'transportation' | 'lodging' | 'entertainment' | 'other';
	date: string;
	receipt?: string; // file field
	notes?: string;
	appointment?: string; // relation ID to appointments
	trip?: string; // relation ID to trips
	for?: string; // relation ID to people
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
export interface ShiftExpanded extends Shift {
	expand?: {
		job?: Job;
	};
}
