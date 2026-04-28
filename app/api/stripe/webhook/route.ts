import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role to bypass RLS for webhook updates
function adminClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_SOLO_PRICE_ID!]: 'solo',
  [process.env.STRIPE_PRO_PRICE_ID!]:  'pro',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = adminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.user_id
        const plan    = session.metadata?.plan
        if (!userId || !plan) break

        await supabase
          .from('profiles')
          .update({
            plan: plan as 'solo' | 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const plan    = PRICE_TO_PLAN[priceId] ?? 'free'

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ plan: plan as 'free' | 'solo' | 'pro', stripe_subscription_id: sub.id })
            .eq('id', profile.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ plan: 'free', stripe_subscription_id: null })
            .eq('id', profile.id)
        }
        break
      }
    }
  } catch (err) {
    console.error('[webhook] handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
