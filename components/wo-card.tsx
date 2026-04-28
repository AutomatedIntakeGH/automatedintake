import Link from 'next/link'
import { formatWODate, getWOTitle, getWOSubtitle, TRADE_LABELS, type WOCardData } from '@/lib/wo-utils'

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  draft:    { color: '#7BBDFF', bg: '#4A9EFF15', border: '#4A9EFF30', label: 'Draft'    },
  final:    { color: '#06D6A0', bg: '#06D6A015', border: '#06D6A030', label: 'Final'    },
  sent:     { color: '#06D6A0', bg: '#06D6A015', border: '#06D6A030', label: 'Sent'     },
  archived: { color: '#5A7A98', bg: '#5A7A9815', border: '#5A7A9830', label: 'Archived' },
}

function StatusIcon({ status }: { status: string }) {
  const isSent = status === 'sent' || status === 'final'
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="14" stroke="#1A2535" strokeWidth="1.5"/>
      {isSent ? (
        <path d="M10 15l4 4 7-7" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <>
          <line x1="15" y1="10" x2="15" y2="20" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round"/>
          <line x1="10" y1="15" x2="20" y2="15" stroke="#06D6A0" strokeWidth="2" strokeLinecap="round"/>
        </>
      )}
    </svg>
  )
}

interface WOCardProps {
  wo: WOCardData
}

export function WOCard({ wo }: WOCardProps) {
  const href   = wo.status === 'draft' ? `/work-orders/${wo.id}` : `/work-orders/${wo.id}/result`
  const title  = getWOTitle(wo)
  const sub    = getWOSubtitle(wo)
  const date   = formatWODate(wo.created_at)
  const badge  = STATUS_STYLES[wo.status] ?? STATUS_STYLES.draft

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '13px 15px',
        textDecoration: 'none',
      }}
    >
      {/* Left icon */}
      <StatusIcon status={wo.status} />

      {/* Center */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </p>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
          {sub}
        </p>
        <p
          className="font-display"
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#2A3E55',
            marginTop: 3,
            letterSpacing: '0.04em',
          }}
        >
          {date}
        </p>
      </div>

      {/* Status badge */}
      <span
        style={{
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 700,
          color: badge.color,
          background: badge.bg,
          border: `1px solid ${badge.border}`,
          borderRadius: 6,
          padding: '3px 7px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {badge.label}
      </span>
    </Link>
  )
}
