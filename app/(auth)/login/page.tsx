'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs tracking-widest text-accent uppercase mb-8">The Signal</p>

        {sent ? (
          <div>
            <h1 className="font-display text-2xl font-black text-text mb-3">Check your email</h1>
            <p className="text-text2 text-sm">
              We sent a magic link to <span className="text-text">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="font-display text-2xl font-black text-text mb-8">Sign in</h1>
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-surface border border-border px-4 py-3 text-sm text-text placeholder:text-text3 font-mono focus:outline-none focus:border-border2"
              />
              {error && <p className="font-mono text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full bg-accent text-bg font-mono text-sm font-medium py-3 hover:bg-accent-dk transition-colors"
              >
                Send magic link →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
