'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Trade } from '@/lib/types'

/* ── SVG icons ── */
function WrenchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
}
function WaveformIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="2 12 5 6 8 16 11 8 14 14 17 4 20 12 22 12"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function LightningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}
function HouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  )
}
function PlusCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#06D6A0"/>
      <path d="M8 12l3 3 5-5" stroke="#0A0E14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Data ── */
const INDUSTRIES: {
  id: Trade
  label: string
  descriptor: string
  accent: string
  Icon: () => JSX.Element
}[] = [
  { id: 'auto',          label: 'Automotive',      descriptor: 'Repair orders & diagnostics',  accent: '#06D6A0', Icon: WrenchIcon     },
  { id: 'hvac',          label: 'HVAC',             descriptor: 'Service tickets & inspections', accent: '#F5A623', Icon: WaveformIcon   },
  { id: 'plumbing',      label: 'Plumbing',         descriptor: 'Job sheets & service calls',    accent: '#4A9EFF', Icon: ClockIcon      },
  { id: 'electrical',    label: 'Electrical',       descriptor: 'Work orders & panels',          accent: '#A78BFA', Icon: LightningIcon  },
  { id: 'home_services', label: 'Home Services',    descriptor: 'Projects, repairs & estimates', accent: '#FF6B6B', Icon: HouseIcon      },
  { id: 'receptionist',  label: 'Receptionist',     descriptor: 'Client intake & call notes',    accent: '#22D3EE', Icon: BriefcaseIcon  },
  { id: 'medical',       label: 'Medical / Dental', descriptor: 'Patient intake & notes',        accent: '#FB7185', Icon: PlusCircleIcon },
]

const TEMPLATES = [
  { id: 'Repair Order',     descriptor: 'Formal RO · Vehicle + concerns + authorization'        },
  { id: 'Work Order',       descriptor: 'Field job · Property + labor + materials'               },
  { id: 'General Notes',    descriptor: 'Free-form · Bullet summary + key takeaways'             },
  { id: 'Situation Detail', descriptor: 'Who/what/when/where/why · Incidents & claims'           },
  { id: 'Estimate Request', descriptor: 'Scope + materials + cost ranges'                        },
  { id: 'Client Intake',    descriptor: 'Symptoms + history + concerns + follow-up'              },
]

/* ── Page ── */
export default function OnboardingPage() {
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [trade, setTrade]       = useState<Trade | null>(null)
  const [template, setTemplate] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleComplete() {
    if (!trade || !template || loading) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email!,
      trade,
      default_template: template,
      onboarded: true,
    })
    router.push('/dashboard')
  }

  return (
    <div
      className="flex flex-col px-5 py-8"
      style={{ background: 'var(--bg-primary)', minHeight: '100dvh' }}
    >
      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {([1, 2, 3] as const).map(n => (
          <div
            key={n}
            style={{
              height: 8,
              width: n === step ? 28 : 8,
              borderRadius: 4,
              background: n <= step ? 'var(--accent)' : 'var(--border-em)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* ── Step 1: Welcome ── */}
      {step === 1 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-7">
          <div>
            <p
              className="font-display font-black leading-none"
              style={{ fontSize: 48, letterSpacing: '-1px' }}
            >
              <span style={{ color: 'var(--accent)' }}>Automated</span>
              <br />
              <span style={{ color: 'var(--accent-blue)' }}>Intake</span>
            </p>
          </div>

          <div className="space-y-3 max-w-xs">
            <h1
              className="font-display font-black"
              style={{ fontSize: 32, color: 'var(--text-primary)' }}
            >
              Voice in.<br />Work order out.
            </h1>
            <p className="text-base font-medium" style={{ color: 'var(--text-sec)' }}>
              Stop typing. Stop losing details.<br />Tap once and talk.
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full max-w-xs font-bold rounded-2xl"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              fontSize: 18,
              padding: '16px 24px',
              minHeight: 56,
            }}
          >
            Get Started →
          </button>
        </div>
      )}

      {/* ── Step 2: Industry picker ── */}
      {step === 2 && (
        <div className="flex flex-col flex-1">
          <div className="mb-5">
            <h2
              className="font-display font-black"
              style={{ fontSize: 28, color: 'var(--text-primary)' }}
            >
              What&apos;s your trade?
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-sec)' }}>
              You can change this anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto">
            {INDUSTRIES.map(ind => {
              const sel = trade === ind.id
              return (
                <button
                  key={ind.id}
                  onClick={() => setTrade(ind.id)}
                  className="relative flex flex-col items-start p-4 text-left"
                  style={{
                    background: sel ? '#06D6A00C' : 'var(--bg-input)',
                    border: `1px solid ${sel ? 'var(--border-active)' : 'var(--border-em)'}`,
                    borderRadius: 12,
                    minHeight: 96,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {sel && (
                    <span className="absolute top-2.5 right-2.5">
                      <CheckIcon />
                    </span>
                  )}
                  <span
                    className="flex items-center justify-center rounded-lg mb-2.5"
                    style={{
                      width: 36,
                      height: 36,
                      background: `${ind.accent}18`,
                      color: ind.accent,
                    }}
                  >
                    <ind.Icon />
                  </span>
                  <span
                    className="font-bold text-sm block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {ind.label}
                  </span>
                  <span
                    className="text-xs mt-0.5 block leading-snug"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {ind.descriptor}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => { if (trade) setStep(3) }}
            disabled={!trade}
            className="w-full font-bold rounded-2xl mt-auto"
            style={{
              background: trade ? 'var(--accent)' : 'var(--bg-surface)',
              color: trade ? 'var(--bg-primary)' : 'var(--text-muted)',
              fontSize: 18,
              padding: '16px 24px',
              minHeight: 56,
              opacity: trade ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 3: Template picker ── */}
      {step === 3 && (
        <div className="flex flex-col flex-1">
          <div className="mb-5">
            <h2
              className="font-display font-black"
              style={{ fontSize: 28, color: 'var(--text-primary)' }}
            >
              What do you output?
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-sec)' }}>
              This is your default. Switch anytime per recording.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mb-6">
            {TEMPLATES.map(t => {
              const sel = template === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="flex items-center justify-between p-4 w-full text-left"
                  style={{
                    background: sel ? '#06D6A00C' : 'var(--bg-input)',
                    border: `1px solid ${sel ? 'var(--border-active)' : 'var(--border-em)'}`,
                    borderRadius: 12,
                    minHeight: 60,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div>
                    <span
                      className="font-bold text-sm block"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t.id}
                    </span>
                    <span
                      className="text-xs mt-0.5 block"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {t.descriptor}
                    </span>
                  </div>
                  {sel && (
                    <span className="flex-shrink-0 ml-3">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleComplete}
            disabled={!template || loading}
            className="w-full font-bold rounded-2xl mt-auto"
            style={{
              background: template && !loading ? 'var(--accent)' : 'var(--bg-surface)',
              color: template && !loading ? 'var(--bg-primary)' : 'var(--text-muted)',
              fontSize: 17,
              padding: '16px 24px',
              minHeight: 56,
              opacity: template ? 1 : 0.5,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Setting up...' : 'Start Using AutomatedIntake →'}
          </button>
        </div>
      )}
    </div>
  )
}
