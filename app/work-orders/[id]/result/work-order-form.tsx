'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatWorkOrder, type ExportState } from '@/lib/format-work-order'
import { formatWODate, TRADE_LABELS } from '@/lib/wo-utils'

/* ── Types ── */
type Customer = { name: string; phone: string; email: string; address: string }
type Vehicle  = { year: string; make: string; model: string; mileage: string; vin: string; plate: string }
type Property = { address: string; type: string }
type Concern  = { description: string; priority: string; when_occurs?: string; [k: string]: unknown }

type WO = {
  id: string
  trade: string
  template: string | null
  status: string
  transcript: string | null
  raw_extraction: Record<string, unknown> | null
  sentiment: string | null
  notes: string | null
  customer: Record<string, unknown> | null
  vehicle: Record<string, unknown> | null
  property: Record<string, unknown> | null
  concerns: Record<string, unknown>[] | null
  follow_up_questions: Record<string, unknown>[] | null
  created_at: string
}

/* ── Priority config ── */
const PRIORITY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  high:      { color: '#FF6B6B', bg: '#FF6B6B15', border: '#FF6B6B40' },
  emergency: { color: '#FF6B6B', bg: '#FF6B6B15', border: '#FF6B6B40' },
  urgent:    { color: '#F5A623', bg: '#F5A62315', border: '#F5A62340' },
  medium:    { color: '#F5A623', bg: '#F5A62315', border: '#F5A62340' },
  standard:  { color: '#06D6A0', bg: '#06D6A015', border: '#06D6A040' },
  low:       { color: '#06D6A0', bg: '#06D6A015', border: '#06D6A040' },
  routine:   { color: '#4A9EFF', bg: '#4A9EFF15', border: '#4A9EFF40' },
}

const PRIORITY_OPTIONS: Record<string, string[]> = {
  auto:          ['high', 'medium', 'low'],
  hvac:          ['emergency', 'urgent', 'standard'],
  plumbing:      ['emergency', 'urgent', 'standard'],
  electrical:    ['emergency', 'urgent', 'standard'],
  roofing:       ['emergency', 'urgent', 'standard'],
  landscaping:   ['urgent', 'standard'],
  contractor:    ['high', 'medium', 'low'],
  home_services: ['high', 'medium', 'low'],
  receptionist:  ['urgent', 'standard', 'low'],
  medical:       ['urgent', 'standard', 'routine'],
}

/* ── Section card ── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

/* ── Field row ── */
function Field({ label, value, onChange, multiline = false, placeholder = '', mono = false }: {
  label: string; value: string; onChange?: (v: string) => void
  multiline?: boolean; placeholder?: string; mono?: boolean
}) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-em)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    width: '100%',
    fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
    resize: 'none' as const,
    outline: 'none',
  }
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-label)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      {onChange ? (
        multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={inputStyle} />
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
        )
      ) : (
        <p style={{ fontSize: 15, fontWeight: 600, color: value ? 'var(--text-primary)' : '#2A3E55', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>
          {value || '—'}
        </p>
      )}
    </div>
  )
}

