// PocketBase collection types

export interface Job {
	id: string;
	name: string;
	color?: string;
	created: string;
	updated: string;
}

export interface Appointment {
	id: string;
	title: string;
	start: string;
	end?: string;
	location?: string;
	notes?: string;
	phone?: string;
	notify_offset_minutes: number;
	notified_at?: string;
	type?: 'medical' | 'meeting' | 'personal' | 'other';
	created: string;
	updated: string;
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

// Expanded types with relations
export interface ShiftExpanded extends Shift {
	expand?: {
		job?: Job;
	};
}
