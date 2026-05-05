import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe.js';
import { supabase } from '@/lib/supabase.js';
import { authenticateRequest } from '@/lib/jwt.js';

/**
 * POST /api/checkout/session
 * Creates a Stripe Checkout session for a shop to subscribe.
 * Can also be called via GET with query params for simple redirect links.
 */
export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const tier = body.tier || 'founding';
    const { shop_id } = auth.payload;

    // Get shop info
    const { data: shop } = await supabase
      .from('shops')
      .select('tekmetric_shop_id, shop_name, billing_email')
      .eq('id', shop_id)
      .single();

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return createCheckoutSession(shop, tier);
  } catch (err) {
    console.error('[checkout/session] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/checkout/session?shop_id=216&tier=founding
 * Public endpoint for checkout links in emails/banners.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tekmetricShopId = searchParams.get('shop_id');
    const tier = searchParams.get('tier') || 'founding';

    if (!tekmetricShopId) {
      return NextResponse.json({ error: 'Missing shop_id parameter' }, { status: 400 });
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('tekmetric_shop_id, shop_name, billing_email')
      .eq('tekmetric_shop_id', tekmetricShopId)
      .single();

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return createCheckoutSession(shop, tier);
  } catch (err) {
    console.error('[checkout/session] GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createCheckoutSession(shop, tier) {
  // Map tier to price ID
  const priceMap = {
    founding: process.env.STRIPE_PRICE_FOUNDING,
    standard_169: process.env.STRIPE_PRICE_STANDARD_169,
    standard_199: process.env.STRIPE_PRICE_STANDARD_199,
  };
  const priceId = priceMap[tier];
  if (!priceId) {
    return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      tekmetric_shop_id: shop.tekmetric_shop_id,
      source: 'extension',
    },
    customer_email: shop.billing_email,
    success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/billing/canceled`,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    payment_method_collection: 'always',
  });

  // Return the URL — extension will open this in a new tab
  return NextResponse.json({ url: session.url, session_id: session.id });
}
