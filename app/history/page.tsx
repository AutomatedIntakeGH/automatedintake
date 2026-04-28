import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HistoryClient } from './history-client'
import type { WOCardData } from '@/lib/wo-utils'

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wos } = await supabase
    .from('work_orders')
    .select('id, status, trade, template, customer, vehicle, property, concerns, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const params = await searchParams
  const initialQuery = params.q ?? ''

  return (
    <HistoryClient
      wos={(wos ?? []) as WOCardData[]}
      initialQuery={initialQuery}
    />
  )
}
