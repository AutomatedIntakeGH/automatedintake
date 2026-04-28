import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UpgradeButtons from './upgrade-buttons'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, monthly_wo_count')
    .eq('id', user.id)
    .single()

  const currentPlan = profile?.plan ?? 'free'
  const usedCount   = profile?.monthly_wo_count ?? 0

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="px-4 py-4 border-b border-slate-800">
        <h1 className="text-white font-bold text-lg">
          Automated<span className="text-[#06B6D4]">Intake</span>
        </h1>
      </header>

      <main className="flex-1 px-4 pt-8 pb-12 max-w-lg mx-auto w-full">

        {currentPlan === 'free' && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <p className="text-amber-400 text-sm font-medium">
              You&apos;ve used {usedCount} of 5 free work orders this month.
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Upgrade to keep going — no limits.
            </p>
          </div>
        )}

        <h2 className="text-white text-2xl font-bold mb-2">Choose a plan</h2>
        <p className="text-slate-500 text-sm mb-8">Cancel anytime. No contracts.</p>

        <div className="space-y-4">

          {/* Solo */}
          <div className={`rounded-2xl border p-5 space-y-4 ${currentPlan === 'solo' ? 'border-[#06B6D4] bg-[#06B6D4]/5' : 'border-slate-700 bg-slate-800/50'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg">Solo</h3>
                  {currentPlan === 'solo' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4]">Current plan</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  Perfect for solo advisors &amp; owner-operators.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-white text-2xl font-bold">$29</span>
                <span className="text-slate-500 text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {[
                'Unlimited work orders',
                'Voice-to-RO for all 7 trades',
                'PDF & email export',
                'All trade templates',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="text-[#06B6D4] text-base leading-none">✓</span> {f}
                </li>
              ))}
            </ul>
            <UpgradeButtons plan="solo" currentPlan={currentPlan} />
          </div>

          {/* Pro */}
          <div className={`rounded-2xl border p-5 space-y-4 ${currentPlan === 'pro' ? 'border-[#06B6D4] bg-[#06B6D4]/5' : 'border-slate-700 bg-slate-800/50'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-lg">Pro</h3>
                  {currentPlan === 'pro' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4]">Current plan</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  For growing workshops &amp; teams.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-white text-2xl font-bold">$79</span>
                <span className="text-slate-500 text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-1.5">
              {[
                'Everything in Solo',
                'Up to 3 team members',
                'Webhook integrations',
                'Customer history',
                'Photo input (AI vision)',
                'Priority support',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="text-[#06B6D4] text-base leading-none">✓</span> {f}
                </li>
              ))}
            </ul>
            <UpgradeButtons plan="pro" currentPlan={currentPlan} />
          </div>

          {/* Free tier note */}
          <p className="text-slate-600 text-xs text-center pt-2">
            Free plan: 5 work orders/month, no export.
          </p>
        </div>
      </main>
    </div>
  )
}
