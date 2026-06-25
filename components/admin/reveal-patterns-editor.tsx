'use client'

import { useState } from 'react'
import { updateKitBlock } from '@/lib/admin/actions'
import VersionRevert from './version-revert'
import type { KitContentBlock, RevealPattern } from '@/lib/admin/types'

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

const TRIGGER_LABELS = ['PASS', 'FAIL', 'NEEDS_EDITS', 'FAIL or NEEDS_EDITS']
const CARD_STYLES = ['primary', 'secondary'] as const
const ALL_SLOTS = Array.from({ length: 20 }, (_, i) => i + 1)

interface RevealPatternsEditorProps {
  block: KitContentBlock
  kitSlug: string
  lastChange: string
}

export default function RevealPatternsEditor({ block, kitSlug, lastChange }: RevealPatternsEditorProps) {
  const [patterns, setPatterns] = useState<RevealPattern[]>(block.block_data as RevealPattern[])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<RevealPattern | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function openEdit(pattern: RevealPattern) {
    setExpandedId(pattern.pattern_id)
    setEditing({ ...pattern })
    setSaveError(null)
  }

  function closeEdit() {
    setExpandedId(null)
    setEditing(null)
    setSaveError(null)
  }

  function updateField<K extends keyof RevealPattern>(field: K, value: RevealPattern[K]) {
    setEditing(p => p ? { ...p, [field]: value } : p)
  }

  function toggleSlot(slot: number) {
    if (!editing) return
    const slots = editing.trigger_slots.includes(slot)
      ? editing.trigger_slots.filter(s => s !== slot)
      : [...editing.trigger_slots, slot].sort((a, b) => a - b)
    setEditing(p => p ? { ...p, trigger_slots: slots, max_catches: slots.length } : p)
  }

  async function savePattern() {
    if (!editing) return
    setSaving(true)
    setSaveError(null)

    const updatedPatterns = patterns.map(p =>
      p.pattern_id === editing.pattern_id ? editing : p
    )

    const result = await updateKitBlock(block.id, updatedPatterns, kitSlug)
    setSaving(false)
    if (result.success) {
      setPatterns(updatedPatterns)
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
            Reveal patterns
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            These three patterns surface on the reveal screen when a user catches enough matching tickets.
          </p>
        </div>
        <p
          className="font-mono text-right flex-shrink-0"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}
        >
          3 PATTERNS<br />LAST CHANGE {lastChange}
        </p>
      </div>

      {/* Pattern cards */}
      <div className="space-y-3">
        {patterns.map(pattern => (
          <div key={pattern.pattern_id}>
            {/* Collapsed card */}
            {expandedId !== pattern.pattern_id && (
              <div
                style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onClick={() => openEdit(pattern)}
              >
                <div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                    {pattern.display_name}
                  </p>
                  <p
                    className="font-mono"
                    style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}
                  >
                    {pattern.trigger_slots.length} TRIGGER SLOTS · MIN {pattern.min_catches_to_surface} CATCHES TO SURFACE · {pattern.card_style.toUpperCase()} STYLE
                  </p>
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}
                >
                  EDIT
                </span>
              </div>
            )}

            {/* Expanded card */}
            {expandedId === pattern.pattern_id && editing && (
              <div
                style={{
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
                  EDITING PATTERN · {pattern.pattern_id.toUpperCase()}
                </p>

                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {/* Display name — full width */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                      DISPLAY NAME
                    </label>
                    <input
                      style={INPUT_STYLE}
                      value={editing.display_name}
                      onChange={e => updateField('display_name', e.target.value)}
                    />
                  </div>

                  {/* Trigger slots — full width */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="font-mono block mb-2" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                      TRIGGER SLOTS (select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SLOTS.map(slot => {
                        const active = editing.trigger_slots.includes(slot)
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleSlot(slot)}
                            className="font-mono"
                            style={{
                              width: '36px',
                              height: '36px',
                              fontSize: '11px',
                              borderRadius: '6px',
                              border: active ? `0.5px solid ${ACCENT}` : '0.5px solid rgba(255,255,255,0.15)',
                              background: active ? 'rgba(200,240,64,0.12)' : 'transparent',
                              color: active ? ACCENT : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                            }}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                    <p className="font-mono mt-2" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                      MAX CATCHES (auto): {editing.trigger_slots.length}
                    </p>
                  </div>

                  {/* Trigger label */}
                  <div>
                    <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                      TRIGGER LABEL
                    </label>
                    <div className="space-y-2">
                      {TRIGGER_LABELS.map(lbl => (
                        <label key={lbl} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`trigger_label_${pattern.pattern_id}`}
                            value={lbl}
                            checked={editing.trigger_label === lbl}
                            onChange={() => updateField('trigger_label', lbl)}
                            style={{ accentColor: ACCENT }}
                          />
                          <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                            {lbl}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Min catches + card style */}
                  <div className="space-y-4">
                    <div>
                      <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                        MIN CATCHES TO SURFACE
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={editing.trigger_slots.length}
                        value={editing.min_catches_to_surface}
                        onChange={e => updateField('min_catches_to_surface', Number(e.target.value))}
                        style={{ ...INPUT_STYLE }}
                      />
                    </div>

                    <div>
                      <label className="font-mono block mb-2" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                        CARD STYLE
                      </label>
                      <div className="flex gap-3">
                        {CARD_STYLES.map(style => (
                          <label key={style} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`card_style_${pattern.pattern_id}`}
                              value={style}
                              checked={editing.card_style === style}
                              onChange={() => updateField('card_style', style)}
                              style={{ accentColor: ACCENT }}
                            />
                            <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                              {style.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card copy — full width */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="font-mono block mb-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                      CARD COPY
                      <span style={{ color: editing.card_copy.length > 280 ? '#FF6B6B' : 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>
                        {editing.card_copy.length}/280
                      </span>
                    </label>
                    <textarea
                      rows={4}
                      value={editing.card_copy}
                      onChange={e => updateField('card_copy', e.target.value)}
                      maxLength={300}
                      style={{ ...INPUT_STYLE, resize: 'vertical' }}
                    />
                  </div>
                </div>

                {saveError && (
                  <p style={{ fontSize: '12px', color: '#FF6B6B', marginTop: '12px' }}>{saveError}</p>
                )}

                {/* Action row */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={savePattern}
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
                      href="/playground/eval-lab/vibe-check"
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
    </div>
  )
}
