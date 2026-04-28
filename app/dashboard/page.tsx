import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Recorder } from '@/components/recorder'
import Link from 'next/link'
import { isAtLimit, PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan } from '@/lib/types'

const TRADE_LABELS: Record<string, string> = {
  auto:        'Auto Repair',
  hvac:        'HVAC',
  plumbing:    'Plumbing',
  electrical:  'Electrical',
  roofing:     'Roofing',
  landscaping: 'Landscaping',
  contractor:  'General Contractor',
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.trade) redirect('/onboarding')

  const plan        = (profile.plan ?? 'free') as Plan
  const usedCount   = profile.monthly_wo_count ?? 0
  const limit       = PLAN_LIMITS[plan]
  const atLimit     = isAtLimit(plan, usedCount)
  const params      = await searchParams
  const justUpgraded = params.upgraded === '1'

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">
          Automated<span className="text-[#06B6D4]">Intake</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm">{TRADE_LABELS[profile.trade] ?? profile.trade}</span>
          {plan === 'free' && (
            <Link href="/upgrade" className="text-xs px-2.5 py-1 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 hover:bg-[#06B6D4]/20 transition-colors">
              Upgrade
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pt-8 pb-10 max-w-lg mx-auto w-full">

        {justUpgraded && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <p className="text-green-400 text-sm font-medium">You&apos;re on {plan.charAt(0).toUpperCase() + plan.slice(1)}. Unlimited work orders unlocked.</p>
          </div>
        )}

        {plan === 'free' && (
          <div className="mb-6 bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              <span className="text-white font-semibold">{usedCount}</span>
              <span className="text-slate-500"> / {limit} free WOs this month</span>
            </p>
            <Link href="/upgrade" className="text-[#06B6D4] text-xs font-medium hover:underline">
              Go unlimited →
            </Link>
          </div>
        )}

        {atLimit ? (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-6 text-center space-y-3">
              <p className="text-amber-400 font-semibold">You&apos;ve hit your free limit</p>
              <p className="text-slate-400 text-sm">5 work orders used this month. Upgrade to keep going — no limits, ever.</p>
              <Link
                href="/upgrade"
                className="block w-full py-3 bg-[#06B6D4] hover:bg-[#0891b2] rounded-xl text-white font-bold text-sm transition-colors"
              >
                Upgrade — from $29/mo
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-white text-xl font-semibold">New Work Order</h2>
              <p className="text-slate-500 text-sm mt-1">
                Tap Start, talk through the customer&apos;s concerns, then tap Stop.
              </p>
            </div>
            <Recorder userId={user.id} trade={profile.trade} />
          </>
        )}

      </main>
    </div>
  )
}
