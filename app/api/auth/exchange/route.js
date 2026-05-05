import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase.js';
import { signToken } from '@/lib/jwt.js';
import { exchangeGoogleCode } from '@/lib/google.js';

/**
 * POST /api/auth/exchange
 * Extension sends Google auth code + Tekmetric shop ID.
 * Backend exchanges with Google, finds existing shop, returns JWT.
 * Does NOT create a shop — that's /api/trial/start.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { google_auth_code, tekmetric_shop_id, tekmetric_subdomain, device_fingerprint, user_agent } = body;

    if (!google_auth_code || !tekmetric_shop_id || !device_fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields: google_auth_code, tekmetric_shop_id, device_fingerprint' },
        { status: 400 }
      );
    }

    // Validate tekmetric_shop_id is numeric
    if (!/^\d+$/.test(tekmetric_shop_id)) {
      return NextResponse.json({ error: 'Invalid tekmetric_shop_id' }, { status: 400 });
    }

    // Exchange Google code for user info
    // The redirect_uri must match what the extension used in chrome.identity.launchWebAuthFlow
    const redirectUri = body.redirect_uri || `https://${process.env.GOOGLE_OAUTH_CLIENT_ID.split('.')[0]}.chromiumapp.org/`;
    let googleUser;
    try {
      googleUser = await exchangeGoogleCode(google_auth_code, redirectUri);
    } catch (err) {
      return NextResponse.json({ error: `Google auth failed: ${err.message}` }, { status: 401 });
    }

    // Look up shop by Tekmetric shop ID (NOT by email — per business-Google-account spec)
    const { data: shop, error: shopError } = await supabase
      .from('shop_status')
      .select('*')
      .eq('tekmetric_shop_id', tekmetric_shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'no_shop', message: "No license found for this shop. Click 'Start Free Trial' to begin." },
        { status: 404 }
      );
    }

    // Register or update device
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || null;
    await supabase.from('devices').upsert(
      {
        shop_id: shop.id,
        device_fingerprint,
        last_google_email: googleUser.email,
        user_agent: user_agent || null,
        last_heartbeat_at: new Date().toISOString(),
        last_ip: clientIp,
      },
      { onConflict: 'shop_id,device_fingerprint' }
    );

    // Issue JWT
    const token = await signToken({
      shop_id: shop.id,
      plan_tier: shop.plan_tier,
      tekmetric_shop_id: shop.tekmetric_shop_id,
    });

    // Log usage
    await supabase.from('usage_log').insert({
      shop_id: shop.id,
      event_type: 'auth_exchange',
      metadata: { google_email: googleUser.email },
    });

    return NextResponse.json({
      token,
      shop: {
        id: shop.id,
        tekmetric_shop_id: shop.tekmetric_shop_id,
        shop_name: shop.shop_name,
        billing_email: shop.billing_email,
        plan_tier: shop.plan_tier,
        status: shop.status,
        expires_at: shop.effective_expires_at,
      },
    });
  } catch (err) {
    console.error('[auth/exchange] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
