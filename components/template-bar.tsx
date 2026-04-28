'use client'

import { createClient } from '@/lib/supabase/client'

const TEMPLATES = [
  { id: 'Repair Order',     desc: 'Formal RO · Vehicle + concerns + tech authorization'   },
  { id: 'Work Order',       desc: 'Field job · Property + labor + materials + schedule'    },
  { id: 'General Notes',    desc: 'Free-form summary · Bullet points + key takeaways'      },
  { id: 'Situation Detail', desc: 'Who / what / when / where / why · Incidents & claims'   },
  { id: 'Estimate Request', desc: 'Scope + materials + rough cost ranges · Pre-quote doc'  },
  { id: 'Client Intake',    desc: 'Symptoms + history + concerns + follow-up actions'      },
]

interface TemplateBarProps {
  userId: string
  selected: string
  onChange: (template: string) => void
}

export function TemplateBar({ userId, selected, onChange }: TemplateBarProps) {
  const current = TEMPLATES.find(t => t.id === selected) ?? TEMPLATES[0]

  async function handleSelect(id: string) {
    onChange(id)
    const supabase = createClient()
    await supabase.from('profiles').update({ default_template: id }).eq('id', userId)
  }

  return (
    <div
      style={{
        background: '#0C1218',
        borderBottom: '1px solid var(--border-default)',
        padding: '10px 18px 9px',
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--accent)',
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#2A3E55',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Output Template
        </span>
      </div>

      {/* Pill row */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 7 }}
      >
        {TEMPLATES.map(t => {
          const active = selected === t.id
          return (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              style={{
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 20,
                padding: '6px 13px',
                background: active ? '#06D6A012' : 'transparent',
                border: `1px solid ${active ? '#06D6A055' : '#1E3048'}`,
                color: active ? '#06D6A0' : '#4A6A88',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, background 0.15s, border-color 0.15s',
              }}
            >
              {t.id}
            </button>
          )
        })}
      </div>

      {/* Description */}
      <p style={{ fontSize: 11, fontWeight: 500, color: '#3D5A78', lineHeight: 1.4 }}>
        {current.desc}
      </p>
    </div>
  )
}
