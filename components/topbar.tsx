'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trade, Plan } from '@/lib/types'

/* ── Industry data ── */
const INDUSTRIES: {
  id: Trade
  label: string
  descriptor: string
  accent: string
  icon: React.ReactElement
}[] = [
  {
    id: 'auto', label: 'Automotive', descriptor: 'Repair orders & diagnostics', accent: '#06D6A0',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  },
  {
    id: 'hvac', label: 'HVAC', descriptor: 'Service tickets & inspections', accent: '#F5A623',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="2 12 5 6 8 16 11 8 14 14 17 4 20 12 22 12"/></svg>,
  },
  {
    id: 'plumbing', label: 'Plumbing', descriptor: 'Job sheets & service calls', accent: '#4A9EFF',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    id: 'electrical', label: 'Electrical', descriptor: 'Work orders & panels', accent: '#A78BFA',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    id: 'home_services', label: 'Home Services', descriptor: 'Projects, repairs & estimates', accent: '#FF6B6B',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'receptionist', label: 'Receptionist', descriptor: 'Client intake & call notes', accent: '#22D3EE',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
  },
  {
    id: 'medical', label: 'Medical / Dental', descriptor: 'Patient intake & notes', accent: '#FB7185',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  },
]

const PLAN_LABEL: Record<Plan, string> = {
  free: 'FREE',
  solo: 'SOLO',
  pro: 'PRO',
  shop: 'SHOP',
  enterprise: 'ENT',
}

/* ── Props ── */
interface TopBarProps {
  userId: string
  trade: Trade
  plan: Plan
}

/* ── Component ── */
export function TopBar({ userId, trade: initialTrade, plan }: TopBarProps) {
  const [trade, setTrade]   = useState<Trade>(initialTrade)
  const [open, setOpen]     = useState(false)
  const buttonRef           = useRef<HTMLButtonElement>(null)
  const dropdownRef         = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  async function handleSelect(newTrade: Trade) {
    setTrade(newTrade)
    setOpen(false)
    const supabase = createClient()
    await supabase.from('profiles').update({ trade: newTrade }).eq('id', userId)
  }

  const current = INDUSTRIES.find(i => i.id === trade) ?? INDUSTRIES[0]

  return (
    <>
      {/* Top bar */}
      <header
        style={{
          height: 56,
          background: 'var(--bg-topbar)',
          borderBottom: '1px solid var(--border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        {/* Logo */}
        <span
          className="font-display font-black"
          style={{ fontSize: 22, letterSpacing: '-0.3px', lineHeight: 1 }}
        >
          <span style={{ color: 'var(--accent)' }}>Automated</span>
          <span style={{ color: 'var(--accent-blue)' }}>Intake</span>
        </span>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Industry button */}
          <button
            ref={buttonRef}
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#12192A',
              border: '1px solid var(--border-em)',
              borderRadius: 8,
              padding: '6px 11px',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: '#4A9EFF', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </span>
            <span style={{ color: '#E0EEFF', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {current.label}
            </span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4A9EFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Plan badge */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent)',
              border: '1px solid #06D6A050',
              background: '#06D6A010',
              borderRadius: 20,
              padding: '3px 10px',
              letterSpacing: '0.05em',
            }}
          >
            {PLAN_LABEL[plan]}
          </span>
        </div>
      </header>

      {/* Dropdown (rendered outside header so it can span full width) */}
      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: 57,
            left: 16,
            right: 16,
            background: 'var(--bg-input)',
            border: '1px solid #1E3048',
            borderRadius: 14,
            boxShadow: '0 12px 40px #00000080',
            zIndex: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 16px 8px',
              fontSize: 10,
              fontWeight: 800,
              color: '#2A4060',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Select your industry
          </div>

          {INDUSTRIES.map((ind, i) => (
            <button
              key={ind.id}
              onClick={() => handleSelect(ind.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '11px 16px',
                borderTop: '1px solid var(--border-default)',
                background: trade === ind.id ? '#06D6A008' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Icon wrap */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${ind.accent}22`,
                  color: ind.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {ind.icon}
              </span>

              {/* Labels */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                  {ind.label}
                </div>
                <div style={{ fontSize: 11, color: '#3D5A78', marginTop: 1 }}>
                  {ind.descriptor}
                </div>
              </div>

              {/* Active checkmark */}
              {trade === ind.id && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" fill="#06D6A0"/>
                  <path d="M8 12l3 3 5-5" stroke="#0A0E14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
