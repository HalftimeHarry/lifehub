import type { Handler } from '@netlify/functions';
import PocketBase from 'pocketbase';
import twilio from 'twilio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = process.env.NOTIFY_TIMEZONE || 'America/Los_Angeles';
const LOOKAHEAD_MIN = parseInt(process.env.REMINDER_LOOKAHEAD_MIN || '90', 10);

function inWindow(startISO: string, offsetMin: number) {
	const now = dayjs();
	const target = dayjs(startISO).subtract(offsetMin, 'minute');
	// Trigger when target time is within the last 10 minutes window
	return now.diff(target, 'minute') >= 0 && now.diff(target, 'minute') < 10;
}

export const handler: Handler = async () => {
	try {
		console.log('Scheduler function triggered at:', new Date().toISOString());

		const pb = new PocketBase(process.env.VITE_POCKETBASE_URL!);
		const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

		const collections = [
			{
				name: 'appointments',
				start: 'start',
				phone: 'phone',
				offset: 'notify_offset_minutes'
			},
			{ name: 'shifts', start: 'start', phone: 'phone', offset: 'notify_offset_minutes' },
			{ name: 'trips', start: 'depart_at', phone: 'phone', offset: 'notify_offset_minutes' },
			{ name: 'tasks', start: 'due', phone: 'phone', offset: 'notify_offset_minutes' }
		] as const;

		const sent: string[] = [];

		for (const c of collections) {
			const until = dayjs().add(LOOKAHEAD_MIN, 'minute').toISOString();
			const filter = `${c.start} != null && ${c.start} <= '${until}' && (notified_at = null)`;

			try {
				const items = await pb
					.collection(c.name)
					.getFullList({ filter, sort: c.start, requestKey: `${c.name}-reminders` });

				for (const item of items as any[]) {
					const startISO = item[c.start];
					const to = item[c.phone] || null;
					const offset = Number(item[c.offset] ?? 60);

					if (!startISO || !to) continue;
					if (!inWindow(startISO, offset)) continue;

					const title = item.title || item?.job || 'Reminder';
					const when = dayjs(startISO).tz(TZ).format('ddd, MMM D h:mm A');
					const body = `[LifeHub] ${title} at ${when}`;

					await client.messages.create({
						to,
						from: process.env.TWILIO_FROM!,
						body
					});

					await pb.collection(c.name).update(item.id, { notified_at: new Date().toISOString() });
					sent.push(`${c.name}:${item.id}`);
					console.log(`Sent reminder for ${c.name}:${item.id} to ${to}`);
				}
			} catch (collectionError) {
				console.error(`Error processing ${c.name}:`, collectionError);
				// Continue with other collections even if one fails
			}
		}

		return {
			statusCode: 200,
			body: JSON.stringify({ ok: true, sent, timestamp: new Date().toISOString() })
		};
	} catch (error) {
		console.error('Scheduler error:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: 'Scheduler failed',
				message: error instanceof Error ? error.message : 'Unknown error'
			})
		};
	}
};
