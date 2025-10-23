import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, message } = JSON.parse(event.body || '{}');

    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, message' })
      };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const data = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">LifeHub Reminder</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated reminder from LifeHub.
          </p>
        </div>
      `
    });

    console.log('[Email] Sent successfully:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: data.id
      })
    };
  } catch (error) {
    console.error('[Email] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
