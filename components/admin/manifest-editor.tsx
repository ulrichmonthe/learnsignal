'use client'

import { useState } from 'react'
import { updateKitManifest } from '@/lib/admin/actions'
import VersionRevert from './version-revert'
import type { Kit } from '@/lib/admin/types'

const ACCENT = '#C8F040'
const STATUS_OPTIONS = ['live', 'draft', 'coming_soon'] as const
const INPUT_STYLE = {
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

interface ManifestEditorProps {
  kit: Kit
}

type FieldKey = 'name' | 'description' | 'status' | 'tool_mirrored' | 'classifier_keywords'

export default function ManifestEditor({ kit }: ManifestEditorProps) {
  const [editingField, setEditingField] = useState<FieldKey | null>(null)
  const [values, setValues] = useState({
    name: kit.name,
    description: kit.description || '',
    status: kit.status,
    tool_mirrored: kit.tool_mirrored || '',
    classifier_keywords: kit.classifier_keywords,
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(field: FieldKey) {
    setSaving(true)
    setError(null)
    const update: Parameters<typeof updateKitManifest>[1] = {}
    if (field === 'name') update.name = values.name
    if (field === 'description') update.description = values.description
    if (field === 'status') update.status = values.status as Kit['status']
    if (field === 'tool_mirrored') update.tool_mirrored = values.tool_mirrored
    if (field === 'classifier_keywords') update.classifier_keywords = values.classifier_keywords

    const result = await updateKitManifest(kit.id, update)
    setSaving(false)
    if (result.success) {
      setEditingField(null)
    } else {
      setError(result.error || 'Save failed')
    }
  }

  function removeKeyword(kw: string) {
    setValues(v => ({ ...v, classifier_keywords: v.classifier_keywords.filter(k => k !== kw) }))
  }

  function addKeyword() {
    const kw = keywordInput.trim().toLowerCase()
    if (kw && !values.classifier_keywords.includes(kw)) {
      setValues(v => ({ ...v, classifier_keywords: [...v.classifier_keywords, kw] }))
    }
    setKeywordInput('')
  }

  const fieldRows: { key: FieldKey; label: string; readOnly?: boolean }[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'tool_mirrored', label: 'Tool mirrored' },
    { key: 'classifier_keywords', label: 'Classifier keywords' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p
          className="font-mono uppercase"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}
        >
          Manifest
        </p>
        <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', flex: 1 }} />
        <p
          className="font-mono"
          style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}
        >
          SLUG: {kit.slug}
        </p>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}
      >
        {fieldRows.map((row, idx) => (
          <div
            key={row.key}
            style={{ borderBottom: idx < fieldRows.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}
          >
            {/* Collapsed row */}
            {editingField !== row.key && (
              <button
                className="w-full text-left"
                style={{ padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setEditingField(row.key)}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="font-mono flex-shrink-0"
                    style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', width: '160px' }}
                  >
                    {row.label.toUpperCase()}
                  </span>
                  <span
                    className="font-mono flex-1 text-right"
                    style={{
                      fontSize: '12px',
                      color: row.key === 'status' && values.status === 'live'
                        ? ACCENT
                        : 'rgba(255,255,255,0.75)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {row.key === 'classifier_keywords'
                      ? values.classifier_keywords.join(', ') || '—'
                      : (values[row.key] as string) || '—'
                    }
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    EDIT
                  </span>
                </div>
              </button>
            )}

            {/* Expanded row */}
            {editingField === row.key && (
              <div
                style={{
                  padding: '16px 18px',
                  background: 'rgba(200,240,64,0.03)',
                  border: '0.5px solid rgba(200,240,64,0.2)',
                  margin: '4px',
                  borderRadius: '8px',
                }}
              >
                <p
                  className="font-mono mb-3"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}
                >
                  EDITING: {row.label.toUpperCase()}
                </p>

                {row.key === 'status' && (
                  <select
                    value={values.status}
                    onChange={e => setValues(v => ({ ...v, status: e.target.value as Kit['status'] }))}
                    style={{ ...INPUT_STYLE }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} style={{ background: '#1a1a1a' }}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                )}

                {row.key === 'classifier_keywords' && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {values.classifier_keywords.map(kw => (
                        <span
                          key={kw}
                          className="font-mono flex items-center gap-1"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: 'rgba(200,240,64,0.08)',
                            border: '0.5px solid rgba(200,240,64,0.25)',
                            borderRadius: '4px',
                            color: ACCENT,
                          }}
                        >
                          {kw}
                          <button
                            onClick={() => removeKeyword(kw)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        style={{ ...INPUT_STYLE, flex: 1 }}
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        placeholder="Add keyword…"
                      />
                      <button
                        onClick={addKeyword}
                        className="font-mono"
                        style={{
                          padding: '8px 14px',
                          fontSize: '11px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '0.5px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                )}

                {row.key !== 'status' && row.key !== 'classifier_keywords' && (
                  <input
                    style={INPUT_STYLE}
                    value={values[row.key] as string}
                    onChange={e => setValues(v => ({ ...v, [row.key]: e.target.value }))}
                  />
                )}

                {error && (
                  <p style={{ fontSize: '12px', color: '#FF6B6B', marginTop: '8px' }}>{error}</p>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => save(row.key)}
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
                    <button
                      onClick={() => { setEditingField(null); setError(null) }}
                      disabled={saving}
                      className="font-mono"
                      style={{
                        fontSize: '10px',
                        padding: '8px 14px',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.5)',
                        border: '0.5px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                  <VersionRevert
                    entityId={kit.id}
                    entityType="kit_manifest"
                    kitSlug={kit.slug}
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
