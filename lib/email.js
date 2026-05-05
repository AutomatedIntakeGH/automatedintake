import { Resend } from 'resend';
import { supabase } from './supabase.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email with deduplication.
 * Won't send the same email_type to the same shop on the same day.
 */
export async function sendEmail({ shopId, emailType, toEmail, subject, html, text }) {
  // Check dedup — the unique index on email_log prevents same type+shop+day
  const { error: dedupError } = await supabase.from('email_log').insert({
    shop_id: shopId,
    email_type: emailType,
    to_email: toEmail,
    status: 'pending',
  });

  if (dedupError) {
    // Likely unique constraint violation = already sent today
    if (dedupError.code === '23505') {
      console.log(`[email] Skipped duplicate: ${emailType} for shop ${shopId}`);
      return { skipped: true };
    }
    console.error('[email] Dedup insert error:', dedupError);
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: toEmail,
      subject,
      html,
      text,
    });

    // Update the log entry with success
    await supabase
      .from('email_log')
      .update({ status: 'sent', resend_id: result.data?.id })
      .eq('shop_id', shopId)
      .eq('email_type', emailType)
      .gte('created_at', new Date().toISOString().split('T')[0]);

    return { sent: true, id: result.data?.id };
  } catch (err) {
    // Update log with failure
    await supabase
      .from('email_log')
      .update({ status: 'failed', error: err.message })
      .eq('shop_id', shopId)
      .eq('email_type', emailType)
      .gte('created_at', new Date().toISOString().split('T')[0]);

    console.error('[email] Send failed:', err);
    return { error: err.message };
  }
}

/**
 * Generate HTML for an email template. Simple branded template wrapper.
 */
export function wrapEmailHtml({ title, body, ctaUrl, ctaText }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f8fafc;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0891b2;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Automated Intake</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">${title}</h2>
      <div style="color:#475569;font-size:15px;line-height:1.6;">${body}</div>
      ${ctaUrl ? `
      <div style="margin:28px 0 16px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0891b2;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">${ctaText || 'Subscribe Now'}</a>
      </div>` : ''}
    </div>
    <div style="padding:20px 32px;background:#f1f5f9;font-size:12px;color:#64748b;">
      <p style="margin:0;">Automated Intake by All Professional LLC</p>
      <p style="margin:4px 0 0;">Questions? Reply to this email or visit automatedintake.app</p>
    </div>
  </div>
</body>
</html>`;
}
