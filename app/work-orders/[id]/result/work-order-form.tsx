'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, Copy, Mail, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { formatWorkOrder, type ExportState } from '@/lib/format-work-order'

type WorkOrder = {
  id: string
  trade: string
  transcript: string | null
  raw_extraction: Record<string, unknown> | null
  sentiment: string | null
  notes: string | null
}

type Concern = {
  description: string
  priority: string
  when_occurs?: string
  [key: string]: unknown
}

type Customer = { name: string; phone: string; email: string }
type Vehicle  = { year: string; make: string; model: string; mileage: string; vin: string; plate: string }
type Property = { address: string; type: string }

const PRIORITY_COLORS: Record<string, string> = {
  high:      'bg-red-500/20 text-red-400 border-red-500/40',
  emergency: 'bg-red-500/20 text-red-400 border-red-500/40',
  urgent:    'bg-orange-500/20 text-orange-400 border-orange-500/40',
  medium:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  standard:  'bg-slate-700 text-slate-300 border-slate-600',
  low:       'bg-slate-700 text-slate-300 border-slate-600',
}

const PRIORITY_OPTIONS: Record<string, string[]> = {
  auto:        ['high', 'medium', 'low'],
  hvac:        ['emergency', 'urgent', 'standard'],
  plumbing:    ['emergency', 'urgent', 'standard'],
  electrical:  ['emergency', 'urgent', 'standard'],
  roofing:     ['emergency', 'urgent', 'standard'],
  landscaping: ['urgent', 'standard'],
  contractor:  ['high', 'medium', 'low'],
}

const SENTIMENT_STYLE: Record<string, string> = {
  positive:   'bg-green-500/20 text-green-400 border-green-500/40',
  neutral:    'bg-slate-700 text-slate-300 border-slate-600',
  frustrated: 'bg-red-500/20 text-red-400 border-red-500/40',
}

function ConfidenceDot({ score }: { score: unknown }) {
  if (typeof score !== 'number') return null
  const color = score >= 0.8 ? 'bg-green-500' : score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span
      className={`w-2 h-2 rounded-full inline-block ml-1.5 flex-shrink-0 ${color}`}
      title={`${Math.round(score * 100)}% confident`}
    />
  )
}

function FieldInput({
  label, value, onChange, conf, multiline = false, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void
  conf?: unknown; multiline?: boolean; placeholder?: string
}) {
  const base = 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#06B6D4] w-full'
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
        {label}
        <ConfidenceDot score={conf} />
      </label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          placeholder={placeholder} className={`${base} resize-none`} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={base} />
      )}
    </div>
  )
}

