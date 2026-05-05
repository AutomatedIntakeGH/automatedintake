import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase.js';
import { authenticateRequest } from '@/lib/jwt.js';

/**
 * GET /api/me
 * Returns current shop state for the extension UI render.
 * Combines license/verify info + display fields in one call.
 */
export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { shop_id } = auth.payload;

    const { data: shop, error } = await supabase
      .from('shop_status')
      .select('*')
      .eq('id', shop_id)
      .single();

    if (error || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Days remaining
    let daysRemaining = null;
    if (shop.effective_expires_at) {
      const ms = new Date(shop.effective_expires_at).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    }

    // Device count
    const { count: deviceCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop_id)
      .eq('active', true);

    return NextResponse.json({
      shop: {
        id: shop.id,
        tekmetric_shop_id: shop.tekmetric_shop_id,
        shop_name: shop.shop_name,
        billing_email: shop.billing_email,
        plan_tier: shop.plan_tier,
        status: shop.status,
        expires_at: shop.effective_expires_at,
        days_remaining: daysRemaining,
        trial_started_at: shop.trial_started_at,
        paid_started_at: shop.paid_started_at,
        canceled_at: shop.canceled_at,
      },
      devices: { active_count: deviceCount || 0 },
    });
  } catch (err) {
    console.error('[me] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
