import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkOrderForm from './work-order-form'

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wo } = await supabase
    .from('work_orders')
    .select('id, trade, template, status, transcript, raw_extraction, sentiment, notes, customer, vehicle, property, concerns, follow_up_questions, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!wo) redirect('/dashboard')
  if (wo.status === 'draft') redirect(`/work-orders/${id}`)

  return <WorkOrderForm wo={wo as Parameters<typeof WorkOrderForm>[0]['wo']} />
}
