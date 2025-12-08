import type { Handler } from '@netlify/functions';
import PocketBase from 'pocketbase';
import { Resend } from 'resend';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = process.env.NOTIFY_TIMEZONE || 'America/Los_Angeles';
const LOOKAHEAD_MIN = parseInt(process.env.REMINDER_LOOKAHEAD_MIN || '90', 10);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

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

		const collections = [
			{
				name: 'appointments',
				start: 'start',
				contact: 'phone',
				offset: 'notify_offset_minutes'
			},
			{ name: 'shifts', start: 'start', contact: 'phone', offset: 'notify_offset_minutes' },
			{ name: 'trips', start: 'depart_at', contact: 'phone', offset: 'notify_offset_minutes' },
			{ name: 'tasks', start: 'due', contact: 'phone', offset: 'notify_offset_minutes' }
		] as const;

		const sent: string[] = [];

		for (const c of collections) {
			const until = dayjs().add(LOOKAHEAD_MIN, 'minute').toISOString();
			const filter = `${c.start} != null && ${c.start} <= '${until}' && (notified_at = null)`;

			try {
				const items = await pb
					.collection(c.name)
					.getFullList({ filter, sort: c.start, requestKey: `${c.name}-reminders` });

				for (const item of items as Record<string, unknown>[]) {
					const startISO = item[c.start] as string;
					const contact = (item[c.contact] as string) || null;
					const offset = Number(item[c.offset] ?? 1440);

					if (!startISO || !contact) continue;
					if (!inWindow(startISO, offset)) continue;

					const title = item.title || item?.job || 'Reminder';
					const when = dayjs(startISO).tz(TZ).format('ddd, MMM D h:mm A');
					
					// Check if contact is an email address
					const isEmail = contact.includes('@');
					
					if (isEmail) {
						// Send email
						const subject = `LifeHub Reminder: ${title}`;
						const message = `
							<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
								<h2 style="color: #333;">Upcoming Event Reminder</h2>
								<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
									<h3 style="color: #555; margin-top: 0;">${title}</h3>
									<p style="color: #666; font-size: 16px; margin: 10px 0;">
										<strong>When:</strong> ${when}
									</p>
								</div>
								<p style="color: #666; line-height: 1.6;">
									This is your reminder for the upcoming event. Please make sure you're prepared.
								</p>
								<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
								<p style="color: #999; font-size: 12px;">
									This is an automated reminder from LifeHub.
								</p>
							</div>
						`;

						await resend.emails.send({
							from: FROM_EMAIL,
							to: [contact],
							subject: subject,
							html: message
						});

						console.log(`Sent email reminder for ${c.name}:${item.id} to ${contact}`);
					} else {
						// Skip SMS for now (phone numbers)
						console.log(`Skipping SMS for ${c.name}:${item.id} - SMS not configured`);
						continue;
					}

					await pb.collection(c.name).update(item.id, { notified_at: new Date().toISOString() });
					sent.push(`${c.name}:${item.id}`);
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
