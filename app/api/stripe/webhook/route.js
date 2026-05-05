import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe.js';
import { supabase } from '@/lib/supabase.js';
import { sendEmail } from '@/lib/email.js';
import { paidWelcomeEmail, subscriptionCanceledEmail, paymentFailedEmail } from '@/lib/emails.js';

// Disable Next.js body parsing — Stripe needs the raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[stripe/webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Idempotency check
    const { error: idempError } = await supabase.from('stripe_events').insert({
      id: event.id,
      event_type: event.type,
    });
    if (idempError && idempError.code === '23505') {
      // Already processed this event
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Route by event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        // Just log it — no state change needed (subscription.updated handles period rollover)
        break;

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe/webhook] Error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session) {
  const tekmetricShopId = session.metadata?.tekmetric_shop_id;
  if (!tekmetricShopId) {
    console.error('[stripe/webhook] checkout.session.completed missing tekmetric_shop_id in metadata');
    return;
  }

  // Determine plan tier from the price ID
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;
  let planTier = 'founding'; // default
  if (priceId === process.env.STRIPE_PRICE_STANDARD_169) planTier = 'standard_169';
  else if (priceId === process.env.STRIPE_PRICE_STANDARD_199) planTier = 'standard_199';
  else if (priceId === process.env.STRIPE_PRICE_FOUNDING) planTier = 'founding';

  // Get subscription details
  let currentPeriodEnd = null;
  if (session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription);
    currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
  }

  // Update shop record
  const { data: shop } = await supabase
    .from('shops')
    .update({
      plan_tier: planTier,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      paid_started_at: new Date().toISOString(),
      current_period_end: currentPeriodEnd,
      canceled_at: null, // clear any previous cancellation
    })
    .eq('tekmetric_shop_id', tekmetricShopId)
    .select()
    .single();

  if (!shop) {
    console.error(`[stripe/webhook] No shop found for tekmetric_shop_id: ${tekmetricShopId}`);
    return;
  }

  // Send welcome email
  const planNames = { founding: 'Founding Shop', standard_169: 'Standard', standard_199: 'Standard' };
  const prices = { founding: '$99', standard_169: '$169', standard_199: '$199' };
  const portalUrl = `${process.env.APP_URL}/api/customer-portal`;

  const emailContent = paidWelcomeEmail({
    shopName: shop.shop_name || 'Your shop',
    planName: planNames[planTier] || planTier,
    price: prices[planTier] || planTier,
    nextBillingDate: currentPeriodEnd || new Date().toISOString(),
    portalUrl,
  });

  await sendEmail({
    shopId: shop.id,
    emailType: 'paid_welcome',
    toEmail: shop.billing_email,
    ...emailContent,
  });
}

async function handleSubscriptionUpdated(subscription) {
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  // Find shop by stripe_subscription_id
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!shop) return;

  // Update period end
  await supabase
    .from('shops')
    .update({ current_period_end: currentPeriodEnd })
    .eq('id', shop.id);
}

async function handleSubscriptionDeleted(subscription) {
  const { data: shop } = await supabase
    .from('shops')
    .select('id, shop_name, billing_email, tekmetric_shop_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!shop) return;

  const now = new Date().toISOString();
  await supabase
    .from('shops')
    .update({ canceled_at: now })
    .eq('id', shop.id);

  // Send cancellation email
  const accessEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const checkoutUrl = `${process.env.APP_URL}/api/checkout/session?shop_id=${shop.tekmetric_shop_id}&tier=founding`;

  const emailContent = subscriptionCanceledEmail({
    shopName: shop.shop_name || 'Your shop',
    accessEndsAt,
    checkoutUrl,
  });

  await sendEmail({
    shopId: shop.id,
    emailType: 'subscription_canceled',
    toEmail: shop.billing_email,
    ...emailContent,
  });
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: shop } = await supabase
    .from('shops')
    .select('id, shop_name, billing_email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!shop) return;

  const portalUrl = `${process.env.APP_URL}/api/customer-portal`;
  const emailContent = paymentFailedEmail({
    shopName: shop.shop_name || 'Your shop',
    portalUrl,
  });

  await sendEmail({
    shopId: shop.id,
    emailType: 'payment_failed',
    toEmail: shop.billing_email,
    ...emailContent,
  });
}
