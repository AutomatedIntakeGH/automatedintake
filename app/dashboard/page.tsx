import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Recorder } from '@/components/recorder'

const TRADE_LABELS: Record<string, string> = {
  auto:        'Auto Repair',
  hvac:        'HVAC',
  plumbing:    'Plumbing',
  electrical:  'Electrical',
  roofing:     'Roofing',
  landscaping: 'Landscaping',
  contractor:  'General Contractor',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.trade) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">
          Automated<span className="text-[#06B6D4]">Intake</span>
        </h1>
        <span className="text-slate-500 text-sm">{TRADE_LABELS[profile.trade] ?? profile.trade}</span>
      </header>

      <main className="flex-1 px-4 pt-8 pb-10 max-w-lg mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-white text-xl font-semibold">New Work Order</h2>
          <p className="text-slate-500 text-sm mt-1">
            Tap Start, talk through the customer&apos;s concerns, then tap Stop.
          </p>
        </div>

        <Recorder userId={user.id} trade={profile.trade} />
      </main>
    </div>
  )
}