/* ── Main component ── */
export default function WorkOrderForm({ wo }: { wo: WO }) {
  const router  = useRouter()
  const ext     = (wo.raw_extraction ?? {}) as Record<string, unknown>
  const isAuto  = wo.trade === 'auto'

  /* Editing mode */
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [sending, setSending] = useState(false)

  /* Transcript */
  const [showTranscript, setShowTranscript] = useState(false)

  /* Customer — merge DB column + raw_extraction, support caller/patient alias */
  const rawCust = (wo.customer ?? ext.customer ?? ext.caller ?? ext.patient ?? {}) as Partial<Customer & Record<string, unknown>>
  const [customer, setCustomer] = useState<Customer>({
    name:    String(rawCust.name    ?? ''),
    phone:   String(rawCust.phone   ?? ''),
    email:   String(rawCust.email   ?? ''),
    address: String(rawCust.address ?? ''),
  })

  /* Vehicle */
  const rawVeh = (wo.vehicle ?? ext.vehicle ?? {}) as Partial<Vehicle>
  const [vehicle, setVehicle] = useState<Vehicle>({
    year:    String(rawVeh.year    ?? ''),
    make:    String(rawVeh.make    ?? ''),
    model:   String(rawVeh.model   ?? ''),
    mileage: String(rawVeh.mileage ?? ''),
    vin:     String(rawVeh.vin     ?? ''),
    plate:   String(rawVeh.plate   ?? ''),
  })

  /* Property */
  const rawProp = (wo.property ?? ext.property ?? {}) as Partial<Property>
  const [property, setProperty] = useState<Property>({
    address: String(rawProp.address ?? ''),
    type:    String(rawProp.type    ?? ''),
  })

  /* Concerns */
  const defaultPriority = PRIORITY_OPTIONS[wo.trade]?.[0] ?? 'standard'
  const [concerns, setConcerns] = useState<Concern[]>(() => {
    const raw = (wo.concerns ?? ext.concerns) as Concern[] | null
    if (!Array.isArray(raw) || raw.length === 0) return [{ description: '', priority: defaultPriority }]
    return raw.map(c => ({
      description: String(c.description ?? ''),
      priority:    String(c.priority    ?? defaultPriority),
      when_occurs: c.when_occurs != null ? String(c.when_occurs) : '',
    }))
  })

  /* Follow-up questions */
  const [followUps, setFollowUps] = useState<string[]>(() => {
    const raw = (wo.follow_up_questions ?? ext.follow_up_questions)
    if (!Array.isArray(raw)) return []
    return raw.map(q => typeof q === 'string' ? q : String((q as Record<string, unknown>).question ?? q))
  })

  /* Notes & sentiment */
  const [notes,     setNotes]     = useState(String(ext.advisor_notes ?? ext.tech_notes ?? wo.notes ?? ''))
  const [sentiment, setSentiment] = useState(String(ext.sentiment ?? wo.sentiment ?? 'neutral'))
  const [status,    setStatus]    = useState(wo.status)

  /* ── Save ── */
  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('work_orders')
      .update({
        customer:            customer as Record<string, unknown>,
        vehicle:             vehicle  as Record<string, unknown>,
        property:            property as Record<string, unknown>,
        concerns:            concerns as Record<string, unknown>[],
        follow_up_questions: followUps.filter(Boolean).map(q => ({ question: q })),
        notes,
        sentiment,
        raw_extraction: { ...ext, customer, vehicle, property, concerns, follow_up_questions: followUps, advisor_notes: notes, tech_notes: notes, sentiment },
      })
      .eq('id', wo.id)
    setSaving(false)
    setEditing(false)
    toast.success('Work order saved')
  }

  /* ── Send (mark as sent) ── */
  async function handleSend() {
    setSending(true)
    const supabase = createClient()
    await supabase.from('work_orders').update({ status: 'sent' }).eq('id', wo.id)
    setStatus('sent')
    setSending(false)
    toast.success('Marked as sent')
  }

  /* ── Auto-save notes on blur ── */
  async function saveNotes(val: string) {
    setNotes(val)
    const supabase = createClient()
    await supabase.from('work_orders').update({ notes: val }).eq('id', wo.id)
  }

  /* ── Export ── */
  function getExportState(): ExportState {
    return { trade: wo.trade, customer, vehicle, property, concerns, followUps, notes, sentiment }
  }
  async function handleCopy() {
    await navigator.clipboard.writeText(formatWorkOrder(getExportState()))
    toast.success('Copied to clipboard')
  }
  function handleEmail() {
    const state   = getExportState()
    const subject = encodeURIComponent(isAuto
      ? `Work Order — ${[state.vehicle.year, state.vehicle.make, state.vehicle.model].filter(Boolean).join(' ')} — ${state.customer.name}`
      : `Work Order — ${state.customer.name}`)
    const body    = encodeURIComponent(formatWorkOrder(state))
    const to      = state.customer.email ? encodeURIComponent(state.customer.email) : ''
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }
  const [pdfLoading, setPdfLoading] = useState(false)
  async function handlePDF() {
    setPdfLoading(true)
    try {
      const { getPDFBlob } = await import('@/lib/pdf-document')
      const blob = await getPDFBlob(getExportState())
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `work-order-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('PDF generation failed') }
    finally { setPdfLoading(false) }
  }

  const priorities = PRIORITY_OPTIONS[wo.trade] ?? ['high', 'medium', 'low']
  const template   = wo.template ?? 'Work Order'
  const tradeLabel = TRADE_LABELS[wo.trade] ?? wo.trade

  /* ── Status badge ── */
  const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    draft:    { color: '#7BBDFF', bg: '#4A9EFF15', border: '#4A9EFF30' },
    final:    { color: '#06D6A0', bg: '#06D6A015', border: '#06D6A030' },
    sent:     { color: '#06D6A0', bg: '#06D6A015', border: '#06D6A030' },
    archived: { color: '#5A7A98', bg: '#5A7A9815', border: '#5A7A9830' },
  }
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.final

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
        <span className="font-display font-bold" style={{ fontSize: 18, color: 'var(--text-primary)', flex: 1 }}>
          {template}
        </span>
        <button
          onClick={() => editing ? save() : setEditing(true)}
          style={{ fontSize: 14, fontWeight: 700, color: '#4A9EFF', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {editing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
        </button>
      </header>

      {/* Status strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {status}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {formatWODate(wo.created_at)}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-blue)', background: '#4A9EFF12', border: '1px solid #4A9EFF30', borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {tradeLabel}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, padding: '14px 16px 120px', overflowY: 'auto', maxWidth: 640, width: '100%', alignSelf: 'center' }}>

        {/* Customer */}
        <Section title="Customer" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>
          <Field label="Name"    value={customer.name}    onChange={editing ? v => setCustomer(p => ({ ...p, name: v }))    : undefined} />
          <Field label="Phone"   value={customer.phone}   onChange={editing ? v => setCustomer(p => ({ ...p, phone: v }))   : undefined} />
          <Field label="Email"   value={customer.email}   onChange={editing ? v => setCustomer(p => ({ ...p, email: v }))   : undefined} />
          <Field label="Address" value={customer.address} onChange={editing ? v => setCustomer(p => ({ ...p, address: v })) : undefined} />
        </Section>

        {/* Vehicle (auto) */}
        {isAuto && (
          <Section title="Vehicle" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {(['year', 'make', 'model'] as const).map(f => (
                <Field key={f} label={f} value={vehicle[f]} onChange={editing ? v => setVehicle(p => ({ ...p, [f]: v })) : undefined} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Mileage" value={vehicle.mileage} onChange={editing ? v => setVehicle(p => ({ ...p, mileage: v })) : undefined} />
              <Field label="Plate"   value={vehicle.plate}   onChange={editing ? v => setVehicle(p => ({ ...p, plate: v }))   : undefined} />
            </div>
            <Field label="VIN" value={vehicle.vin} onChange={editing ? v => setVehicle(p => ({ ...p, vin: v })) : undefined} mono />
          </Section>
        )}

        {/* Property (non-auto) */}
        {!isAuto && (
          <Section title="Property / Equipment" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}>
            <Field label="Address" value={property.address} onChange={editing ? v => setProperty(p => ({ ...p, address: v })) : undefined} />
            <Field label="Type"    value={property.type}    onChange={editing ? v => setProperty(p => ({ ...p, type: v }))    : undefined} placeholder="residential / commercial" />
          </Section>
        )}

        {/* Concerns */}
        <Section
          title={`Concerns (${concerns.length})`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        >
          {concerns.map((c, i) => {
            const pc = PRIORITY_COLORS[c.priority] ?? PRIORITY_COLORS.standard
            return (
              <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>#{i + 1}</span>
                    {editing ? (
                      <div style={{ display: 'flex', gap: 5 }}>
                        {priorities.map(p => {
                          const pc2 = PRIORITY_COLORS[p] ?? PRIORITY_COLORS.standard
                          return (
                            <button key={p} onClick={() => setConcerns(prev => prev.map((x, idx) => idx === i ? { ...x, priority: p } : x))}
                              style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', background: c.priority === p ? pc2.bg : 'transparent', border: `1px solid ${c.priority === p ? pc2.border : '#1E3048'}`, color: c.priority === p ? pc2.color : '#4A6A88', cursor: 'pointer' }}>
                              {p}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: 6, padding: '3px 8px', textTransform: 'capitalize' }}>
                        {c.priority}
                      </span>
                    )}
                  </div>
                  {editing && concerns.length > 1 && (
                    <button onClick={() => setConcerns(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ fontSize: 11, color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Remove
                    </button>
                  )}
                </div>
                {editing ? (
                  <>
                    <textarea
                      value={c.description}
                      onChange={e => setConcerns(prev => prev.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))}
                      placeholder="Describe the concern..."
                      rows={2}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-em)', borderRadius: 8, padding: '8px 10px', fontSize: 14, color: 'var(--text-primary)', width: '100%', resize: 'none', outline: 'none', marginBottom: isAuto ? 8 : 0 }}
                    />
                    {isAuto && (
                      <input
                        type="text"
                        value={c.when_occurs ?? ''}
                        onChange={e => setConcerns(prev => prev.map((x, idx) => idx === i ? { ...x, when_occurs: e.target.value } : x))}
                        placeholder="When it occurs (cold start, highway speed...)"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-em)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text-sec)', width: '100%', outline: 'none' }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {c.description || <span style={{ color: '#2A3E55' }}>—</span>}
                    </p>
                    {isAuto && c.when_occurs && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>When: {c.when_occurs}</p>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {editing && (
            <button
              onClick={() => setConcerns(prev => [...prev, { description: '', priority: defaultPriority }])}
              style={{ width: '100%', padding: '10px', border: '1px dashed var(--border-em)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}
            >
              + Add concern
            </button>
          )}
        </Section>

        {/* AI Suggestions */}
        {followUps.length > 0 && (
          <Section title="Follow-up Questions" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}>
            {followUps.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', marginTop: 3, flexShrink: 0 }}>{i + 1}.</span>
                {editing ? (
                  <input
                    type="text"
                    value={q}
                    onChange={e => setFollowUps(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                    style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-em)', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
                  />
                ) : (
                  <p style={{ fontSize: 14, color: '#A78BFA', lineHeight: 1.5 }}>{q}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Notes */}
        <Section title="Notes" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={e => saveNotes(e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-em)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', width: '100%', resize: 'none', outline: 'none' }}
          />
        </Section>

        {/* Sentiment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sentiment</span>
          {(['positive', 'neutral', 'frustrated'] as const).map(s => (
            <button
              key={s}
              onClick={() => editing && setSentiment(s)}
              style={{
                fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '4px 10px',
                background: sentiment === s ? (s === 'positive' ? '#06D6A015' : s === 'frustrated' ? '#FF6B6B15' : 'var(--bg-surface)') : 'transparent',
                border: `1px solid ${sentiment === s ? (s === 'positive' ? '#06D6A040' : s === 'frustrated' ? '#FF6B6B40' : '#4A6A88') : '#1E3048'}`,
                color: sentiment === s ? (s === 'positive' ? '#06D6A0' : s === 'frustrated' ? '#FF6B6B' : 'var(--text-sec)') : '#3D5A78',
                cursor: editing ? 'pointer' : 'default',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Transcript */}
        {wo.transcript && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <button
              onClick={() => setShowTranscript(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Full Transcript</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: showTranscript ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showTranscript && (
              <pre style={{ padding: '0 16px 16px', fontSize: 13, color: 'var(--text-sec)', fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                {wo.transcript}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-nav)',
          borderTop: '1px solid var(--border-default)',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 8,
        }}
      >
        {[
          { label: 'Copy', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>, onClick: handleCopy },
          { label: 'Email', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, onClick: handleEmail },
          { label: pdfLoading ? '...' : 'PDF', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>, onClick: handlePDF },
          { label: status === 'sent' ? 'Sent ✓' : (sending ? '...' : 'Send'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, onClick: handleSend, active: status === 'sent' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              padding: '10px 8px',
              background: btn.active ? '#06D6A012' : 'var(--bg-surface)',
              border: `1px solid ${btn.active ? '#06D6A040' : 'var(--border-default)'}`,
              borderRadius: 10,
              color: btn.active ? 'var(--accent)' : 'var(--text-sec)',
              cursor: 'pointer',
              minHeight: 56,
            }}
          >
            {btn.icon}
            <span style={{ fontSize: 11, fontWeight: 700 }}>{btn.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}
