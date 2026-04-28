import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/topbar'
import { DashboardShell } from './dashboard-shell'
import { isAtLimit, PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan, Trade } from '@/lib/types'
import type { WOCardData } from '@/lib/wo-utils'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const plan            = (profile.plan            ?? 'free')          as Plan
  const trade           = (profile.trade           ?? 'auto')          as Trade
  const defaultTemplate = (profile.default_template ?? 'Repair Order') as string
  const usedCount       = profile.monthly_wo_count ?? 0
  const limit           = PLAN_LIMITS[plan]
  const atLimit         = isAtLimit(plan, usedCount)
  const params          = await searchParams
  const justUpgraded    = params.upgraded === '1'

  const { data: recentWOs } = await supabase
    .from('work_orders')
    .select('id, status, trade, template, customer, vehicle, property, concerns, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <TopBar userId={user.id} trade={trade} plan={plan} />
      <DashboardShell
        userId={user.id}
        trade={trade}
        plan={plan}
        defaultTemplate={defaultTemplate}
        atLimit={atLimit}
        justUpgraded={justUpgraded}
        usedCount={usedCount}
        limit={limit}
        recentWOs={(recentWOs ?? []) as WOCardData[]}
      />
    </div>
  )
}
