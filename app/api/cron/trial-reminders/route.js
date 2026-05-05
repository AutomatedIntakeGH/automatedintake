import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase.js';
import { sendEmail } from '@/lib/email.js';
import {
  trial7DayEmail,
  trial3DayEmail,
  trial1DayEmail,
  trialExpiredGraceEmail,
  trialLockedEmail,
} from '@/lib/emails.js';

/**
 * GET /api/cron/trial-reminders
 * Called daily by Vercel Cron at 8am Central.
 * Sends reminder emails to shops approaching trial expiry.
 *
 * Vercel cron config (in vercel.json):
 *   { "path": "/api/cron/trial-reminders", "schedule": "0 13 * * *" }
 *   (13:00 UTC = 8:00 AM Central)
 */
export async function GET(req) {
  // Verify this is a cron call (Vercel sets this header)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow if running locally / no CRON_SECRET set
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results = { sent: [], skipped: [], errors: [] };

  try {
    // 7-day reminders
    const { data: shops7d } = await supabase
      .from('shops')
      .select('*')
      .eq('plan_tier', 'trial')
      .gte('trial_expires_at', new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000).toISOString())
      .lte('trial_expires_at', new Date(Date.now() + 7.5 * 24 * 60 * 60 * 1000).toISOString());

    for (const shop of (shops7d || [])) {
      const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`;
      const content = trial7DayEmail({ shopName: shop.shop_name || 'Your shop', expiresAt: shop.trial_expires_at, checkoutUrl });
      const result = await sendEmail({ shopId: shop.id, emailType: 'trial_7d', toEmail: shop.billing_email, ...content });
      results.sent.push({ shop_id: shop.tekmetric_shop_id, type: 'trial_7d', ...result });
    }

    // 3-day reminders
    const { data: shops3d } = await supabase
      .from('shops')
      .select('*')
      .eq('plan_tier', 'trial')
      .gte('trial_expires_at', new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString())
      .lte('trial_expires_at', new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString());

    for (const shop of (shops3d || [])) {
      const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`;
      const content = trial3DayEmail({ shopName: shop.shop_name || 'Your shop', expiresAt: shop.trial_expires_at, checkoutUrl });
      const result = await sendEmail({ shopId: shop.id, emailType: 'trial_3d', toEmail: shop.billing_email, ...content });
      results.sent.push({ shop_id: shop.tekmetric_shop_id, type: 'trial_3d', ...result });
    }

    // 1-day reminders
    const { data: shops1d } = await supabase
      .from('shops')
      .select('*')
      .eq('plan_tier', 'trial')
      .gte('trial_expires_at', new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString())
      .lte('trial_expires_at', new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString());

    for (const shop of (shops1d || [])) {
      const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`;
      const content = trial1DayEmail({ shopName: shop.shop_name || 'Your shop', expiresAt: shop.trial_expires_at, checkoutUrl });
      const result = await sendEmail({ shopId: shop.id, emailType: 'trial_1d', toEmail: shop.billing_email, ...content });
      results.sent.push({ shop_id: shop.tekmetric_shop_id, type: 'trial_1d', ...result });
    }

    // Expired (in grace) — trial_expires_at is in the past, but less than 36 hours ago
    const { data: shopsExpired } = await supabase
      .from('shops')
      .select('*')
      .eq('plan_tier', 'trial')
      .lt('trial_expires_at', new Date().toISOString())
      .gt('trial_expires_at', new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString());

    for (const shop of (shopsExpired || [])) {
      const lockoutAt = new Date(new Date(shop.trial_expires_at).getTime() + 36 * 60 * 60 * 1000).toISOString();
      const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`;
      const content = trialExpiredGraceEmail({ shopName: shop.shop_name || 'Your shop', lockoutAt, checkoutUrl });
      const result = await sendEmail({ shopId: shop.id, emailType: 'trial_expired', toEmail: shop.billing_email, ...content });
      results.sent.push({ shop_id: shop.tekmetric_shop_id, type: 'trial_expired', ...result });
    }

    // Locked — trial_expires_at + 36h is in the past
    const { data: shopsLocked } = await supabase
      .from('shops')
      .select('*')
      .eq('plan_tier', 'trial')
      .lt('trial_expires_at', new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString());

    for (const shop of (shopsLocked || [])) {
      const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`;
      const content = trialLockedEmail({ shopName: shop.shop_name || 'Your shop', checkoutUrl });
      const result = await sendEmail({ shopId: shop.id, emailType: 'trial_locked', toEmail: shop.billing_email, ...content });
      results.sent.push({ shop_id: shop.tekmetric_shop_id, type: 'trial_locked', ...result });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[cron/trial-reminders] Error:', err);
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}
