'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Automated<span className="text-[#06B6D4]">Intake</span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Talk. Tap. Done.</p>
        </div>

        {sent ? (
          <div className="bg-slate-800 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="text-white text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-slate-400">
              We sent a magic link to <span className="text-white">{email}</span>
            </p>
            <p className="text-slate-500 text-sm mt-4">
              Tap the link and you&apos;re in — no password needed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-2">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourshop.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-14 text-base bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-[#06B6D4]"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full h-14 text-base font-semibold bg-[#06B6D4] hover:bg-[#0891b2] text-white rounded-xl"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </div>

            <p className="text-center text-slate-500 text-sm">
              No password needed. No credit card required.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
