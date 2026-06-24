'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PLACEHOLDERS = [
  "My chatbot keeps making things up and I don't know how to catch it…",
  "How do I know what good looks like for my agent…",
  "Should I use RAG or fine-tune for my use case…",
  "What score should I be targeting…",
]

const SEEDS = [
  'Should I use RAG or fine-tuning for my use case?',
  'What score should I be targeting for my agent?',
  'How do I know if my AI feature is ready to ship?',
]

export default function PlaygroundPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFadingOut(true)
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
        setFadingOut(false)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  function submit(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    router.push(`/playground/confirm?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center">
      <div className="w-full max-w-[640px] mx-auto px-6 py-12">
        {/* Eyebrow */}
        <p className="font-mono text-[11px] tracking-[0.12em] text-text3 uppercase mb-4">
          Playground
        </p>

        {/* H1 */}
        <h1 className="font-display font-medium text-text mb-3 leading-tight"
          style={{ fontSize: 'clamp(28px, 5vw, 36px)' }}>
          What are you trying to figure out?
        </h1>

        {/* Subhead */}
        <p className="text-sm leading-relaxed mb-8"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)' }}>
          Type it the way you'd say it to a colleague. We'll meet you there.
        </p>

        {/* Input */}
        <div className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit(query)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            className="w-full rounded-lg px-5 py-[18px] pr-14 text-[15px] text-text outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              fontFamily: 'var(--font-dm-sans)',
              opacity: fadingOut ? 0.6 : 1,
              transition: 'border-color 0.2s, opacity 0.3s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
          />
          <button
            onClick={() => submit(query)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-90 transition-opacity font-bold text-black"
            style={{
              width: '32px',
              height: '32px',
              background: '#C8F040',
              borderRadius: '6px',
              fontSize: '14px',
            }}
            aria-label="Submit"
          >
            →
          </button>
        </div>

        {/* Seeds */}
        <p className="font-mono uppercase mb-3"
          style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}>
          Or try one of these
        </p>
        <div className="space-y-2">
          {SEEDS.map(seed => (
            <button
              key={seed}
              onClick={() => submit(seed)}
              className="w-full text-left transition-colors"
              style={{
                padding: '10px 14px',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-dm-sans)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'
              }}
            >
              {seed}
            </button>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6 flex flex-col gap-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
          <a
            href="/playground/learn"
            className="font-mono hover:opacity-70 transition-opacity"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}
          >
            📖 Or browse the course library →
          </a>
          <a
            href="/playground/pce-lab"
            className="font-mono hover:opacity-70 transition-opacity"
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}
          >
            🔬 PCE Lab — build Atlas across 10 missions →
          </a>
        </div>
      </div>
    </div>
  )
}
