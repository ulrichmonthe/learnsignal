'use client'

import { useState, useEffect } from 'react'

// Dotted-underline terms and their definitions for the Vibe Check workspace
const VIBE_CHECK_CONCEPTS: Record<string, { term: string; definition: string }> = {
  'vibe check': {
    term: 'Vibe check',
    definition:
      "An informal first pass through agent outputs — before building formal evals. You're looking for obvious failure modes and getting calibrated on what \"good\" looks like for your specific agent. Fast, high-signal, zero code.",
  },
  judge: {
    term: 'LLM judge',
    definition:
      'An LLM used to evaluate the outputs of another LLM. A judge reads an input + output pair and rates quality. Powerful but needs calibration — an uncalibrated judge just moves the hallucination problem one layer up.',
  },
  'llm judge': {
    term: 'LLM judge',
    definition:
      'An LLM used to evaluate the outputs of another LLM. A judge reads an input + output pair and rates quality. Powerful but needs calibration — an uncalibrated judge just moves the hallucination problem one layer up.',
  },
  'golden output': {
    term: 'Golden output',
    definition:
      'A human-verified example of what a correct agent response looks like. The gold standard for an input. Your labelled tickets are the start of a golden dataset.',
  },
  'golden dataset': {
    term: 'Golden dataset',
    definition:
      'A curated set of (input, expected output) pairs used to test and benchmark your agent. The tickets you label in this workspace become the seed for yours.',
  },
  tpr: {
    term: 'TPR (True Positive Rate)',
    definition:
      'Of all the genuinely bad outputs, what fraction did your eval system flag? A judge with TPR of 0.3 misses 70% of actual failures. Also called recall.',
  },
  tnr: {
    term: 'TNR (True Negative Rate)',
    definition:
      'Of all the genuinely good outputs, what fraction did your eval system correctly pass? Low TNR means your eval flags too many good outputs — expensive false alarms.',
  },
  'near-miss example': {
    term: 'Near-miss example',
    definition:
      'An output that almost passes — plausibly correct but subtly wrong. The hardest examples for eval systems to catch. "The agent invented plausible-sounding details" is a near-miss pattern.',
  },
  trace: {
    term: 'Trace',
    definition:
      "A complete record of an agent's execution: inputs, intermediate steps, tool calls, and final output. Tracing is essential for debugging why an agent produced a particular output.",
  },
  'code-based eval': {
    term: 'Code-based eval',
    definition:
      'An eval that runs in code — a function, a regex, a classifier — rather than relying on a human or LLM judge. Deterministic, fast, and cheap. The goal after this workspace is to convert your identified patterns into code-based evals.',
  },
}

const WORKSPACE_CONTENT = {
  title: "What you're doing right now",
  paragraphs: [
    "You're running a <term>vibe check</term> — the first step in building a real eval system. Before writing code or deploying a <term>judge</term>, you need to understand what failure actually looks like for your specific agent.",
    "Each ticket is a real support message. The agent has pre-processed it — categorised, sentiment-tagged, and decided whether to escalate. Your job is to read both the ticket and the agent's output and decide: did it get it right?",
    "The patterns you find here become your first <term>golden dataset</term>. From there, you can build <term>code-based evals</term> that catch these failures automatically.",
  ],
  whatToLookFor: [
    'Did the agent invent details that aren\'t in the ticket?',
    'Did it read sarcasm as calm? Anger as neutral?',
    'Did the customer mention two issues and the agent only catch one?',
    'Did it escalate when it shouldn\'t, or fail to escalate when it should?',
    'Does the reasoning match the ticket text?',
  ],
}

interface Props {
  workspaceId?: string
}

