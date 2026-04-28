import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Loader2 } from 'lucide-react'

export default async function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wo } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!wo) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">
          Automated<span className="text-[#06B6D4]">Intake</span>
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <Loader2 className="w-10 h-10 text-[#06B6D4] animate-spin" />
        <p className="text-white text-lg font-semibold">Writing it up...</p>
        <p className="text-slate-500 text-sm">Transcribing and extracting your work order.</p>
        <p className="text-slate-600 text-xs mt-4">Work order ID: {id}</p>
      </main>
    </div>
  )
}
