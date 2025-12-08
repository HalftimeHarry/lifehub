import type { Handler, HandlerEvent } from '@netlify/functions';
import PocketBase from 'pocketbase';
import twilio from 'twilio';

const pbUrl = process.env.VITE_POCKETBASE_URL || '';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// Always use WhatsApp sandbox number to avoid A2P 10DLC registration
const fromNumber = 'whatsapp:+14155238886';
const timezone = process.env.NOTIFY_TIMEZONE || 'America/Los_Angeles';
const lookaheadMinutes = parseInt(process.env.REMINDER_LOOKAHEAD_MIN || '90');

interface ReminderItem {
  id: string;
  title: string;
  phone: string;
  notify_offset_minutes: number;
  notified_at: string;
  collection: string;
  time: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  console.log('[Reminders] Starting reminder check...');

  // Verify configuration
  if (!pbUrl || !accountSid || !authToken || !fromNumber) {
    console.error('[Reminders] Missing required environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Service not configured' })
    };
  }

  try {
    const pb = new PocketBase(pbUrl);
    const client = twilio(accountSid, authToken);

    const now = new Date();
    const lookaheadTime = new Date(now.getTime() + lookaheadMinutes * 60000);
    
    // Format dates for PocketBase
    const nowStr = now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '.000Z');
    const lookaheadStr = lookaheadTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '.000Z');

    console.log('[Reminders] Checking for items between:', nowStr, 'and', lookaheadStr);

    const itemsToNotify: ReminderItem[] = [];

    // Check appointments
    try {
      const appointments = await pb.collection('appointments').getFullList({
        filter: `start >= "${nowStr}" && start <= "${lookaheadStr}" && phone != "" && notified_at = ""`
      });
      
      console.log('[Reminders] Found', appointments.length, 'appointments to check');
      
      appointments.forEach(apt => {
        console.log('[Reminders] Checking appointment:', {
          id: apt.id,
          title: apt.title,
          start: apt.start,
          phone: apt.phone,
          notify_offset_minutes: apt.notify_offset_minutes || 1440,
          notified_at: apt.notified_at
        });
        
        const notifyTime = new Date(new Date(apt.start).getTime() - (apt.notify_offset_minutes || 1440) * 60000);
        console.log('[Reminders] Notify time:', notifyTime.toISOString(), 'Current time:', now.toISOString());
        
        if (notifyTime <= now) {
          console.log('[Reminders] ✅ Adding to notify list:', apt.title);
          itemsToNotify.push({
            id: apt.id,
            title: apt.title,
            phone: apt.phone,
            notify_offset_minutes: apt.notify_offset_minutes || 1440,
            notified_at: apt.notified_at,
            collection: 'appointments',
            time: apt.start
          });
        } else {
          console.log('[Reminders] ⏰ Too early to notify:', apt.title);
        }
      });
    } catch (err) {
      console.error('[Reminders] Error fetching appointments:', err);
    }

    // Check tasks
    try {
      const tasks = await pb.collection('tasks').getFullList({
        filter: `due >= "${nowStr}" && due <= "${lookaheadStr}" && phone != "" && notified_at = "" && done = false`
      });
      
      tasks.forEach(task => {
        const notifyTime = new Date(new Date(task.due).getTime() - (task.notify_offset_minutes || 1440) * 60000);
        if (notifyTime <= now) {
          itemsToNotify.push({
            id: task.id,
            title: task.title,
            phone: task.phone,
            notify_offset_minutes: task.notify_offset_minutes || 1440,
            notified_at: task.notified_at,
            collection: 'tasks',
            time: task.due
          });
        }
      });
      console.log('[Reminders] Found', tasks.length, 'tasks to check');
    } catch (err) {
      console.error('[Reminders] Error fetching tasks:', err);
    }

    // Check trips
    try {
      const trips = await pb.collection('trips').getFullList({
        filter: `depart_at >= "${nowStr}" && depart_at <= "${lookaheadStr}" && phone != "" && notified_at = ""`
      });
      
      trips.forEach(trip => {
        const notifyTime = new Date(new Date(trip.depart_at).getTime() - (trip.notify_offset_minutes || 1440) * 60000);
        if (notifyTime <= now) {
          itemsToNotify.push({
            id: trip.id,
            title: trip.title,
            phone: trip.phone,
            notify_offset_minutes: trip.notify_offset_minutes || 1440,
            notified_at: trip.notified_at,
            collection: 'trips',
            time: trip.depart_at
          });
        }
      });
      console.log('[Reminders] Found', trips.length, 'trips to check');
    } catch (err) {
      console.error('[Reminders] Error fetching trips:', err);
    }

    // Check shifts
    try {
      const shifts = await pb.collection('shifts').getFullList({
        filter: `start >= "${nowStr}" && start <= "${lookaheadStr}" && phone != "" && notified_at = ""`
      });
      
      shifts.forEach(shift => {
        const notifyTime = new Date(new Date(shift.start).getTime() - (shift.notify_offset_minutes || 1440) * 60000);
        if (notifyTime <= now) {
          itemsToNotify.push({
            id: shift.id,
            title: shift.title || 'Shift',
            phone: shift.phone,
            notify_offset_minutes: shift.notify_offset_minutes || 1440,
            notified_at: shift.notified_at,
            collection: 'shifts',
            time: shift.start
          });
        }
      });
      console.log('[Reminders] Found', shifts.length, 'shifts to check');
    } catch (err) {
      console.error('[Reminders] Error fetching shifts:', err);
    }

    console.log('[Reminders] Total items to notify:', itemsToNotify.length);

    // Auto-complete items 120 minutes after notification
    const autoCompleteTime = new Date(now.getTime() - 120 * 60000); // 120 minutes ago
    const autoCompleteStr = autoCompleteTime.toISOString().replace('T', ' ').replace(/\.\\d{3}Z$/, '.000Z');
    
    console.log('[Reminders] Checking for items to auto-complete (notified before:', autoCompleteStr, ')');
    
    const collectionsToComplete = ['appointments', 'tasks', 'shifts'];
    let completedCount = 0;
    
    for (const collection of collectionsToComplete) {
      try {
        const itemsToComplete = await pb.collection(collection).getFullList({
          filter: `notified_at != "" && notified_at <= "${autoCompleteStr}" && (active = true || active = null)`
        });
        
        console.log(`[Reminders] Found ${itemsToComplete.length} ${collection} to auto-complete`);
        
        for (const item of itemsToComplete) {
          await pb.collection(collection).update(item.id, { active: false });
          console.log(`[Reminders] Auto-completed ${collection}:`, item.id);
          completedCount++;
        }
      } catch (err) {
        console.error(`[Reminders] Error auto-completing ${collection}:`, err);
      }
    }
    
    console.log(`[Reminders] Auto-completed ${completedCount} items`);

    // Send notifications
    const results = [];
    for (const item of itemsToNotify) {
      try {
        const itemTime = new Date(item.time);
        const timeStr = itemTime.toLocaleString('en-US', {
          timeZone: timezone,
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        const message = `Reminder: ${item.title} at ${timeStr}`;
        
        console.log('[Reminders] Sending WhatsApp to', item.phone, ':', message);
        
        // Ensure phone number has whatsapp: prefix
        const toNumber = item.phone.startsWith('whatsapp:') ? item.phone : `whatsapp:${item.phone}`;
        
        const result = await client.messages.create({
          body: message,
          from: fromNumber,
          to: toNumber
        });

        // Mark as notified
        await pb.collection(item.collection).update(item.id, {
          notified_at: now.toISOString()
        });

        results.push({
          item: item.title,
          phone: item.phone,
          status: 'sent',
          messageSid: result.sid
        });

        console.log('[Reminders] WhatsApp sent successfully:', result.sid);
      } catch (err) {
        console.error('[Reminders] Error sending WhatsApp for', item.title, ':', err);
        results.push({
          item: item.title,
          phone: item.phone,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        checked: itemsToNotify.length,
        results: results
      })
    };
  } catch (error) {
    console.error('[Reminders] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to check reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
