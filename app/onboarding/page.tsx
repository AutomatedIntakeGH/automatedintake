'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Trade } from '@/lib/types'

const TRADES: { id: Trade; label: string; icon: string; output: string }[] = [
  { id: 'auto',        label: 'Auto Repair',          icon: '🚗', output: 'Repair Orders' },
  { id: 'hvac',        label: 'HVAC',                 icon: '❄️', output: 'Service Tickets' },
  { id: 'plumbing',    label: 'Plumbing',             icon: '🔧', output: 'Job Sheets' },
  { id: 'electrical',  label: 'Electrical',           icon: '⚡', output: 'Work Orders' },
  { id: 'roofing',     label: 'Roofing',              icon: '🏠', output: 'Inspection Reports' },
  { id: 'landscaping', label: 'Landscaping',          icon: '🌿', output: 'Job Specs' },
  { id: 'contractor',  label: 'General Contractor',   icon: '🏗️', output: 'Job Orders' },
]

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    if (!selected) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email!,
      trade: selected,
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0F172A] px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">What kind of work do you do?</h1>
          <p className="text-slate-400 mt-2">Pick your trade — you can change it later.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {TRADES.map(trade => (
            <button
              key={trade.id}
              onClick={() => setSelected(trade.id)}
              className={`
                flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all
                min-h-[100px] text-center
                ${selected === trade.id
                  ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-white'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                }
              `}
            >
              <span className="text-3xl mb-2">{trade.icon}</span>
              <span className="font-semibold text-sm leading-tight">{trade.label}</span>
              <span className="text-xs mt-1 opacity-60">{trade.output}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleStart}
          disabled={!selected || loading}
          className="w-full h-16 text-lg font-bold bg-[#06B6D4] hover:bg-[#0891b2] text-white rounded-2xl disabled:opacity-40"
        >
          {loading ? 'Setting up...' : 'Get Started'}
        </Button>
      </div>
    </div>
  )
}
