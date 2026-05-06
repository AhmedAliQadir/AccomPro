import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRiskAlertEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured — skipping email');
    return false;
  }

  const from = process.env.ALERT_FROM_EMAIL || 'alerts@accom.pro';

  try {
    await resend.emails.send({ from, to, subject, html: htmlBody });
    return true;
  } catch (error: any) {
    console.error('Failed to send risk alert email:', error.message);
    return false;
  }
}
