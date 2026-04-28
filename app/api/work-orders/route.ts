import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { isAtLimit } from '@/lib/plan-limits'
import type { Plan, Database } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { trade, audioPath } = await request.json()
    if (!trade || !audioPath) return NextResponse.json({ error: 'trade and audioPath required' }, { status: 400 })

    // Check plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, monthly_wo_count, monthly_wo_reset_at')
      .eq('id', user.id)
      .single()

    const plan      = (profile?.plan ?? 'free') as Plan
    const nowMonth  = new Date().toISOString().slice(0, 7) // "2025-04"
    const resetAt   = profile?.monthly_wo_reset_at?.slice(0, 7) ?? ''
    const count     = resetAt === nowMonth ? (profile?.monthly_wo_count ?? 0) : 0

    if (isAtLimit(plan, count)) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }

    // Insert work order
    const { data: wo, error: woErr } = await supabase
      .from('work_orders')
      .insert({ user_id: user.id, trade, status: 'draft', audio_url: audioPath })
      .select('id')
      .single()

    if (woErr || !wo) {
      return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
    }

    // Increment monthly counter using service role (bypasses RLS)
    const admin = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const newCount  = count + 1
    const resetDate = new Date().toISOString()
    await admin
      .from('profiles')
      .update({
        monthly_wo_count:    newCount,
        monthly_wo_reset_at: resetAt === nowMonth ? undefined : resetDate,
      })
      .eq('id', user.id)

    return NextResponse.json({ id: wo.id })
  } catch (err) {
    console.error('[work-orders POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
