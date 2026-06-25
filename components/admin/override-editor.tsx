'use client'

import { useState } from 'react'
import { upsertKitOverride, deleteKitOverride } from '@/lib/admin/actions'
import VersionRevert from './version-revert'
import type { SharedBlock, KitOverride } from '@/lib/admin/types'

const ACCENT = '#C8F040'
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  border: '0.5px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-dm-mono, monospace)',
  width: '100%',
  outline: 'none',
  resize: 'vertical' as const,
}

interface OverrideEditorProps {
  sharedBlock: SharedBlock
  override: KitOverride | null
  kitId: string
  kitSlug: string
}

export default function OverrideEditor({ sharedBlock, override, kitId, kitSlug }: OverrideEditorProps) {
  const [expanded, setExpanded] = useState(false)
  const [overrideText, setOverrideText] = useState(
    override ? JSON.stringify(override.override_data, null, 2) : ''
  )
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultText = JSON.stringify(sharedBlock.default_data, null, 2)
  const hasOverride = !!override
  const overrideChanged = overrideText.trim() !== defaultText.trim() && overrideText.trim() !== ''

  async function handleSave() {
    setError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(overrideText)
    } catch {
      setError('Invalid JSON — check the override value')
      return
    }
    setSaving(true)
    const result = await upsertKitOverride(kitId, sharedBlock.id, parsed, kitSlug)
    setSaving(false)
    if (result.success) {
      setExpanded(false)
    } else {
      setError(result.error || 'Save failed')
    }
  }

  async function handleRemove() {
    if (!override) return
    if (!confirm('Remove override? This kit will revert to the default.')) return
    setRemoving(true)
    const result = await deleteKitOverride(override.id, kitSlug)
    setRemoving(false)
    if (result.success) {
      setOverrideText('')
      setExpanded(false)
    } else {
      setError(result.error || 'Remove failed')
    }
  }

  // Collapsed display
  const overridePreview = hasOverride
    ? (() => {
        try {
          const data = override.override_data as Record<string, unknown>
          const firstVal = Object.values(data)[0]
          return typeof firstVal === 'string' ? `"${firstVal.slice(0, 60)}${firstVal.length > 60 ? '…' : ''}"` : JSON.stringify(firstVal)
        } catch {
          return '(override set)'
        }
      })()
    : null

  return (
    <div>
      {/* Collapsed row */}
      {!expanded && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.015)',
            border: '0.5px dashed rgba(255,255,255,0.12)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
          onClick={() => setExpanded(true)}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px' }}>
              {sharedBlock.name}
            </p>
            <p
              className="font-mono"
              style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {hasOverride
                ? `OVERRIDDEN · ${overridePreview}`
                : 'USING DEFAULT · CLICK TO OVERRIDE'
              }
            </p>
          </div>
          <span
            className="font-mono flex-shrink-0 ml-4"
            style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}
          >
            {hasOverride ? 'EDIT OVERRIDE' : 'SET OVERRIDE'}
          </span>
        </div>
      )}

      {/* Expanded editor */}
      {expanded && (
        <div
          style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '0.5px dashed rgba(200,240,64,0.25)',
            borderRadius: '8px',
          }}
        >
          <p
            className="font-mono mb-4"
            style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}
          >
            {sharedBlock.name.toUpperCase()}
          </p>

          {!sharedBlock.allows_kit_override && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255,107,107,0.08)',
                border: '0.5px solid rgba(255,107,107,0.25)',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#FF6B6B',
              }}
            >
              This block does not allow kit overrides. Edit the default directly.
            </div>
          )}

          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Current default */}
            <div>
              <p
                className="font-mono mb-2"
                style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}
              >
                {hasOverride ? 'DEFAULT (NOT USED HERE)' : 'CURRENT DEFAULT'}
              </p>
              <textarea
                rows={6}
                readOnly
                value={defaultText}
                style={{ ...INPUT_STYLE, color: 'rgba(255,255,255,0.4)', cursor: 'default' }}
              />
            </div>

            {/* Override input */}
            <div>
              <p
                className="font-mono mb-2"
                style={{ fontSize: '10px', color: hasOverride ? ACCENT : 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}
              >
                {hasOverride ? 'OVERRIDE FOR THIS KIT' : 'OVERRIDE FOR THIS KIT'}
              </p>
              <textarea
                rows={6}
                value={overrideText}
                onChange={e => setOverrideText(e.target.value)}
                placeholder={defaultText}
                disabled={!sharedBlock.allows_kit_override}
                style={{
                  ...INPUT_STYLE,
                  borderColor: hasOverride ? 'rgba(200,240,64,0.3)' : 'rgba(255,255,255,0.15)',
                }}
              />
            </div>
          </div>

          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              marginTop: '12px',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Saving creates a kit-specific override. The default remains unchanged and applies to other kits.
          </p>

          {error && (
            <p style={{ fontSize: '12px', color: '#FF6B6B', marginTop: '8px' }}>{error}</p>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-3 items-center">
              <button
                onClick={handleSave}
                disabled={saving || !overrideChanged || !sharedBlock.allows_kit_override}
                className="font-mono"
                style={{
                  fontSize: '10px',
                  padding: '8px 14px',
                  background: saving || !overrideChanged || !sharedBlock.allows_kit_override
                    ? 'rgba(200,240,64,0.25)'
                    : ACCENT,
                  color: saving || !overrideChanged || !sharedBlock.allows_kit_override ? 'rgba(0,0,0,0.5)' : '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving || !overrideChanged || !sharedBlock.allows_kit_override ? 'default' : 'pointer',
                  letterSpacing: '0.06em',
                }}
              >
                {saving ? 'SAVING…' : 'SAVE OVERRIDE · GOES LIVE'}
              </button>
              <button
                onClick={() => { setExpanded(false); setError(null) }}
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
              {hasOverride && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="font-mono"
                  style={{
                    fontSize: '10px',
                    padding: '0',
                    background: 'none',
                    color: 'rgba(255,107,107,0.6)',
                    border: 'none',
                    cursor: removing ? 'default' : 'pointer',
                  }}
                >
                  {removing ? 'REMOVING…' : 'REMOVE OVERRIDE · USE DEFAULT'}
                </button>
              )}
            </div>
            {hasOverride && (
              <VersionRevert
                entityId={override!.id}
                entityType="kit_override"
                kitSlug={kitSlug}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
