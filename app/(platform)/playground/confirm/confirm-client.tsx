'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClassifyResult } from '@/lib/classify'

const EVAL_ALTERNATIVES = [
  {
    title: 'How to measure quality systematically',
    meta: "EVALS · YOU'LL RUN A PRACTICE EVAL",
  },
  {
    title: 'What score should I target for my product',
    meta: 'SCORE INTERPRETATION · GUIDED REASONING',
  },
  {
    title: 'When is my AI feature ready to ship',
    meta: 'LAUNCH READINESS · DECISION FRAMEWORK',
  },
]

export default function ConfirmClient({
  query,
  classification,
}: {
  query: string
  classification: ClassifyResult
}) {
  const router = useRouter()
  const [showRephrase, setShowRephrase] = useState(false)
  const [rephraseValue, setRephraseValue] = useState(query)

  const isEval = classification.route === 'eval'

  function handleStartPracticing() {
    router.push('/playground/eval-lab/vibe-check')
  }

  function handleRephrase(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    router.push(`/playground/confirm?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[640px] mx-auto px-6 pt-20 pb-16 md:pt-20 pt-12">

        {/* Block 1: Echo */}
        <div className="mb-10">
          <p className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}>
            You typed
          </p>
          <blockquote
            className="pl-4 italic"
            style={{
              borderLeft: '2px solid rgba(255,255,255,0.15)',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'var(--font-playfair)',
              lineHeight: '1.6',
            }}>
            "{query}"
          </blockquote>
        </div>

        {/* Block 2: Translation */}
        <div className="mb-6">
          <p className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}>
            What you're really asking
          </p>
          <h1
            className="font-display font-medium text-text leading-tight"
            style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}>
            {isEval
              ? 'How to run evals on your AI.'
              : "That’s outside what we teach right now."}
          </h1>
        </div>

        {/* Block 3: Bridge paragraph */}
        <div className="mb-10">
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.55',
            fontFamily: 'var(--font-dm-sans)',
            maxWidth: '560px',
          }}>
            {isEval
              ? "Hallucinations are an eval problem. You need a systematic way to catch them before users do. Let's set one up together — using a support triage agent as the test bed. You'll do the work, not read about it."
              : "The closest thing we have right now is evaluations — checking whether your AI is working the way you intend. That might be adjacent to your question. Want to try it, or rephrase?"}
          </p>
        </div>

        {/* Block 4: Actions */}
        {isEval ? (
          <div className="flex items-center gap-6 flex-wrap mb-10">
            <button
              onClick={handleStartPracticing}
              className="font-mono font-medium text-black hover:opacity-90 transition-opacity"
              style={{
                fontSize: '12px',
                letterSpacing: '0.08em',
                background: '#C8F040',
                padding: '14px 24px',
                borderRadius: '8px',
              }}>
              START PRACTICING →
            </button>
            <a
              href="/playground/eval-lab/concept"
              className="font-mono"
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.55)',
                borderBottom: '0.5px dotted rgba(255,255,255,0.3)',
                textDecoration: 'none',
              }}>
              I'd rather understand it first
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-6 flex-wrap mb-10">
            <button
              onClick={() => setShowRephrase(true)}
              className="font-mono font-medium text-black hover:opacity-90 transition-opacity"
              style={{
                fontSize: '12px',
                letterSpacing: '0.08em',
                background: '#C8F040',
                padding: '14px 24px',
                borderRadius: '8px',
              }}>
              TRY EVALS ANYWAY →
            </button>
            <button
              onClick={() => setShowRephrase(true)}
              className="font-mono"
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.55)',
                borderBottom: '0.5px dotted rgba(255,255,255,0.3)',
                background: 'none',
                cursor: 'pointer',
              }}>
              Let me rephrase
            </button>
          </div>
        )}

        {/* Block 5: Classifier-miss safety valve */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <button
            onClick={() => setShowRephrase(v => !v)}
            className="font-mono transition-opacity hover:opacity-70"
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.06em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}>
            ↻ NOT QUITE — LET ME REPHRASE
          </button>
        </div>

        {/* Classifier-miss recovery — inline expansion */}
        {showRephrase && (
          <div
            className="mt-6 p-5 rounded-lg"
            style={{ border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="font-mono uppercase mb-3"
              style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}>
              Let's try again
            </p>
            <h2
              className="font-display font-medium text-text mb-2"
              style={{ fontSize: '22px' }}>
              A few ways to read your question.
            </h2>
            <p className="mb-5"
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'var(--font-dm-sans)',
              }}>
              "AI quality" means different things depending on what you're trying to do. Pick the
              closest, or rewrite it.
            </p>

            <div className="space-y-2 mb-5">
              {EVAL_ALTERNATIVES.map(alt => (
                <button
                  key={alt.title}
                  onClick={handleStartPracticing}
                  className="w-full text-left flex items-center justify-between group transition-colors rounded-lg"
                  style={{
                    border: '0.5px solid rgba(255,255,255,0.18)',
                    padding: '14px 16px',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '8px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>
                      {alt.title}
                    </p>
                    <p className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                      {alt.meta}
                    </p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
                </button>
              ))}
            </div>

            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '8px' }}>
              <p className="font-mono uppercase mb-3"
                style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}>
                Or rephrase
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={rephraseValue}
                onChange={e => setRephraseValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRephrase(rephraseValue)}
                className="w-full outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '0.5px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '14px 50px 14px 16px',
                  fontSize: '14px',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              />
              <button
                onClick={() => handleRephrase(rephraseValue)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  background: '#C8F040',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
