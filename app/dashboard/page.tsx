import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">
          Automated<span className="text-[#06B6D4]">Intake</span>
        </h1>
        <span className="text-slate-400 text-sm capitalize">{profile?.trade ?? ''} mode</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-slate-500 text-sm">Voice recording loads here — Task 1.3</p>
      </main>
    </div>
  )
}
