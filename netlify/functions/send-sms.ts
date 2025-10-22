import type { Handler } from '@netlify/functions';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM;

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify Twilio credentials are configured
  if (!accountSid || !authToken || !fromNumber) {
    console.error('Missing Twilio credentials');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SMS service not configured' })
    };
  }

  try {
    const { to, message } = JSON.parse(event.body || '{}');

    // Validate input
    if (!to || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, message' })
      };
    }

    // Validate phone number format (E.164)
    if (!to.match(/^\+[1-9]\d{1,14}$/)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid phone number format. Use E.164 format: +1234567890' })
      };
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageSid: result.sid,
        status: result.status
      })
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
