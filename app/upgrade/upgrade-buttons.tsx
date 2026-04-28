'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  plan: 'solo' | 'pro'
  currentPlan: string
}

export default function UpgradeButtons({ plan, currentPlan }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (currentPlan === plan) {
    return (
      <button disabled className="w-full py-3 rounded-xl bg-slate-700 text-slate-500 font-semibold text-sm">
        Current plan
      </button>
    )
  }

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full py-3 rounded-xl bg-[#06B6D4] hover:bg-[#0891b2] active:bg-[#0e7490] disabled:opacity-60 text-white font-bold text-sm transition-colors touch-manipulation"
    >
      {loading ? 'Redirecting...' : `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
    </button>
  )
}
