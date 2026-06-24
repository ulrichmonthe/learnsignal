'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateSharedBlock } from '@/lib/admin/actions'
import VersionRevert from './version-revert'
import type { SharedBlock } from '@/lib/admin/types'

const ACCENT = '#C8F040'
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  border: '0.5px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-dm-mono, monospace)',
  width: '100%',
  outline: 'none',
  resize: 'vertical' as const,
}

interface SharedBlockEditorProps {
  block: SharedBlock
}

export default function SharedBlockEditor({ block }: SharedBlockEditorProps) {
  const [editingJson, setEditingJson] = useState(
    JSON.stringify(block.default_data, null, 2)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(editingJson)
    } catch {
      setError('Invalid JSON — check the value before saving')
      return
    }
    setSaving(true)
    const result = await updateSharedBlock(block.id, parsed)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error || 'Save failed')
    }
  }

  return (
    <div>
      {/* Warning banner */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255,215,102,0.06)',
          border: '0.5px solid rgba(255,215,102,0.25)',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <p style={{ fontSize: '13px', color: '#FFD966', lineHeight: 1.5 }}>
          ⚠ Changes here affect every kit that uses this default.
          Kits with overrides are unaffected.
        </p>
      </div>

      {/* Header */}
      <h1
        className="font-display font-medium mb-2"
        style={{ fontSize: '24px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}
      >
        {block.name}
      </h1>
      {block.description && (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', lineHeight: 1.6 }}>
          {block.description}
        </p>
      )}
      <p
        className="font-mono mb-6"
        style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}
      >
        {block.allows_kit_override ? 'ALLOWS KIT OVERRIDES' : 'SHARED — NO OVERRIDES'}
      </p>

      <p
        className="font-mono mb-2"
        style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}
      >
        DEFAULT VALUE (JSON)
      </p>
      <textarea
        rows={10}
        value={editingJson}
        onChange={e => setEditingJson(e.target.value)}
        style={INPUT_STYLE}
      />

      {error && (
        <p style={{ fontSize: '12px', color: '#FF6B6B', marginTop: '8px' }}>{error}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-3 items-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-mono"
            style={{
              fontSize: '10px',
              padding: '8px 14px',
              background: saved ? 'rgba(200,240,64,0.5)' : saving ? 'rgba(200,240,64,0.4)' : ACCENT,
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'default' : 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {saved ? 'SAVED ✓' : saving ? 'SAVING…' : 'SAVE · GOES LIVE'}
          </button>
          <Link
            href="/admin/shared"
            className="font-mono"
            style={{
              fontSize: '10px',
              padding: '8px 14px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            BACK
          </Link>
        </div>
        <VersionRevert
          entityId={block.id}
          entityType="shared_block"
        />
      </div>
    </div>
  )
}
