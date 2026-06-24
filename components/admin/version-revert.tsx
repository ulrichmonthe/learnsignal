'use client'

import { useState } from 'react'
import { getVersionsAction, revertToVersion } from '@/lib/admin/actions'
import type { ContentVersion } from '@/lib/admin/types'

const ACCENT = '#C8F040'

interface VersionRevertProps {
  entityId: string
  entityType: 'kit_block' | 'shared_block' | 'kit_override' | 'kit_manifest'
  kitSlug?: string
  onReverted?: () => void
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function VersionRevert({ entityId, entityType, kitSlug, onReverted }: VersionRevertProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reverting, setReverting] = useState<string | null>(null)
  const [versions, setVersions] = useState<ContentVersion[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    const result = await getVersionsAction(entityId)
    setLoading(false)
    if (result.success) {
      setVersions(result.versions as ContentVersion[])
    } else {
      setError('Failed to load versions')
    }
  }

  async function handleRevert(versionId: string) {
    if (!confirm('Revert to this version? The current state will be saved as a new version.')) return
    setReverting(versionId)
    const result = await revertToVersion(versionId, entityType, entityId, kitSlug)
    setReverting(null)
    if (result.success) {
      setOpen(false)
      onReverted?.()
    } else {
      setError(result.error || 'Revert failed')
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="font-mono"
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.45)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ↻ PRIOR VERSIONS
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-6 z-20 rounded-lg"
          style={{
            width: '260px',
            background: '#1c1c1c',
            border: '0.5px solid rgba(255,255,255,0.15)',
            padding: '12px',
          }}
        >
          <p
            className="font-mono mb-3"
            style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}
          >
            VERSION HISTORY
          </p>

          {loading && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
          )}

          {error && (
            <p style={{ fontSize: '12px', color: '#FF6B6B' }}>{error}</p>
          )}

          {!loading && !error && versions.length === 0 && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>No prior versions</p>
          )}

          {!loading && versions.map((v, i) => (
            <div
              key={v.id}
              className="flex items-center justify-between"
              style={{ marginBottom: '8px' }}
            >
              <div>
                <span
                  className="font-mono"
                  style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}
                >
                  {i === 0 ? '[LATEST]' : `[v-${i}]`}
                </span>
                <span
                  className="font-mono ml-2"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)' }}
                >
                  {formatDate(v.created_at)}
                </span>
              </div>
              <button
                onClick={() => handleRevert(v.id)}
                disabled={reverting === v.id}
                className="font-mono"
                style={{
                  fontSize: '10px',
                  color: reverting === v.id ? 'rgba(255,255,255,0.3)' : ACCENT,
                  background: 'none',
                  border: 'none',
                  cursor: reverting === v.id ? 'default' : 'pointer',
                  padding: 0,
                }}
              >
                {reverting === v.id ? '…' : 'REVERT'}
              </button>
            </div>
          ))}

          <button
            onClick={() => setOpen(false)}
            className="font-mono mt-2"
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  )
}
