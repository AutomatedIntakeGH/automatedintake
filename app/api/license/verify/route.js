import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase.js';
import { authenticateRequest } from '@/lib/jwt.js';

/**
 * POST /api/license/verify
 * Heartbeat endpoint. Called every 4 hours + on every recording attempt.
 * Returns current license status + banner info.
 */
export async function POST(req) {
  try {
    // Authenticate
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { shop_id } = auth.payload;

    const body = await req.json();
    const { device_fingerprint } = body;

    // Look up current shop status from the view
    const { data: shop, error } = await supabase
      .from('shop_status')
      .select('*')
      .eq('id', shop_id)
      .single();

    if (error || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Update device heartbeat
    if (device_fingerprint) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || null;
      await supabase
        .from('devices')
        .update({ last_heartbeat_at: new Date().toISOString(), last_ip: clientIp })
        .eq('shop_id', shop_id)
        .eq('device_fingerprint', device_fingerprint);
    }

    // Compute days remaining
    let daysRemaining = null;
    if (shop.effective_expires_at) {
      const msRemaining = new Date(shop.effective_expires_at).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    }

    // Compute banner
    const { showBanner, bannerSeverity, bannerMessage } = computeBanner(shop.status, daysRemaining, shop);

    // Build checkout URL for subscribe CTAs
    const checkoutUrl = (shop.status === 'trial_locked' || shop.status === 'trial_grace')
      ? `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`
      : null;

    // Log verify event (lightweight — no await needed but we'll fire it)
    supabase.from('usage_log').insert({
      shop_id,
      event_type: 'license_verify',
      metadata: { status: shop.status },
    }).then(() => {});

    return NextResponse.json({
      status: shop.status,
      plan_tier: shop.plan_tier,
      expires_at: shop.effective_expires_at,
      days_remaining: daysRemaining,
      show_banner: showBanner,
      banner_severity: bannerSeverity,
      banner_message: bannerMessage,
      checkout_url: checkoutUrl,
    });
  } catch (err) {
    console.error('[license/verify] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function computeBanner(status, daysRemaining, shop) {
  switch (status) {
    case 'trial_active':
      if (daysRemaining !== null && daysRemaining <= 7) {
        return {
          showBanner: true,
          bannerSeverity: 'warning',
          bannerMessage: `Trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Subscribe to continue.`,
        };
      }
      return { showBanner: false, bannerSeverity: null, bannerMessage: null };

    case 'trial_grace':
      return {
        showBanner: true,
        bannerSeverity: 'error',
        bannerMessage: 'Trial expired. Subscribe within 36 hours to avoid interruption.',
      };

    case 'trial_locked':
      return {
        showBanner: true,
        bannerSeverity: 'error',
        bannerMessage: 'Your trial has expired. Subscribe to continue.',
      };

    case 'paid_active':
    case 'lifetime':
      return { showBanner: false, bannerSeverity: null, bannerMessage: null };

    case 'paid_past_due':
      return {
        showBanner: true,
        bannerSeverity: 'warning',
        bannerMessage: 'Payment issue — update billing in Customer Portal.',
      };

    case 'paid_canceled': {
      const endsAt = shop.canceled_at
        ? new Date(new Date(shop.canceled_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
        : 'soon';
      return {
        showBanner: true,
        bannerSeverity: 'warning',
        bannerMessage: `Subscription canceled. Access ends ${endsAt}.`,
      };
    }

    case 'revoked':
      return {
        showBanner: true,
        bannerSeverity: 'error',
        bannerMessage: 'Access revoked. Contact support.',
      };

    default:
      return { showBanner: false, bannerSeverity: null, bannerMessage: null };
  }
}
