export type WOCardData = {
  id: string
  status: string
  trade: string
  template: string | null
  customer: Record<string, unknown> | null
  vehicle: Record<string, unknown> | null
  property: Record<string, unknown> | null
  concerns: Record<string, unknown>[] | null
  created_at: string
}

export const TRADE_LABELS: Record<string, string> = {
  auto:          'Automotive',
  hvac:          'HVAC',
  plumbing:      'Plumbing',
  electrical:    'Electrical',
  roofing:       'Roofing',
  landscaping:   'Landscaping',
  contractor:    'Contractor',
  home_services: 'Home Services',
  receptionist:  'Receptionist',
  medical:       'Medical / Dental',
}

export function formatWODate(iso: string): string {
  const d = new Date(iso)
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day   = d.getDate()
  const year  = d.getFullYear()
  const time  = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${month} ${day}, ${year} · ${time}`
}

export function getWOTitle(wo: WOCardData): string {
  const cust = (wo.customer as Record<string, unknown> | null)?.name as string | undefined
  if (wo.trade === 'auto') {
    const v   = wo.vehicle as Record<string, unknown> | null
    const str = [v?.year, v?.make, v?.model].filter(Boolean).join(' ')
    return str || cust || 'Unknown Vehicle'
  }
  const prop = wo.property as Record<string, unknown> | null
  return (prop?.address as string | undefined) || cust || 'Unknown'
}

export function getWOSubtitle(wo: WOCardData): string {
  const tmpl  = wo.template ?? 'Work Order'
  const count = Array.isArray(wo.concerns) ? wo.concerns.length : 0
  return `${tmpl} · ${count} concern${count !== 1 ? 's' : ''}`
}

export function groupWOsByDate(wos: WOCardData[]): { label: string; items: WOCardData[] }[] {
  const now           = new Date()
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart     = new Date(todayStart);  weekStart.setDate(weekStart.getDate() - 7)

  const groups: { label: string; items: WOCardData[] }[] = [
    { label: 'Today',     items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Earlier',   items: [] },
  ]

  for (const wo of wos) {
    const d = new Date(wo.created_at)
    if      (d >= todayStart)    groups[0].items.push(wo)
    else if (d >= yesterdayStart) groups[1].items.push(wo)
    else if (d >= weekStart)     groups[2].items.push(wo)
    else                         groups[3].items.push(wo)
  }

  return groups.filter(g => g.items.length > 0)
}

export function searchWOs(wos: WOCardData[], query: string): WOCardData[] {
  if (!query.trim()) return wos
  const q = query.toLowerCase()
  return wos.filter(wo => {
    const cust  = wo.customer  as Record<string, unknown> | null
    const veh   = wo.vehicle   as Record<string, unknown> | null
    const prop  = wo.property  as Record<string, unknown> | null
    const fields = [
      cust?.name, cust?.phone, cust?.email,
      veh?.year, veh?.make, veh?.model, veh?.plate, veh?.vin,
      prop?.address,
      wo.template, wo.trade,
      TRADE_LABELS[wo.trade],
      new Date(wo.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    ]
    return fields.some(f => f && String(f).toLowerCase().includes(q))
  })
}
