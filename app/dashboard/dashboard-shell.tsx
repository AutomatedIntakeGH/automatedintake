'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TemplateBar } from '@/components/template-bar'
import { Recorder } from '@/components/recorder'
import { WOCard } from '@/components/wo-card'
import type { Plan, Trade } from '@/lib/types'
import type { WOCardData } from '@/lib/wo-utils'

interface DashboardShellProps {
  userId: string
  trade: Trade
  plan: Plan
  defaultTemplate: string
  atLimit: boolean
  justUpgraded: boolean
  usedCount: number
  limit: number
  recentWOs: WOCardData[]
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
  recentWOs,
}: DashboardShellProps) {
  const [template, setTemplate] = useState(defaultTemplate)
  const router = useRouter()

  return (
    <>
      <TemplateBar userId={userId} selected={template} onChange={setTemplate} />

      <main style={{ flex: 1, padding: '14px 16px 32px', maxWidth: 640, width: '100%', alignSelf: 'center' }}>

        {justUpgraded && (
          <div style={{ marginBottom: 14, borderRadius: 12, padding: '10px 14px', background: '#06D6A010', border: '1px solid #06D6A030' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              You&apos;re on {plan.charAt(0).toUpperCase() + plan.slice(1)}. Unlimited work orders unlocked.
            </p>
          </div>
        )}

        {plan === 'free' && (
          <div style={{ marginBottom: 14, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{usedCount}</span>
              <span style={{ color: 'var(--text-muted)' }}> / {limit} free WOs this month</span>
            </p>
            <Link href="/upgrade" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>
              Go unlimited →
            </Link>
          </div>
        )}

        {atLimit ? (
          <div style={{ borderRadius: 16, padding: '24px 20px', textAlign: 'center', background: '#F5A62310', border: '1px solid #F5A62330' }}>
            <p style={{ fontWeight: 600, color: '#F5A623', marginBottom: 8 }}>You&apos;ve hit your free limit</p>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16 }}>5 work orders used this month. Upgrade to keep going — no limits, ever.</p>
            <Link href="/upgrade" style={{ display: 'block', padding: '14px', borderRadius: 12, background: 'var(--accent)', color: 'var(--bg-primary)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Upgrade — from $29/mo
            </Link>
          </div>
        ) : (
          <Recorder userId={userId} trade={trade} template={template} />
        )}

        {/* Search bar */}
        <button
          onClick={() => router.push('/history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-em)',
            borderRadius: 12,
            padding: '10px 14px',
            marginTop: 20,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A6A88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ fontSize: 14, color: '#4A6A88' }}>Search work orders...</span>
        </button>

        {/* Recent WOs */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2A3E55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Recent Work Orders
            </span>
            {recentWOs.length > 0 && (
              <Link href="/history" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                View all →
              </Link>
            )}
          </div>

          {recentWOs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 10, textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1A2535" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)' }}>
                Your first work order is one tap away.
              </p>
              <p style={{ fontSize: 13, color: '#2A3E55' }}>
                Tap the button above and start talking.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentWOs.map(wo => (
                <WOCard key={wo.id} wo={wo} />
              ))}
            </div>
          )}
        </div>

      </main>
    </>
  )
}
