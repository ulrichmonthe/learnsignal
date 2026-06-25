'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SignalOption {
  id: string
  label: string
  weight: number
  display_order: number
}

interface SignalResult {
  min_score: number
  max_score: number
  verdict: string
  reasoning: string
}

interface EvidenceItem {
  id: string
  evidence_type: string
  content: string
  speaker: string | null
  confidence: string
  // Supabase returns array; component uses [0] for the primary source
  sources: { title: string; url: string; author: string | null; source_type?: string | null; publication?: string | null }[] | null
}

interface Signal {
  id: string
  name: string
  core_question: string
  why_it_matters: string | null
  signal_type: string
  signal_options: SignalOption[]
  signal_results: SignalResult[]
  evidence: EvidenceItem[]
}

interface Props {
  signal: Signal
}

export function SignalChecklist({ signal }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [revealed, setReveal] = useState(false)

  const score = [...checked].reduce((sum, id) => {
    const opt = signal.signal_options.find(o => o.id === id)
    return sum + (opt?.weight ?? 0)
  }, 0)

  const result = signal.signal_results.find(
    r => score >= r.min_score && score <= r.max_score
  )

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setReveal(false)
  }

  return (
    <div>
      {/* Header */}
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-3">
        Decision signal
      </p>
      <h1 className="font-display text-3xl font-black italic text-text mb-2">
        {signal.name}
      </h1>
      <p className="text-text2 text-base mb-6 leading-relaxed max-w-2xl">
        {signal.core_question}
      </p>

      {signal.why_it_matters && (
        <div className="border-l-2 border-border2 pl-4 mb-8">
          <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-1">Why it matters</p>
          <p className="text-text2 text-sm leading-relaxed">{signal.why_it_matters}</p>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-2 mb-8">
        {[...signal.signal_options]
          .sort((a, b) => a.display_order - b.display_order)
          .map(opt => {
            const isChecked = checked.has(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={cn(
                  'w-full text-left flex items-start gap-3 border px-4 py-3 transition-colors',
                  isChecked
                    ? 'border-accent bg-surface2 text-text'
                    : 'border-border text-text2 hover:border-border2 hover:text-text'
                )}
              >
                <div className={cn(
                  'w-4 h-4 shrink-0 mt-0.5 border flex items-center justify-center',
                  isChecked ? 'border-accent bg-accent' : 'border-border2'
                )}>
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 text-bg" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm leading-relaxed">{opt.label}</span>
              </button>
            )
          })}
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-xs text-text3">Score: {score} / {signal.signal_options.length}</span>
        <div className="flex-1 h-1 bg-surface2">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(score / Math.max(signal.signal_options.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* See guidance button */}
      {!revealed && (
        <button
          onClick={() => setReveal(true)}
          className="bg-accent text-bg font-mono text-sm font-medium px-6 py-3 hover:bg-accent-dk transition-colors"
        >
          See guidance →
        </button>
      )}

      {/* Guidance reveal */}
      {revealed && result && (
        <div className="border border-border2 p-6 space-y-6">
          <div>
            <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-2">Guidance</p>
            <p className="font-display text-xl italic text-text mb-3">{result.verdict}</p>
            <p className="text-text2 text-sm leading-relaxed">{result.reasoning}</p>
          </div>

          {/* Evidence */}
          {signal.evidence.length > 0 && (
            <div>
              <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-3">Evidence</p>
              <div className="space-y-3">
                {signal.evidence.slice(0, 5).map(e => (
                  <div key={e.id} className="border-l-2 border-border pl-4">
                    <p className="text-text2 text-sm leading-relaxed mb-1">
                      {e.evidence_type === 'quote' ? `"${e.content}"` : e.content}
                    </p>
                    <div className="flex items-center gap-3">
                      {e.speaker && (
                        <span className="font-mono text-xs text-text3">— {e.speaker}</span>
                      )}
                      {e.sources && e.sources.length > 0 && (
                        <a
                          href={e.sources[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-accent hover:underline"
                        >
                          {e.sources[0].title}
                        </a>
                      )}
                      <span className="font-mono text-[10px] text-text3 uppercase">
                        {e.confidence} confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affordances */}
          <div className="flex gap-3 pt-2">
            <button className="font-mono text-xs text-text2 border border-border px-4 py-2 hover:border-border2 hover:text-text transition-colors">
              Save without deciding
            </button>
            <button className="font-mono text-xs text-text2 border border-border px-4 py-2 hover:border-border2 hover:text-text transition-colors">
              Disagree with framing
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
