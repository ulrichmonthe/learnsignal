'use client'

import { useState } from 'react'

export function ScenarioSubmitForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/scenarios/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong. Try again.')
      }
      setStatus('sent')
      setTitle('')
      setDescription('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div
        className="rounded-lg p-6"
        style={{ border: '0.5px solid rgba(200,240,64,0.3)', background: 'rgba(200,240,64,0.04)' }}
      >
        <p className="font-mono uppercase mb-1" style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}>
          Got it
        </p>
        <p className="text-text text-sm">
          Your scenario idea is in. We review submissions and build the strongest ones into the platform.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="font-mono mt-4 hover:opacity-70 transition-opacity"
          style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.08em' }}
        >
          Submit another →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="font-mono block mb-2" style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--text3)', textTransform: 'uppercase' }}>
          Scenario title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ship a flawed model now, or slip the launch two weeks?"
          required
          className="w-full bg-surface border border-border px-4 py-3 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-border2 rounded-lg"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        />
      </div>
      <div>
        <label className="font-mono block mb-2" style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--text3)', textTransform: 'uppercase' }}>
          The situation & decision
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the setup, who's in the room, what call does the PM have to make, and what makes it hard?"
          required
          rows={5}
          className="w-full bg-surface border border-border px-4 py-3 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-border2 rounded-lg resize-y"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        />
      </div>

      {status === 'error' && (
        <p className="font-mono text-xs" style={{ color: '#F57C7C' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="font-mono font-medium px-6 py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ fontSize: '12px', letterSpacing: '0.08em', background: 'var(--accent)', color: 'black' }}
      >
        {status === 'sending' ? 'Sending…' : 'Submit scenario →'}
      </button>
    </form>
  )
}
