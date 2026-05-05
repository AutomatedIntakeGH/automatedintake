import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase.js';
import { signToken } from '@/lib/jwt.js';
import { exchangeGoogleCode } from '@/lib/google.js';
import { sendEmail } from '@/lib/email.js';
import { trialStartedEmail } from '@/lib/emails.js';

/**
 * POST /api/trial/start
 * Called when shop owner confirms "Yes, start my trial" in the extension modal.
 * Creates a new shop record with plan_tier = 'trial'.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      google_auth_code,
      tekmetric_shop_id,
      tekmetric_subdomain,
      shop_name_from_page,
      billing_email: billingEmailOverride,
      owner_name_optional,
      device_fingerprint,
      user_agent,
    } = body;

    if (!google_auth_code || !tekmetric_shop_id || !device_fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(tekmetric_shop_id)) {
      return NextResponse.json({ error: 'Invalid tekmetric_shop_id' }, { status: 400 });
    }

    // Exchange Google code
    const redirectUri = body.redirect_uri || `https://${process.env.GOOGLE_OAUTH_CLIENT_ID.split('.')[0]}.chromiumapp.org/`;
    let googleUser;
    try {
      googleUser = await exchangeGoogleCode(google_auth_code, redirectUri);
    } catch (err) {
      return NextResponse.json({ error: `Google auth failed: ${err.message}` }, { status: 401 });
    }

    // Check if shop already exists (trial already used)
    const { data: existingShop } = await supabase
      .from('shops')
      .select('id, plan_tier')
      .eq('tekmetric_shop_id', tekmetric_shop_id)
      .single();

    if (existingShop) {
      // Shop already exists — trial already used or already on a plan
      const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${tekmetric_shop_id}`;
      return NextResponse.json(
        {
          error: 'trial_already_used',
          message: 'This Tekmetric shop already used its 30-day free trial. Subscribe to continue.',
          checkout_url: checkoutUrl,
        },
        { status: 409 }
      );
    }

    // Create new shop with trial
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    const billingEmail = billingEmailOverride || googleUser.email;

    const { data: newShop, error: insertError } = await supabase
      .from('shops')
      .insert({
        tekmetric_shop_id,
        tekmetric_subdomain: tekmetric_subdomain || null,
        shop_name: shop_name_from_page || null,
        billing_email: billingEmail,
        owner_name: owner_name_optional || googleUser.name || null,
        owner_google_sub: googleUser.sub,
        plan_tier: 'trial',
        trial_started_at: now.toISOString(),
        trial_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Race condition: another request created it first
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'trial_already_used', message: 'Trial already started for this shop.' },
          { status: 409 }
        );
      }
      console.error('[trial/start] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create trial' }, { status: 500 });
    }

    // Register device
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || null;
    await supabase.from('devices').insert({
      shop_id: newShop.id,
      device_fingerprint,
      last_google_email: googleUser.email,
      user_agent: user_agent || null,
      last_ip: clientIp,
    });

    // Send trial started email
    const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${tekmetric_shop_id}&tier=founding`;
    const emailContent = trialStartedEmail({
      shopName: newShop.shop_name || 'Your shop',
      expiresAt: expiresAt.toISOString(),
      checkoutUrl,
    });
    await sendEmail({
      shopId: newShop.id,
      emailType: 'trial_started',
      toEmail: billingEmail,
      ...emailContent,
    });

    // Issue JWT
    const token = await signToken({
      shop_id: newShop.id,
      plan_tier: 'trial',
      tekmetric_shop_id,
    });

    // Log usage
    await supabase.from('usage_log').insert({
      shop_id: newShop.id,
      event_type: 'trial_started',
      metadata: { google_email: googleUser.email, billing_email: billingEmail },
    });

    return NextResponse.json({
      token,
      shop: {
        id: newShop.id,
        tekmetric_shop_id,
        shop_name: newShop.shop_name,
        plan_tier: 'trial',
        status: 'trial_active',
        trial_started_at: now.toISOString(),
        trial_expires_at: expiresAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[trial/start] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
