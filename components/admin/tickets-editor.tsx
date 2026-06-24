'use client'

import { useState } from 'react'
import { updateKitBlock } from '@/lib/admin/actions'
import VersionRevert from './version-revert'
import type { KitContentBlock, Ticket } from '@/lib/admin/types'
import { AGENT_CATEGORIES, AGENT_SENTIMENTS, AGENT_URGENCIES, EXPECTED_LABELS, PATTERN_TAGS } from '@/lib/admin/types'

const ACCENT = '#C8F040'
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  border: '0.5px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-dm-sans)',
  width: '100%',
  outline: 'none',
}
const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE }

function labelColor(label: string) {
  if (label === 'PASS') return ACCENT
  if (label === 'FAIL') return '#FF6B6B'
  if (label === 'NEEDS_EDITS') return '#FFD966'
  return 'rgba(255,255,255,0.5)'
}

interface TicketsEditorProps {
  block: KitContentBlock
  kitSlug: string
  lastChange: string
}

export default function TicketsEditor({ block, kitSlug, lastChange }: TicketsEditorProps) {
  const [tickets, setTickets] = useState<Ticket[]>(block.block_data as Ticket[])
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function openEdit(ticket: Ticket) {
    setExpandedSlot(ticket.slot)
    setEditingTicket({ ...ticket })
    setSaveError(null)
  }

  function closeEdit() {
    setExpandedSlot(null)
    setEditingTicket(null)
    setSaveError(null)
  }

  function updateField<K extends keyof Ticket>(field: K, value: Ticket[K]) {
    setEditingTicket(t => t ? { ...t, [field]: value } : t)
  }

  async function saveTicket() {
    if (!editingTicket) return
    setSaving(true)
    setSaveError(null)

    const updatedTickets = tickets.map(t =>
      t.slot === editingTicket.slot ? editingTicket : t
    )

    const result = await updateKitBlock(block.id, updatedTickets, kitSlug)
    setSaving(false)
    if (result.success) {
      setTickets(updatedTickets)
      closeEdit()
    } else {
      setSaveError(result.error || 'Save failed')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p
            className="font-mono uppercase mb-1"
            style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}
          >
            EVAL KIT · CONTENT BLOCK
          </p>
          <h2
            className="font-display font-medium"
            style={{ fontSize: '22px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}
          >
            Tickets dataset
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            Each row is one ticket shown to the PM. The pattern tag drives the reveal screen&apos;s clustering.
          </p>
        </div>
        <p
          className="font-mono text-right flex-shrink-0"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}
        >
          20 ROWS · 4 PATTERNS<br />LAST CHANGE {lastChange}
        </p>
      </div>

      {/* Table header */}
      <div
        className="font-mono grid"
        style={{
          gridTemplateColumns: '40px 1fr 90px 140px 60px',
          gap: '0 12px',
          padding: '8px 12px',
          borderBottom: '0.5px solid rgba(255,255,255,0.1)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.08em',
        }}
      >
        <span>SLOT</span>
        <span>TICKET TEXT</span>
        <span>EXPECTED</span>
        <span>PATTERN</span>
        <span></span>
      </div>

      {/* Rows */}
      {tickets.map(ticket => (
        <div key={ticket.slot}>
          {/* Collapsed row */}
          {expandedSlot !== ticket.slot && (
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: '40px 1fr 90px 140px 60px',
                gap: '0 12px',
                padding: '12px 12px',
                borderBottom: '0.5px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
              }}
              onClick={() => openEdit(ticket)}
            >
              <span
                className="font-mono"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}
              >
                {String(ticket.slot).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ticket.ticket_text}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '11px', color: labelColor(ticket.expected_label), letterSpacing: '0.04em' }}
              >
                {ticket.expected_label}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}
              >
                {ticket.pattern_tag}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}
              >
                EDIT
              </span>
            </div>
          )}

          {/* Expanded editing row */}
          {expandedSlot === ticket.slot && editingTicket && (
            <div
              style={{
                margin: '8px 0',
                padding: '16px',
                background: 'rgba(200,240,64,0.03)',
                border: '0.5px solid rgba(200,240,64,0.2)',
                borderRadius: '8px',
              }}
            >
              <p
                className="font-mono mb-4"
                style={{ fontSize: '10px', color: ACCENT, letterSpacing: '0.1em' }}
              >
                EDITING SLOT {String(ticket.slot).padStart(2, '0')} · {ticket.pattern_tag.toUpperCase()}
              </p>

              {/* 2-column grid for most fields */}
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                {/* Ticket text — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    TICKET TEXT
                  </label>
                  <textarea
                    rows={3}
                    value={editingTicket.ticket_text}
                    onChange={e => updateField('ticket_text', e.target.value)}
                    style={{ ...INPUT_STYLE, resize: 'vertical' }}
                  />
                </div>

                {/* Agent category */}
                <div>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    AGENT CATEGORY
                  </label>
                  <select
                    value={editingTicket.agent_category}
                    onChange={e => updateField('agent_category', e.target.value)}
                    style={{ ...SELECT_STYLE }}
                  >
                    {AGENT_CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>)}
                  </select>
                </div>

                {/* Agent sentiment */}
                <div>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    AGENT SENTIMENT
                  </label>
                  <select
                    value={editingTicket.agent_sentiment}
                    onChange={e => updateField('agent_sentiment', e.target.value)}
                    style={{ ...SELECT_STYLE }}
                  >
                    {AGENT_SENTIMENTS.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
                  </select>
                </div>

                {/* Agent urgency */}
                <div>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    AGENT URGENCY
                  </label>
                  <select
                    value={editingTicket.agent_urgency ?? ''}
                    onChange={e => updateField('agent_urgency', e.target.value || null)}
                    style={{ ...SELECT_STYLE }}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>—</option>
                    {AGENT_URGENCIES.map(u => <option key={u} value={u} style={{ background: '#1a1a1a' }}>{u}</option>)}
                  </select>
                </div>

                {/* Agent escalate */}
                <div className="flex items-center gap-3" style={{ alignSelf: 'end', paddingBottom: '10px' }}>
                  <label className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    AGENT ESCALATE
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField('agent_escalate', !editingTicket.agent_escalate)}
                    className="font-mono"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: editingTicket.agent_escalate
                        ? `0.5px solid ${ACCENT}`
                        : '0.5px solid rgba(255,255,255,0.2)',
                      background: editingTicket.agent_escalate ? 'rgba(200,240,64,0.12)' : 'transparent',
                      color: editingTicket.agent_escalate ? ACCENT : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    {editingTicket.agent_escalate ? 'TRUE' : 'FALSE'}
                  </button>
                </div>

                {/* Agent reasoning — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    AGENT REASONING
                  </label>
                  <textarea
                    rows={4}
                    value={editingTicket.agent_reasoning}
                    onChange={e => updateField('agent_reasoning', e.target.value)}
                    style={{ ...INPUT_STYLE, resize: 'vertical' }}
                  />
                </div>

                {/* Expected label */}
                <div>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    EXPECTED LABEL
                  </label>
                  <select
                    value={editingTicket.expected_label}
                    onChange={e => updateField('expected_label', e.target.value as Ticket['expected_label'])}
                    style={{ ...SELECT_STYLE, color: labelColor(editingTicket.expected_label) }}
                  >
                    {EXPECTED_LABELS.map(l => (
                      <option key={l} value={l} style={{ background: '#1a1a1a', color: labelColor(l) }}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Pattern tag */}
                <div>
                  <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                    PATTERN TAG
                  </label>
                  <select
                    value={editingTicket.pattern_tag}
                    onChange={e => updateField('pattern_tag', e.target.value)}
                    style={{ ...SELECT_STYLE }}
                  >
                    {PATTERN_TAGS.map(p => <option key={p} value={p} style={{ background: '#1a1a1a' }}>{p}</option>)}
                  </select>
                </div>
              </div>

              {saveError && (
                <p style={{ fontSize: '12px', color: '#FF6B6B', marginBottom: '12px' }}>{saveError}</p>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={saveTicket}
                    disabled={saving}
                    className="font-mono"
                    style={{
                      fontSize: '10px',
                      padding: '8px 14px',
                      background: saving ? 'rgba(200,240,64,0.4)' : ACCENT,
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'default' : 'pointer',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {saving ? 'SAVING…' : 'SAVE · GOES LIVE'}
                  </button>
                  <a
                    href={`/playground/eval-lab/vibe-check?preview_slot=${ticket.slot}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono"
                    style={{
                      fontSize: '10px',
                      padding: '8px 14px',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.6)',
                      border: '0.5px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    PREVIEW AS PM →
                  </a>
                  <button
                    onClick={closeEdit}
                    disabled={saving}
                    className="font-mono"
                    style={{
                      fontSize: '10px',
                      padding: '8px 14px',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.4)',
                      border: '0.5px solid rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    CANCEL
                  </button>
                </div>
                <VersionRevert
                  entityId={block.id}
                  entityType="kit_block"
                  kitSlug={kitSlug}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
