import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe.js';
import { supabase } from '@/lib/supabase.js';
import { authenticateRequest } from '@/lib/jwt.js';

/**
 * POST /api/customer-portal
 * Generates a Stripe Customer Portal URL for the authenticated shop.
 * Extension opens the returned URL in a new tab.
 */
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { shop_id } = auth.payload;

    // Look up shop
    const { data: shop } = await supabase
      .from('shops')
      .select('stripe_customer_id')
      .eq('id', shop_id)
      .single();

    if (!shop || !shop.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription on file. Start a trial or subscribe first.' },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: shop.stripe_customer_id,
      return_url: process.env.APP_URL,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[customer-portal] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
