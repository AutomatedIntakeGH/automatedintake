import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase.js';
import { authenticateRequest } from '@/lib/jwt.js';

/**
 * POST /api/admin/grant
 * Admin-only endpoint for manual operations:
 * - grant_lifetime: give a shop lifetime access
 * - extend_trial: add N days to trial
 * - revoke: revoke access
 * - manual_license: manually create a paid license
 *
 * Auth: JWT must be for an email in ADMIN_EMAILS env var.
 */
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check admin privilege — look up the shop's billing_email or use a separate admin check
    // For simplicity, admin tokens are issued to emails in ADMIN_EMAILS
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

    // We need to verify the token holder is an admin.
    // The JWT has shop_id, but admin calls might not be shop-specific.
    // Alternative: check if the token was issued for an admin email.
    // For now, we'll accept a special admin_email field in the JWT payload.
    const callerEmail = auth.payload.email || '';
    if (!adminEmails.includes(callerEmail.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { tekmetric_shop_id, action, params, reason } = body;

    if (!tekmetric_shop_id || !action) {
      return NextResponse.json({ error: 'Missing tekmetric_shop_id or action' }, { status: 400 });
    }

    // Find shop
    const { data: shop } = await supabase
      .from('shops')
      .select('*')
      .eq('tekmetric_shop_id', tekmetric_shop_id)
      .single();

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const beforeState = { plan_tier: shop.plan_tier, trial_expires_at: shop.trial_expires_at };
    let updateData = {};

    switch (action) {
      case 'grant_lifetime':
        updateData = { plan_tier: 'lifetime', revoked_at: null, revoked_reason: null };
        break;

      case 'extend_trial': {
        const days = params?.days || 30;
        const currentExpiry = shop.trial_expires_at ? new Date(shop.trial_expires_at) : new Date();
        const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
        updateData = {
          plan_tier: 'trial',
          trial_expires_at: newExpiry.toISOString(),
          revoked_at: null,
        };
        break;
      }

      case 'revoke':
        updateData = {
          plan_tier: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_reason: reason || 'Admin revoked',
        };
        break;

      case 'manual_license': {
        const tier = params?.tier || 'founding';
        updateData = {
          plan_tier: tier,
          paid_started_at: new Date().toISOString(),
          revoked_at: null,
        };
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Apply update
    await supabase.from('shops').update(updateData).eq('id', shop.id);

    // Audit log
    await supabase.from('audit_log').insert({
      shop_id: shop.id,
      actor_email: callerEmail,
      action,
      before_state: beforeState,
      after_state: updateData,
      reason: reason || null,
    });

    return NextResponse.json({ success: true, shop_id: shop.id, action, applied: updateData });
  } catch (err) {
    console.error('[admin/grant] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
