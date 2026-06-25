'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ConceptRail from './concept-rail'

interface Ticket {
  slot_number: number
  ticket_text: string
  agent_category: string
  agent_sentiment: string
  agent_urgency: string | null
  agent_reasoning: string
  agent_escalate: boolean
}

interface ExistingLabel {
  slot_number: number
  label: string
  note: string | null
}

type Label = 'PASS' | 'NEEDS_EDITS' | 'FAIL'

const LABEL_CONFIG: Record<Label, { text: string; color: string; bg: string }> = {
  PASS: { text: 'PASS', color: '#C8F040', bg: 'rgba(200,240,64,0.15)' },
  NEEDS_EDITS: { text: 'NEEDS EDITS', color: '#F5C842', bg: 'rgba(245,200,66,0.15)' },
  FAIL: { text: 'FAIL', color: '#E84040', bg: 'rgba(232,64,64,0.15)' },
}

const STEPS = [
  { id: 1, label: 'Label tickets' },
  { id: 2, label: 'See patterns' },
  { id: 3, label: 'Build dataset' },
  { id: 4, label: 'Run experiment' },
]

interface Props {
  sessionId: string
  initialTicket: number
  tickets: Ticket[]
  existingLabels: ExistingLabel[]
}

export default function VibeCheckWorkspace({
  sessionId,
  initialTicket,
  tickets,
  existingLabels,
}: Props) {
  const router = useRouter()

  // Build label map from existing labels
  const [labels, setLabels] = useState<Map<number, Label>>(
    () => new Map(existingLabels.map(l => [l.slot_number, l.label as Label]))
  )
  const [currentSlot, setCurrentSlot] = useState(initialTicket)
  const [pendingLabel, setPendingLabel] = useState<Label | null>(null)
  const [showNote, setShowNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [flashLabel, setFlashLabel] = useState<Label | null>(null)
  const [showMobileConceptDrawer, setShowMobileConceptDrawer] = useState(false)

  const currentTicket = tickets.find(t => t.slot_number === currentSlot)
  const totalLabelled = labels.size
  const progress = (totalLabelled / 20) * 100

  // Navigate between tickets (for back/fwd)
  const goToSlot = useCallback((slot: number) => {
    if (slot >= 1 && slot <= 20) {
      setCurrentSlot(slot)
      setShowNote(false)
      setNoteText('')
      setPendingLabel(null)
      setFlashLabel(null)
    }
  }, [])

  async function saveLabel(label: Label) {
    if (saving) return
    setSaving(true)
    setFlashLabel(label)

    // Optimistic update
    setLabels(prev => new Map(prev).set(currentSlot, label))

    try {
      const res = await fetch('/api/playground/eval-lab/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          slot_number: currentSlot,
          label,
          note: noteText.trim() || null,
        }),
      })

      if (!res.ok) {
        console.error('Failed to save label')
      }

      const data = await res.json()

      // Brief visual flash (200ms) then advance
      setTimeout(() => {
        setFlashLabel(null)
        setSaving(false)
        setShowNote(false)
        setNoteText('')

        if (data.completed) {
          router.push(`/playground/eval-lab/vibe-check/reveal?session_id=${sessionId}`)
        } else if (data.next_ticket <= 20) {
          goToSlot(data.next_ticket)
        }
      }, 200)
    } catch (err) {
      console.error(err)
      setSaving(false)
      setFlashLabel(null)
    }
  }

  if (!currentTicket) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-text3 text-xs">Loading tickets…</p>
      </div>
    )
  }

  const currentLabel = labels.get(currentSlot)
  const isFirstTicket = currentSlot === 1 && totalLabelled === 0

  return (
    <div
      className="flex"
      style={{ minHeight: 'calc(100vh - 57px)', position: 'relative' }}
    >
      {/* ── Left sidebar ── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0"
        style={{
          width: '200px',
          borderRight: '0.5px solid rgba(255,255,255,0.08)',
          padding: '28px 20px',
          background: 'rgba(255,255,255,0.01)',
        }}
      >
        {/* Eyebrow */}
        <p
          className="font-mono uppercase mb-1"
          style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}
        >
          Eval Lab
        </p>
        {/* Counter */}
        <p
          className="font-mono mb-4"
          style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}
        >
          Support Triage Agent · Ticket {currentSlot} of 20
        </p>

        {/* Progress bar */}
        <div
          className="mb-6 rounded-full"
          style={{
            height: '3px',
            background: 'rgba(200,240,64,0.08)',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent)',
              borderRadius: '2px',
              transition: 'width 0.3s',
            }}
          />
        </div>

        {/* Step list */}
        <div className="space-y-3">
          {STEPS.map(step => {
            const isActive = step.id === 1 // only step 1 active for MVP
            return (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className="font-mono"
                  style={{
                    fontSize: '10px',
                    color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
                    width: '18px',
                  }}
                >
                  {String(step.id).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Ticket dots — quick nav */}
        <div className="mt-auto pt-6">
          <p
            className="font-mono uppercase mb-2"
            style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}
          >
            Tickets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 20 }, (_, i) => {
              const slot = i + 1
              const labelled = labels.has(slot)
              const isCurrent = slot === currentSlot
              return (
                <button
                  key={slot}
                  onClick={() => goToSlot(slot)}
                  title={`Ticket ${slot}${labelled ? ` — ${labels.get(slot)}` : ''}`}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '2px',
                    border: isCurrent
                      ? '1.5px solid var(--accent)'
                      : '0.5px solid rgba(255,255,255,0.12)',
                    background: labelled
                      ? labels.get(slot) === 'PASS'
                        ? 'rgba(200,240,64,0.3)'
                        : labels.get(slot) === 'NEEDS_EDITS'
                          ? 'rgba(245,200,66,0.3)'
                          : 'rgba(232,64,64,0.3)'
                      : 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile top bar ── */}
      <div
        className="md:hidden fixed top-[57px] left-0 right-0 z-10 flex items-center justify-between px-4 py-2"
        style={{
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          background: 'var(--bg)',
        }}
      >
        <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Ticket {currentSlot} / 20
        </p>
        <div
          style={{
            width: '80px',
            height: '3px',
            background: 'rgba(200,240,64,0.08)',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent)',
              borderRadius: '2px',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <button
          onClick={() => setShowMobileConceptDrawer(true)}
          className="font-mono"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          CONCEPT ›
        </button>
      </div>

      {/* ── Centre work area ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 'clamp(20px, 4vw, 40px)', paddingTop: 'clamp(28px, 4vw, 40px)' }}
      >
        {/* Mobile top padding adjustment */}
        <div className="md:hidden" style={{ height: '48px' }} />

        {/* Instruction line — ticket 1 only */}
        {isFirstTicket && (
          <p
            className="mb-5"
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.5',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Read the ticket. Read what the agent did with it. Tell us whether it got it right.
          </p>
        )}

        {/* Ticket card */}
        <div
          className="mb-4 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <p
            className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}
          >
            Customer ticket
          </p>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: '1.55',
              fontFamily: 'var(--font-dm-sans)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {currentTicket.ticket_text}
          </p>
        </div>

        {/* Agent output card */}
        <div
          className="mb-6 rounded-lg"
          style={{
            background: 'rgba(200,240,64,0.04)',
            border: '0.5px solid rgba(200,240,64,0.2)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <p
            className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--accent)' }}
          >
            Agent output
          </p>
          <div className="space-y-1.5">
            {[
              ['category', currentTicket.agent_category],
              ['sentiment', currentTicket.agent_sentiment],
              ['urgency', currentTicket.agent_urgency ?? '—'],
              ['reasoning', currentTicket.agent_reasoning],
              ['escalate', String(currentTicket.agent_escalate)],
            ].map(([key, val]) => (
              <div key={key} className="flex gap-2 items-start">
                <span
                  className="font-mono flex-shrink-0"
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', minWidth: '70px' }}
                >
                  {key}:
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision section */}
        <div className="mb-4">
          <p
            className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)' }}
          >
            Did it get it right?
          </p>
          <div className="flex gap-2">
            {(['PASS', 'NEEDS_EDITS', 'FAIL'] as Label[]).map(lbl => {
              const cfg = LABEL_CONFIG[lbl]
              const isFlashing = flashLabel === lbl
              const isSelected = currentLabel === lbl
              return (
                <button
                  key={lbl}
                  onClick={() => saveLabel(lbl)}
                  disabled={saving}
                  className="flex-1 font-mono transition-all"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    padding: '12px 8px',
                    border: isSelected || isFlashing
                      ? `0.5px solid ${cfg.color}`
                      : '0.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: isFlashing
                      ? cfg.bg
                      : isSelected
                        ? `${cfg.bg.replace('0.15', '0.08')}`
                        : 'transparent',
                    color: isSelected || isFlashing ? cfg.color : 'rgba(255,255,255,0.7)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving && !isFlashing ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {cfg.text}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes toggle */}
        <div className="mb-8">
          {!showNote ? (
            <button
              onClick={() => setShowNote(true)}
              className="font-mono"
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.06em',
              }}
            >
              + ADD A NOTE
            </button>
          ) : (
            <input
              type="text"
              value={noteText}
              onChange={e => {
                if (e.target.value.length <= 60) setNoteText(e.target.value)
              }}
              placeholder="Add a note (60 chars max)"
              autoFocus
              style={{
                width: '100%',
                maxWidth: '320px',
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-dm-mono)',
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* Prev/next navigation */}
        <div className="flex items-center gap-4">
          {currentSlot > 1 && (
            <button
              onClick={() => goToSlot(currentSlot - 1)}
              className="font-mono"
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.35)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.06em',
              }}
            >
              ← PREV
            </button>
          )}
          {currentSlot < 20 && labels.has(currentSlot) && (
            <button
              onClick={() => goToSlot(currentSlot + 1)}
              className="font-mono"
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.35)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.06em',
              }}
            >
              NEXT →
            </button>
          )}
          {currentSlot === 20 && totalLabelled >= 20 && (
            <button
              onClick={() =>
                router.push(
                  `/playground/eval-lab/vibe-check/reveal?session_id=${sessionId}`
                )
              }
              className="font-mono font-medium text-black hover:opacity-90 transition-opacity"
              style={{
                fontSize: '11px',
                letterSpacing: '0.08em',
                background: '#C8F040',
                padding: '10px 18px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              SEE PATTERNS →
            </button>
          )}
        </div>
      </div>

      {/* ── Right concept rail ── */}
      <ConceptRail workspaceId="vibe-check" />

      {/* ── Mobile concept drawer ── */}
      {showMobileConceptDrawer && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          onClick={() => setShowMobileConceptDrawer(false)}
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full overflow-y-auto"
            style={{
              background: 'var(--surface)',
              borderTop: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: '12px 12px 0 0',
              maxHeight: '70vh',
              padding: '20px',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}>
                CONCEPT
              </span>
              <button
                onClick={() => setShowMobileConceptDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontFamily: 'var(--font-dm-sans)' }}>
              You're running a vibe check — the first step in building a real eval system. Read the ticket, then read what the agent produced. Decide if the agent got it right, needs edits, or failed.
            </p>
            <a
              href="/playground/eval-lab/concept"
              className="font-mono block mt-4"
              style={{ fontSize: '11px', color: 'var(--accent)' }}
            >
              FULL LESSON · 8 MIN →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