export default function WorkOrderForm({ wo }: { wo: WorkOrder }) {
  const router = useRouter()
  const ext  = (wo.raw_extraction ?? {}) as Record<string, unknown>
  const conf = (ext._confidence  ?? {}) as Record<string, unknown>

  const [showTranscript, setShowTranscript] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // ── Customer ──────────────────────────────────────────────────
  const rawCust  = (ext.customer ?? {}) as Partial<Customer>
  const custConf = (conf.customer ?? {}) as Record<string, unknown>
  const [customer, setCustomer] = useState<Customer>({
    name:  String(rawCust.name  ?? ''),
    phone: String(rawCust.phone ?? ''),
    email: String(rawCust.email ?? ''),
  })

  // ── Vehicle (auto) ────────────────────────────────────────────
  const rawVeh  = (ext.vehicle ?? {}) as Partial<Vehicle>
  const vehConf = (conf.vehicle ?? {}) as Record<string, unknown>
  const [vehicle, setVehicle] = useState<Vehicle>({
    year:    String(rawVeh.year    ?? ''),
    make:    String(rawVeh.make    ?? ''),
    model:   String(rawVeh.model   ?? ''),
    mileage: String(rawVeh.mileage ?? ''),
    vin:     String(rawVeh.vin     ?? ''),
    plate:   String(rawVeh.plate   ?? ''),
  })

  // ── Property (non-auto) ───────────────────────────────────────
  const rawProp = (ext.property ?? {}) as Partial<Property>
  const [property, setProperty] = useState<Property>({
    address: String(rawProp.address ?? ''),
    type:    String(rawProp.type    ?? ''),
  })

  // ── Concerns ─────────────────────────────────────────────────
  const defaultPriority = PRIORITY_OPTIONS[wo.trade]?.[0] ?? 'standard'
  const [concerns, setConcerns] = useState<Concern[]>(() => {
    const raw = ext.concerns as Concern[] | null
    if (!Array.isArray(raw) || raw.length === 0) {
      return [{ description: '', priority: defaultPriority }]
    }
    return raw.map(c => ({
      description:  String(c.description  ?? ''),
      priority:     String(c.priority     ?? defaultPriority),
      when_occurs:  c.when_occurs != null ? String(c.when_occurs) : '',
    }))
  })

  // ── Follow-up questions ───────────────────────────────────────
  const [followUps, setFollowUps] = useState<string[]>(() => {
    const raw = ext.follow_up_questions
    if (!Array.isArray(raw)) return []
    return raw.map(q => (typeof q === 'string' ? q : String(q)))
  })

  // ── Notes ─────────────────────────────────────────────────────
  const [notes, setNotes] = useState(
    String(ext.advisor_notes ?? ext.tech_notes ?? wo.notes ?? '')
  )

  // ── Sentiment ─────────────────────────────────────────────────
  const [sentiment, setSentiment] = useState(
    String(ext.sentiment ?? wo.sentiment ?? 'neutral')
  )

  // ── Mutations ─────────────────────────────────────────────────
  function updateConcern(i: number, field: keyof Concern, val: string) {
    setConcerns(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }

  // ── Export helpers ────────────────────────────────────────────
  function getExportState(): ExportState {
    return { trade: wo.trade, customer, vehicle, property, concerns, followUps, notes, sentiment }
  }

  async function handleCopy() {
    const text = formatWorkOrder(getExportState())
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  function handleEmail() {
    const state = getExportState()
    const subject = encodeURIComponent(
      state.trade === 'auto'
        ? `Work Order — ${[state.vehicle.year, state.vehicle.make, state.vehicle.model].filter(Boolean).join(' ')} — ${state.customer.name}`
        : `Work Order — ${state.customer.name}`
    )
    const body = encodeURIComponent(formatWorkOrder(state))
    const to = state.customer.email ? encodeURIComponent(state.customer.email) : ''
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }

  const [pdfLoading, setPdfLoading] = useState(false)

  async function handlePDF() {
    setPdfLoading(true)
    try {
      const { getPDFBlob } = await import('@/lib/pdf-document')
      const blob = await getPDFBlob(getExportState())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `work-order-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Save ──────────────────────────────────────────────────────
  async function save() {
    setSaving(true)
    const supabase = createClient()
    const isAuto = wo.trade === 'auto'

    const updatedExt = {
      ...ext,
      customer,
      ...(isAuto ? { vehicle } : { property }),
      concerns,
      follow_up_questions: followUps,
      ...(isAuto ? { advisor_notes: notes } : { tech_notes: notes }),
      sentiment,
    }

    await supabase
      .from('work_orders')
      .update({
        customer:           customer as Record<string, unknown>,
        ...(isAuto ? { vehicle: vehicle as Record<string, unknown> } : { property: property as Record<string, unknown> }),
        concerns:           concerns as Record<string, unknown>[],
        follow_up_questions: followUps.filter(Boolean).map(q => ({ question: q })),
        notes,
        sentiment,
        raw_extraction: updatedExt,
      })
      .eq('id', wo.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isAuto = wo.trade === 'auto'
  const priorities = PRIORITY_OPTIONS[wo.trade] ?? ['high', 'medium', 'low']

  return (
    <div className="space-y-6">

      {/* Transcript toggle */}
      {wo.transcript && (
        <>
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="w-full flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 text-slate-400 text-sm hover:bg-slate-800 transition-colors"
          >
            <span>View transcript</span>
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showTranscript && (
            <div className="bg-slate-800/30 rounded-xl px-4 py-3">
              <pre className="text-slate-400 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                {wo.transcript}
              </pre>
            </div>
          )}
        </>
      )}

      {/* Sentiment */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-500 text-xs">Customer mood:</span>
        {(['positive', 'neutral', 'frustrated'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSentiment(s)}
            className={`px-2.5 py-0.5 rounded-full text-xs capitalize border transition-colors ${
              sentiment === s
                ? SENTIMENT_STYLE[s]
                : 'border-slate-700 text-slate-600 hover:text-slate-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Customer */}
      <section className="space-y-3">
        <h3 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">Customer</h3>
        <FieldInput label="Name"  value={customer.name}  onChange={v => setCustomer(p => ({ ...p, name: v }))}  conf={custConf.name}  />
        <FieldInput label="Phone" value={customer.phone} onChange={v => setCustomer(p => ({ ...p, phone: v }))} conf={custConf.phone} />
        <FieldInput label="Email" value={customer.email} onChange={v => setCustomer(p => ({ ...p, email: v }))} conf={custConf.email} />
      </section>

      {/* Vehicle */}
      {isAuto && (
        <section className="space-y-3">
          <h3 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">Vehicle</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['year', 'make', 'model'] as const).map(f => (
              <FieldInput key={f} label={f} value={vehicle[f]}
                onChange={v => setVehicle(p => ({ ...p, [f]: v }))} conf={vehConf[f]} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FieldInput label="Mileage" value={vehicle.mileage}
              onChange={v => setVehicle(p => ({ ...p, mileage: v }))} conf={vehConf.mileage} />
            <FieldInput label="Plate" value={vehicle.plate}
              onChange={v => setVehicle(p => ({ ...p, plate: v }))} conf={vehConf.plate} />
          </div>
          <FieldInput label="VIN" value={vehicle.vin}
            onChange={v => setVehicle(p => ({ ...p, vin: v }))} conf={vehConf.vin} />
        </section>
      )}

      {/* Property */}
      {!isAuto && (
        <section className="space-y-3">
          <h3 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">Property</h3>
          <FieldInput label="Address" value={property.address} onChange={v => setProperty(p => ({ ...p, address: v }))} />
          <FieldInput label="Type (residential / commercial)" value={property.type}
            onChange={v => setProperty(p => ({ ...p, type: v }))} />
        </section>
      )}

      {/* Concerns */}
      <section className="space-y-3">
        <h3 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">
          Concerns
          <span className="text-slate-500 font-normal ml-1">({concerns.length})</span>
        </h3>

        {concerns.map((c, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {priorities.map(p => (
                  <button
                    key={p}
                    onClick={() => updateConcern(i, 'priority', p)}
                    className={`px-2.5 py-0.5 rounded-full text-xs capitalize border transition-colors ${
                      c.priority === p
                        ? PRIORITY_COLORS[p]
                        : 'border-slate-700 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {concerns.length > 1 && (
                <button
                  onClick={() => setConcerns(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                >
                  remove
                </button>
              )}
            </div>

            <textarea
              value={c.description}
              onChange={e => updateConcern(i, 'description', e.target.value)}
              placeholder="Describe the concern..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#06B6D4]"
            />

            {isAuto && (
              <FieldInput
                label="When it occurs"
                value={c.when_occurs ?? ''}
                onChange={v => updateConcern(i, 'when_occurs', v)}
                placeholder="e.g. cold start, highway speed, braking..."
              />
            )}
          </div>
        ))}

        <button
          onClick={() => setConcerns(prev => [...prev, { description: '', priority: defaultPriority }])}
          className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm hover:border-slate-500 hover:text-slate-400 transition-colors"
        >
          + Add concern
        </button>
      </section>

      {/* Follow-up questions */}
      {followUps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">
            Follow-up questions
          </h3>
          {followUps.map((q, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-slate-500 text-sm shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={q}
                onChange={e => setFollowUps(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-[#06B6D4]"
              />
              <button
                onClick={() => setFollowUps(prev => prev.filter((_, idx) => idx !== i))}
                className="text-slate-600 hover:text-red-400 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setFollowUps(prev => [...prev, ''])}
            className="text-slate-500 text-sm hover:text-slate-400 transition-colors"
          >
            + Add question
          </button>
        </section>
      )}

      {/* Notes */}
      <section className="space-y-2">
        <h3 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">
          {isAuto ? 'Advisor notes' : 'Tech notes'}
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#06B6D4]"
        />
      </section>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-4 bg-[#06B6D4] hover:bg-[#0891b2] active:bg-[#0e7490] disabled:opacity-60 rounded-2xl text-white font-bold text-lg transition-colors shadow-lg shadow-cyan-500/20 touch-manipulation"
      >
        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Work Order'}
      </button>

      {/* Export */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <p className="text-slate-600 text-xs text-center">Export</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors touch-manipulation"
          >
            <Copy className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Copy</span>
          </button>
          <button
            onClick={handleEmail}
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors touch-manipulation"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">Email</span>
          </button>
          <button
            onClick={handlePDF}
            disabled={pdfLoading}
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl transition-colors touch-manipulation"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs">{pdfLoading ? '...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full py-3 text-slate-500 text-sm hover:text-slate-400 transition-colors"
      >
        Start new recording
      </button>

    </div>
  )
}
