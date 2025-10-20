import type { Handler } from '@netlify/functions';
import twilio from 'twilio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || '';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';
const NOTIFY_TIMEZONE = process.env.NOTIFY_TIMEZONE || 'America/Los_Angeles';
const REMINDER_LOOKAHEAD_MIN = parseInt(process.env.REMINDER_LOOKAHEAD_MIN || '90', 10);

export const handler: Handler = async (event, context) => {
	try {
		console.log('Scheduler function triggered at:', new Date().toISOString());

		// TODO: Implement reminder logic
		// 1. Connect to PocketBase
		// 2. Query upcoming appointments, shifts, trips, tasks
		// 3. Check if they need notifications (based on notify_offset_minutes)
		// 4. Send SMS via Twilio
		// 5. Update notified_at field

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Scheduler executed successfully',
				timestamp: new Date().toISOString()
			})
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
