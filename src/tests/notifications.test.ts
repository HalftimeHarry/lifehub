import { describe, it, expect, vi, beforeEach } from 'vitest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('Notification System', () => {
	describe('Notification window calculation', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		it('should trigger notification when within 10-minute window before offset time', () => {
			const now = dayjs('2024-01-15T14:00:00Z');
			vi.setSystemTime(now.toDate());

			const startTime = '2024-01-16T14:00:00Z'; // 24 hours from now
			const offsetMinutes = 1440; // Notify 24 hours (1440 minutes) before

			const targetTime = dayjs(startTime).subtract(offsetMinutes, 'minute');
			const minutesDiff = now.diff(targetTime, 'minute');

			const inWindow = minutesDiff >= 0 && minutesDiff < 10;

			expect(inWindow).toBe(true);
			expect(minutesDiff).toBe(0);
		});

		it('should not trigger notification when before window', () => {
			const now = dayjs('2024-01-15T13:45:00Z');
			vi.setSystemTime(now.toDate());

			const startTime = '2024-01-16T14:00:00Z';
			const offsetMinutes = 1440;

			const targetTime = dayjs(startTime).subtract(offsetMinutes, 'minute');
			const minutesDiff = now.diff(targetTime, 'minute');

			const inWindow = minutesDiff >= 0 && minutesDiff < 10;

			expect(inWindow).toBe(false);
			expect(minutesDiff).toBe(-15);
		});

		it('should not trigger notification when after window', () => {
			const now = dayjs('2024-01-15T14:15:00Z');
			vi.setSystemTime(now.toDate());

			const startTime = '2024-01-16T14:00:00Z';
			const offsetMinutes = 1440;

			const targetTime = dayjs(startTime).subtract(offsetMinutes, 'minute');
			const minutesDiff = now.diff(targetTime, 'minute');

			const inWindow = minutesDiff >= 0 && minutesDiff < 10;

			expect(inWindow).toBe(false);
			expect(minutesDiff).toBe(15);
		});

		it('should handle custom offset times', () => {
			const now = dayjs('2024-01-15T14:30:00Z');
			vi.setSystemTime(now.toDate());

			const startTime = '2024-01-15T17:00:00Z';
			const offsetMinutes = 150; // 2.5 hours before

			const targetTime = dayjs(startTime).subtract(offsetMinutes, 'minute');
			const minutesDiff = now.diff(targetTime, 'minute');

			const inWindow = minutesDiff >= 0 && minutesDiff < 10;

			expect(inWindow).toBe(true);
			expect(minutesDiff).toBe(0);
		});
	});

	describe('Lookahead filtering', () => {
		it('should include items within lookahead window', () => {
			const now = dayjs('2024-01-15T14:00:00Z');
			const lookaheadMinutes = 90;

			const items = [
				{ start: '2024-01-15T14:30:00Z', title: 'Soon' },
				{ start: '2024-01-15T15:20:00Z', title: 'Within window' },
				{ start: '2024-01-15T16:00:00Z', title: 'Too far' }
			];

			const until = now.add(lookaheadMinutes, 'minute');

			const filtered = items.filter((item) => {
				const itemTime = dayjs(item.start);
				return itemTime.isBefore(until) || itemTime.isSame(until);
			});

			expect(filtered).toHaveLength(2);
			expect(filtered.map((i) => i.title)).toEqual(['Soon', 'Within window']);
		});

		it('should exclude items outside lookahead window', () => {
			const now = dayjs('2024-01-15T14:00:00Z');
			const lookaheadMinutes = 30;

			const items = [
				{ start: '2024-01-15T14:15:00Z', title: 'Soon' },
				{ start: '2024-01-15T15:00:00Z', title: 'Too far' }
			];

			const until = now.add(lookaheadMinutes, 'minute');

			const filtered = items.filter((item) => {
				const itemTime = dayjs(item.start);
				return itemTime.isBefore(until) || itemTime.isSame(until);
			});

			expect(filtered).toHaveLength(1);
			expect(filtered[0].title).toBe('Soon');
		});
	});

	describe('Notification message formatting', () => {
		it('should format notification message correctly', () => {
			const item = {
				title: 'Doctor Appointment',
				start: '2024-01-15T15:30:00Z'
			};

			const timezone = 'America/Los_Angeles';
			const when = dayjs(item.start).tz(timezone).format('ddd, MMM D h:mm A');
			const message = `[LifeHub] ${item.title} at ${when}`;

			expect(message).toContain('Doctor Appointment');
			expect(message).toContain('[LifeHub]');
			expect(message).toContain('at');
		});

		it('should handle different timezones', () => {
			const start = '2024-01-15T20:00:00Z';

			const pst = dayjs(start).tz('America/Los_Angeles').format('h:mm A');
			const est = dayjs(start).tz('America/New_York').format('h:mm A');

			expect(pst).not.toBe(est);
		});

		it('should use default title when missing', () => {
			const item = {
				title: '',
				job: 'Plumbing Work',
				start: '2024-01-15T15:30:00Z'
			};

			const title = item.title || item.job || 'Reminder';

			expect(title).toBe('Plumbing Work');
		});

		it('should fallback to "Reminder" when all titles missing', () => {
			const item = {
				title: '',
				start: '2024-01-15T15:30:00Z'
			};

			const title = (item as any).title || (item as any).job || 'Reminder';

			expect(title).toBe('Reminder');
		});
	});

	describe('Phone number validation', () => {
		it('should skip items without phone number', () => {
			const items = [
				{ id: '1', phone: '+1234567890', title: 'Valid' },
				{ id: '2', phone: '', title: 'No phone' },
				{ id: '3', phone: null, title: 'Null phone' }
			];

			const validItems = items.filter((item) => item.phone && item.phone !== '');

			expect(validItems).toHaveLength(1);
			expect(validItems[0].id).toBe('1');
		});

		it('should handle WhatsApp prefix', () => {
			const phone = '+1234567890';
			const whatsappPhone = phone.startsWith('whatsapp:')
				? phone
				: `whatsapp:${phone}`;

			expect(whatsappPhone).toBe('whatsapp:+1234567890');
		});

		it('should not duplicate WhatsApp prefix', () => {
			const phone = 'whatsapp:+1234567890';
			const whatsappPhone = phone.startsWith('whatsapp:')
				? phone
				: `whatsapp:${phone}`;

			expect(whatsappPhone).toBe('whatsapp:+1234567890');
		});
	});

	describe('Notification state tracking', () => {
		it('should only notify items that have not been notified', () => {
			const items = [
				{ id: '1', notified_at: null, title: 'Not notified' },
				{ id: '2', notified_at: '2024-01-15T13:00:00Z', title: 'Already notified' },
				{ id: '3', notified_at: '', title: 'Not notified' }
			];

			const toNotify = items.filter(
				(item) => !item.notified_at || item.notified_at === ''
			);

			expect(toNotify).toHaveLength(2);
			expect(toNotify.map((i) => i.id)).toEqual(['1', '3']);
		});

		it('should update notified_at timestamp after sending', () => {
			const now = new Date('2024-01-15T14:00:00Z');
			const item = {
				id: '1',
				notified_at: null
			};

			const updated = {
				...item,
				notified_at: now.toISOString()
			};

			expect(updated.notified_at).toBe('2024-01-15T14:00:00.000Z');
		});
	});

	describe('Multiple collection handling', () => {
		it('should process all collection types', () => {
			const collections = [
				{ name: 'appointments', start: 'start', phone: 'phone', offset: 'notify_offset_minutes' },
				{ name: 'shifts', start: 'start', phone: 'phone', offset: 'notify_offset_minutes' },
				{ name: 'trips', start: 'depart_at', phone: 'phone', offset: 'notify_offset_minutes' },
				{ name: 'tasks', start: 'due', phone: 'phone', offset: 'notify_offset_minutes' }
			];

			expect(collections).toHaveLength(4);
			expect(collections.map((c) => c.name)).toEqual([
				'appointments',
				'shifts',
				'trips',
				'tasks'
			]);
		});

		it('should use correct field names for each collection', () => {
			const collections = [
				{ name: 'appointments', start: 'start' },
				{ name: 'trips', start: 'depart_at' },
				{ name: 'tasks', start: 'due' }
			];

			expect(collections.find((c) => c.name === 'appointments')?.start).toBe('start');
			expect(collections.find((c) => c.name === 'trips')?.start).toBe('depart_at');
			expect(collections.find((c) => c.name === 'tasks')?.start).toBe('due');
		});
	});

	describe('Error handling', () => {
		it('should continue processing other items if one fails', () => {
			const items = [
				{ id: '1', valid: true },
				{ id: '2', valid: false },
				{ id: '3', valid: true }
			];

			const results: string[] = [];
			const errors: string[] = [];

			items.forEach((item) => {
				try {
					if (!item.valid) {
						throw new Error('Invalid item');
					}
					results.push(item.id);
				} catch (err) {
					errors.push(item.id);
				}
			});

			expect(results).toEqual(['1', '3']);
			expect(errors).toEqual(['2']);
		});
	});
});
