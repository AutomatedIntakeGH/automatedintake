import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import WorkOrderForm from './work-order-form'

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wo } = await supabase
    .from('work_orders')
    .select('id, trade, transcript, raw_extraction, sentiment, notes, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!wo) redirect('/dashboard')
  if (wo.status === 'draft') redirect(`/work-orders/${id}`)

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="px-4 py-4 border-b border-slate-800 flex items-center gap-3">
        <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-lg">
          Automated<span className="text-[#06B6D4]">Intake</span>
        </h1>
      </header>

      <main className="flex-1 px-4 pt-6 pb-12 max-w-lg mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-white text-xl font-semibold">Work Order</h2>
          <p className="text-slate-500 text-sm mt-1">Review, edit, then save.</p>
        </div>

        <WorkOrderForm wo={wo} />
      </main>
    </div>
  )
}
