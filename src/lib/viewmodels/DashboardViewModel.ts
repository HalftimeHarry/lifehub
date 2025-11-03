import { appointmentService, taskService, tripService, shiftService } from '$lib/services';
import type { Appointment, Task, Trip, Shift } from '$lib/models';

export interface DashboardFilters {
	showAppointments: boolean;
	showTasks: boolean;
	showTrips: boolean;
	showShifts: boolean;
	showOnlyWithReminders: boolean;
	showCompleted: boolean;
	filterDriverId?: string;
}

export interface DashboardItem {
	id: string;
	type: 'appointment' | 'task' | 'trip' | 'shift';
	title: string;
	time: Date;
	formattedTime: string;
	model: Appointment | Task | Trip | Shift;
	hasReminder: boolean;
	phone?: string;
	statusBadge: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}

export class DashboardViewModel {
	private appointments: Appointment[] = [];
	private tasks: Task[] = [];
	private trips: Trip[] = [];
	private shifts: Shift[] = [];

	/**
	 * Load all data from services
	 */
	async loadData(filters: DashboardFilters): Promise<void> {
		const promises: Promise<any>[] = [];

		if (filters.showCompleted) {
			promises.push(
				appointmentService.getCompleted().then(data => { this.appointments = data; }),
				taskService.getCompleted().then(data => { this.tasks = data; }),
				shiftService.getCompleted().then(data => { this.shifts = data; })
			);
			// Trips don't have completed status, so load recent
			promises.push(tripService.getRecent().then(data => { this.trips = data; }));
		} else {
			promises.push(
				appointmentService.getRecent().then(data => { this.appointments = data; }),
				taskService.getActive().then(data => { this.tasks = data; }),
				tripService.getRecent().then(data => { this.trips = data; }),
				shiftService.getRecent().then(data => { this.shifts = data; })
			);
		}

		await Promise.all(promises);
	}

	/**
	 * Get filtered and sorted items for display
	 */
	getFilteredItems(filters: DashboardFilters): DashboardItem[] {
		const items: DashboardItem[] = [];

		// Add appointments
		if (filters.showAppointments) {
			let filteredAppointments = this.appointments;

			if (filters.filterDriverId) {
				filteredAppointments = filteredAppointments.filter(
					apt => apt.driver?.id === filters.filterDriverId
				);
			}

			if (filters.showOnlyWithReminders) {
				filteredAppointments = filteredAppointments.filter(apt => apt.hasReminder);
			}

			items.push(...filteredAppointments.map(apt => this.appointmentToItem(apt)));
		}

		// Add tasks
		if (filters.showTasks) {
			let filteredTasks = this.tasks;

			if (filters.showOnlyWithReminders) {
				filteredTasks = filteredTasks.filter(task => task.hasReminder);
			}

			items.push(...filteredTasks.map(task => this.taskToItem(task)));
		}

		// Add trips
		if (filters.showTrips) {
			let filteredTrips = this.trips;

			if (filters.showOnlyWithReminders) {
				filteredTrips = filteredTrips.filter(trip => trip.hasReminder);
			}

			items.push(...filteredTrips.map(trip => this.tripToItem(trip)));
		}

		// Add shifts
		if (filters.showShifts) {
			let filteredShifts = this.shifts;

			if (filters.showOnlyWithReminders) {
				filteredShifts = filteredShifts.filter(shift => shift.hasReminder);
			}

			items.push(...filteredShifts.map(shift => this.shiftToItem(shift)));
		}

		// Sort by time (most recent first)
		items.sort((a, b) => b.time.getTime() - a.time.getTime());

		return items;
	}

	/**
	 * Get statistics for the dashboard
	 */
	getStats(filters: DashboardFilters) {
		const items = this.getFilteredItems(filters);
		
		return {
			total: items.length,
			withReminders: items.filter(i => i.hasReminder).length,
			appointments: this.appointments.length,
			tasks: this.tasks.length,
			trips: this.trips.length,
			shifts: this.shifts.length
		};
	}

	private appointmentToItem(apt: Appointment): DashboardItem {
		return {
			id: apt.id,
			type: 'appointment',
			title: apt.title,
			time: apt.start,
			formattedTime: apt.formattedStart,
			model: apt,
			hasReminder: apt.hasReminder,
			phone: apt.phone,
			statusBadge: apt.statusBadge
		};
	}

	private taskToItem(task: Task): DashboardItem {
		return {
			id: task.id,
			type: 'task',
			title: task.title,
			time: task.due || new Date(),
			formattedTime: task.formattedDue || 'No due date',
			model: task,
			hasReminder: task.hasReminder,
			phone: task.phone,
			statusBadge: task.statusBadge
		};
	}

	private tripToItem(trip: Trip): DashboardItem {
		return {
			id: trip.id,
			type: 'trip',
			title: trip.title,
			time: trip.departAt,
			formattedTime: trip.formattedDepartAt,
			model: trip,
			hasReminder: trip.hasReminder,
			phone: trip.phone,
			statusBadge: trip.statusBadge
		};
	}

	private shiftToItem(shift: Shift): DashboardItem {
		return {
			id: shift.id,
			type: 'shift',
			title: shift.jobName,
			time: shift.start,
			formattedTime: shift.formattedStart,
			model: shift,
			hasReminder: shift.hasReminder,
			phone: shift.phone,
			statusBadge: shift.statusBadge
		};
	}
}