export default function ConceptRail({ workspaceId = 'vibe-check' }: Props) {
  const storageKey = `concept-rail-open:${workspaceId}`
  const [isOpen, setIsOpen] = useState(false)
  const [activeTerm, setActiveTerm] = useState<string | null>(null)

  // Read localStorage on mount (never auto-opens)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'true') setIsOpen(true)
  }, [storageKey])

  function toggle() {
    const next = !isOpen
    setIsOpen(next)
    localStorage.setItem(storageKey, String(next))
  }

  function close() {
    setIsOpen(false)
    localStorage.setItem(storageKey, 'false')
  }

  // Expose a method for dotted-term clicks to open + scroll
  useEffect(() => {
    function handleTermClick(e: CustomEvent<string>) {
      setActiveTerm(e.detail)
      setIsOpen(true)
      localStorage.setItem(storageKey, 'true')
    }
    window.addEventListener('concept-term-click', handleTermClick as EventListener)
    return () => window.removeEventListener('concept-term-click', handleTermClick as EventListener)
  }, [storageKey])

  // Render inline paragraph text with <term> markers as dotted underlines
  function renderParagraph(text: string) {
    const parts = text.split(/(<term>[^<]+<\/term>)/g)
    return parts.map((part, i) => {
      const match = part.match(/^<term>([^<]+)<\/term>$/)
      if (match) {
        const termKey = match[1].toLowerCase()
        return (
          <span
            key={i}
            style={{
              borderBottom: '0.5px dotted rgba(200,240,64,0.7)',
              cursor: 'pointer',
              color: 'inherit',
            }}
            onClick={() => {
              setActiveTerm(termKey)
              setIsOpen(true)
              localStorage.setItem(storageKey, 'true')
            }}
          >
            {match[1]}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  if (!isOpen) {
    // Collapsed 48px rail
    return (
      <div
        onClick={toggle}
        className="hidden md:flex flex-col items-center justify-center cursor-pointer select-none"
        style={{
          width: '48px',
          minHeight: '100%',
          background: 'rgba(255,255,255,0.02)',
          borderLeft: '0.5px solid rgba(255,255,255,0.08)',
          padding: '24px 0',
          gap: '12px',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        title="Open concept panel"
      >
        <span
          className="font-mono"
          style={{
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.45)',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            userSelect: 'none',
          }}
        >
          CONCEPT
        </span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '8px' }}>‹</span>
      </div>
    )
  }

  // Expanded 280px panel
  return (
    <div
      className="hidden md:flex flex-col flex-shrink-0 overflow-y-auto"
      style={{
        width: '280px',
        borderLeft: '0.5px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.025)',
        padding: '24px 22px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span
          className="font-mono"
          style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}
        >
          CONCEPT
        </span>
        <button
          onClick={close}
          className="font-mono"
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.45)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ›
        </button>
      </div>

      {/* Block A: What you're doing right now */}
      <h3
        className="font-display font-medium text-text"
        style={{ fontSize: '18px', lineHeight: '1.25', marginBottom: '12px' }}
      >
        {WORKSPACE_CONTENT.title}
      </h3>
      <div className="space-y-3 mb-6">
        {WORKSPACE_CONTENT.paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {renderParagraph(p)}
          </p>
        ))}
      </div>

      {/* Block B: What to look for */}
      <div className="mb-6">
        <p
          className="font-mono uppercase mb-3"
          style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'var(--text3)' }}
        >
          What to look for
        </p>
        <ul className="space-y-2">
          {WORKSPACE_CONTENT.whatToLookFor.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: '1.6',
                paddingLeft: '14px',
                position: 'relative',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: 'var(--accent)',
                  opacity: 0.6,
                }}
              >
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Active term definition */}
      {activeTerm && VIBE_CHECK_CONCEPTS[activeTerm] && (
        <div
          className="mb-6 p-3 rounded-lg"
          style={{ background: 'rgba(200,240,64,0.06)', border: '0.5px solid rgba(200,240,64,0.15)' }}
        >
          <p
            className="font-mono mb-1"
            style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--accent)', opacity: 0.8 }}
          >
            DEFINITION
          </p>
          <p
            className="font-display font-medium"
            style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}
          >
            {VIBE_CHECK_CONCEPTS[activeTerm].term}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: '1.6',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {VIBE_CHECK_CONCEPTS[activeTerm].definition}
          </p>
        </div>
      )}

      {/* Block C: Footer link */}
      <div
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: 'auto' }}
      >
        <a
          href="/playground/eval-lab/concept"
          className="font-mono"
          style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}
        >
          FULL LESSON · 8 MIN →
        </a>
      </div>
    </div>
  )
}
