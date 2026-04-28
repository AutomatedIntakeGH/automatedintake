'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TemplateBar } from '@/components/template-bar'
import { Recorder } from '@/components/recorder'
import type { Plan, Trade } from '@/lib/types'

interface DashboardShellProps {
  userId: string
  trade: Trade
  plan: Plan
  defaultTemplate: string
  atLimit: boolean
  justUpgraded: boolean
  usedCount: number
  limit: number
}

export function DashboardShell({
  userId,
  trade,
  plan,
  defaultTemplate,
  atLimit,
  justUpgraded,
  usedCount,
  limit,
}: DashboardShellProps) {
  const [template, setTemplate] = useState(defaultTemplate)

  return (
    <>
      <TemplateBar userId={userId} selected={template} onChange={setTemplate} />

      <main className="flex-1 px-4 pt-6 pb-10 max-w-lg mx-auto w-full">

        {justUpgraded && (
          <div className="mb-5 rounded-xl px-4 py-3" style={{ background: '#06D6A010', border: '1px solid #06D6A030' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              You&apos;re on {plan.charAt(0).toUpperCase() + plan.slice(1)}. Unlimited work orders unlocked.
            </p>
          </div>
        )}

        {plan === 'free' && (
          <div className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{usedCount}</span>
              <span style={{ color: 'var(--text-muted)' }}> / {limit} free WOs this month</span>
            </p>
            <Link href="/upgrade" className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              Go unlimited →
            </Link>
          </div>
        )}

        {atLimit ? (
          <div className="rounded-2xl px-5 py-6 text-center space-y-3" style={{ background: '#F5A62310', border: '1px solid #F5A62330' }}>
            <p className="font-semibold" style={{ color: '#F5A623' }}>You&apos;ve hit your free limit</p>
            <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
              5 work orders used this month. Upgrade to keep going — no limits, ever.
            </p>
            <Link
              href="/upgrade"
              className="block w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Upgrade — from $29/mo
            </Link>
          </div>
        ) : (
          <Recorder userId={userId} trade={trade} template={template} />
        )}

      </main>
    </>
  )
}
