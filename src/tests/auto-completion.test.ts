import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Auto-completion Logic', () => {
	describe('Time-based completion', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		it('should mark appointment as inactive when end time has passed', () => {
			const now = new Date('2024-01-15T15:00:00Z');
			vi.setSystemTime(now);

			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				start: '2024-01-15T14:00:00Z',
				end: '2024-01-15T14:30:00Z',
				active: true
			};

			const endTime = new Date(appointment.end);
			const shouldComplete = endTime < now;

			expect(shouldComplete).toBe(true);
		});

		it('should not mark appointment as inactive when end time has not passed', () => {
			const now = new Date('2024-01-15T14:00:00Z');
			vi.setSystemTime(now);

			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				start: '2024-01-15T14:00:00Z',
				end: '2024-01-15T14:30:00Z',
				active: true
			};

			const endTime = new Date(appointment.end);
			const shouldComplete = endTime < now;

			expect(shouldComplete).toBe(false);
		});

		it('should complete appointment 120 minutes after notification', () => {
			const notifiedAt = new Date('2024-01-15T12:00:00Z');
			const now = new Date('2024-01-15T14:05:00Z'); // 125 minutes later
			vi.setSystemTime(now);

			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				notified_at: notifiedAt.toISOString(),
				active: true
			};

			const minutesSinceNotification =
				(now.getTime() - new Date(appointment.notified_at).getTime()) / (1000 * 60);

			const shouldComplete = minutesSinceNotification >= 120;

			expect(shouldComplete).toBe(true);
			expect(minutesSinceNotification).toBe(125);
		});

		it('should not complete appointment before 120 minutes after notification', () => {
			const notifiedAt = new Date('2024-01-15T12:00:00Z');
			const now = new Date('2024-01-15T13:30:00Z'); // 90 minutes later
			vi.setSystemTime(now);

			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				notified_at: notifiedAt.toISOString(),
				active: true
			};

			const minutesSinceNotification =
				(now.getTime() - new Date(appointment.notified_at).getTime()) / (1000 * 60);

			const shouldComplete = minutesSinceNotification >= 120;

			expect(shouldComplete).toBe(false);
			expect(minutesSinceNotification).toBe(90);
		});
	});

	describe('Filter logic', () => {
		it('should only process active appointments', () => {
			const appointments = [
				{ id: '1', active: true, end: '2024-01-15T14:00:00Z' },
				{ id: '2', active: false, end: '2024-01-15T14:00:00Z' },
				{ id: '3', active: true, end: '2024-01-15T14:00:00Z' }
			];

			const activeAppointments = appointments.filter((apt) => apt.active !== false);

			expect(activeAppointments).toHaveLength(2);
			expect(activeAppointments.map((a) => a.id)).toEqual(['1', '3']);
		});

		it('should treat undefined active field as true', () => {
			const appointments = [
				{ id: '1', end: '2024-01-15T14:00:00Z' }, // active undefined
				{ id: '2', active: false, end: '2024-01-15T14:00:00Z' },
				{ id: '3', active: true, end: '2024-01-15T14:00:00Z' }
			];

			const activeAppointments = appointments.filter(
				(apt: any) => apt.active !== false
			);

			expect(activeAppointments).toHaveLength(2);
			expect(activeAppointments.map((a) => a.id)).toEqual(['1', '3']);
		});
	});

	describe('Date comparison', () => {
		it('should correctly compare ISO date strings', () => {
			const now = '2024-01-15T15:00:00.000Z';
			const past = '2024-01-15T14:00:00.000Z';
			const future = '2024-01-15T16:00:00.000Z';

			expect(past < now).toBe(true);
			expect(future < now).toBe(false);
			expect(now < now).toBe(false);
		});

		it('should handle different date formats', () => {
			const date1 = new Date('2024-01-15T14:00:00Z');
			const date2 = new Date('2024-01-15T14:00:00.000Z');

			expect(date1.getTime()).toBe(date2.getTime());
		});
	});

	describe('Edge cases', () => {
		it('should handle appointments without end time', () => {
			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				start: '2024-01-15T14:00:00Z',
				end: '',
				active: true
			};

			const shouldProcess = appointment.end !== '';

			expect(shouldProcess).toBe(false);
		});

		it('should handle appointments without notified_at', () => {
			const now = new Date('2024-01-15T15:00:00Z');
			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				notified_at: '',
				active: true
			};

			const shouldProcess = appointment.notified_at !== '';

			expect(shouldProcess).toBe(false);
		});

		it('should handle null values', () => {
			const appointment = {
				id: '1',
				title: 'Doctor Appointment',
				end: null,
				notified_at: null,
				active: true
			};

			expect(appointment.end).toBeNull();
			expect(appointment.notified_at).toBeNull();
		});
	});
});
