'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { WOCard } from '@/components/wo-card'
import { searchWOs, groupWOsByDate, TRADE_LABELS, type WOCardData } from '@/lib/wo-utils'

const STATUS_FILTERS = ['All', 'Draft', 'Final', 'Sent', 'Archived'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const TEMPLATE_OPTIONS = [
  'All Templates',
  'Repair Order',
  'Work Order',
  'General Notes',
  'Situation Detail',
  'Estimate Request',
  'Client Intake',
]

interface HistoryClientProps {
  wos: WOCardData[]
  initialQuery: string
}

export function HistoryClient({ wos, initialQuery }: HistoryClientProps) {
  const [query,          setQuery]          = useState(initialQuery)
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('All')
  const [templateFilter, setTemplateFilter] = useState('All Templates')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialQuery) searchRef.current?.focus()
  }, [initialQuery])

  // Filter pipeline
  let filtered = searchWOs(wos, query)
  if (statusFilter !== 'All') {
    filtered = filtered.filter(wo => wo.status.toLowerCase() === statusFilter.toLowerCase())
  }
  if (templateFilter !== 'All Templates') {
    filtered = filtered.filter(wo => wo.template === templateFilter)
  }

  const groups = groupWOsByDate(filtered)

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <header
        style={{
          height: 56,
          background: 'var(--bg-topbar)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <Link href="/dashboard" style={{ color: 'var(--text-sec)', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <span
          className="font-display font-black"
          style={{ fontSize: 18, color: 'var(--text-primary)', flex: 1 }}
        >
          History
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
          {filtered.length} WO{filtered.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* Search bar */}
      <div style={{ padding: '12px 16px 0', background: 'var(--bg-primary)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-em)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6A88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, vehicle, date..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--text-primary)',
              caretColor: 'var(--accent)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)', lineHeight: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status filter pills */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto' }}
      >
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 20,
                padding: '5px 12px',
                background: active ? '#06D6A012' : 'transparent',
                border: `1px solid ${active ? '#06D6A055' : '#1E3048'}`,
                color: active ? '#06D6A0' : '#4A6A88',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Template filter pills */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 6, paddingLeft: 16, paddingRight: 16, paddingBottom: 10, overflowX: 'auto' }}
      >
        {TEMPLATE_OPTIONS.map(t => {
          const active = templateFilter === t
          return (
            <button
              key={t}
              onClick={() => setTemplateFilter(t)}
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 20,
                padding: '4px 11px',
                background: active ? '#4A9EFF12' : 'transparent',
                border: `1px solid ${active ? '#4A9EFF55' : '#1E3048'}`,
                color: active ? '#4A9EFF' : '#3D5A78',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div style={{ flex: 1, padding: '0 16px 32px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 64,
              gap: 12,
              textAlign: 'center',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A2535" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
              {query || statusFilter !== 'All' || templateFilter !== 'All Templates'
                ? 'No work orders match your search.'
                : 'No work orders yet.'}
            </p>
            {wos.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                Tap record on the home screen to create your first one.
              </p>
            )}
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#2A3E55',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {group.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.items.map(wo => (
                  <WOCard key={wo.id} wo={wo} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
