'use client'

import { useRef, useState } from 'react'

// Dashboard panel for the job-gap loop's two user-owned pieces:
//  · Resume bridge — upload a PDF, see claimed capabilities, delete anytime.
//  · Decision Record — claim a handle and publish /u/<handle>, or unpublish.

export interface ClaimRow {
  capability: string
  label: string
  evidenceQuote: string
  practiceHref: string
}

export function LoopPanel({
  initialClaims,
  initialHandle,
  initialPublic,
}: {
  initialClaims: ClaimRow[]
  initialHandle: string | null
  initialPublic: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
      <ResumeBridge initialClaims={initialClaims} />
      <RecordCard initialHandle={initialHandle} initialPublic={initialPublic} />
    </div>
  )
}

function panelStyle(): React.CSSProperties {
  return { border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }
}

function ResumeBridge({ initialClaims }: { initialClaims: ClaimRow[] }) {
  const [claims, setClaims] = useState(initialClaims)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setBusy(true)
    setNote(null)
    try {
      const buf = await file.arrayBuffer()
      let binary = ''
      const bytes = new Uint8Array(buf)
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      }
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: btoa(binary) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`)
      const rows: ClaimRow[] = (json.claims ?? []).map(
        (c: { capability: string; evidence_quote: string }) => ({
          capability: c.capability,
          label: c.capability.replace(/_/g, ' '),
          evidenceQuote: c.evidence_quote,
          practiceHref: '/playground/learn',
        }),
      )
      setClaims(rows)
      setNote(rows.length === 0 ? 'No concrete capability evidence found in that resume.' : null)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removeAll() {
    setBusy(true)
    try {
      const res = await fetch('/api/resume', { method: 'DELETE' })
      if (res.ok) {
        setClaims([])
        setNote('Resume data removed.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg p-5" style={panelStyle()}>
      <p className="font-mono text-xs text-teal uppercase tracking-wide mb-2">Resume bridge</p>
      <p className="text-text2 text-sm leading-relaxed mb-4">
        Experience from before LearnSignal? Upload your resume and the job board will show it as
        <span style={{ color: 'var(--teal)' }}> ◇ claimed</span> — then verify it by practicing.
        Claims never count as proof; only demonstrated decisions do.
      </p>

      {claims.length > 0 ? (
        <div className="space-y-2 mb-4">
          {claims.map((c) => (
            <div
              key={c.capability}
              className="rounded px-3 py-2"
              style={{ border: '0.5px dashed rgba(48,196,176,0.45)' }}
            >
              <p className="font-mono text-[11px]" style={{ color: 'var(--teal)' }}>
                ◇ {c.label} · claimed
              </p>
              {c.evidenceQuote && (
                <p className="text-text3 text-xs italic mt-0.5 leading-relaxed">
                  &ldquo;{c.evidenceQuote}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap">
        <label
          className="tap font-mono text-xs font-medium rounded px-4 py-2 cursor-pointer"
          style={{ background: 'var(--accent)', color: 'black', letterSpacing: '0.06em', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'PARSING…' : claims.length > 0 ? 'REPLACE RESUME' : 'UPLOAD RESUME (PDF)'}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void upload(f)
            }}
          />
        </label>
        {claims.length > 0 && (
          <button
            onClick={removeAll}
            disabled={busy}
            className="tap font-mono text-[11px] text-text3 hover:text-text uppercase tracking-wide"
          >
            Remove data
          </button>
        )}
      </div>
      {note && <p className="text-text3 text-xs mt-3">{note}</p>}
      <p className="text-text3 text-[11px] mt-3 leading-relaxed">
        Parsed privately — the file is read once and discarded; only the claims above are stored.
      </p>
    </div>
  )
}

function RecordCard({
  initialHandle,
  initialPublic,
}: {
  initialHandle: string | null
  initialPublic: boolean
}) {
  const [handle, setHandle] = useState(initialHandle ?? '')
  const [live, setLive] = useState(initialPublic && !!initialHandle)
  const [liveHandle, setLiveHandle] = useState(initialPublic ? initialHandle : null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function publish() {
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`)
      setLive(true)
      setLiveHandle(json.handle)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not publish')
    } finally {
      setBusy(false)
    }
  }

  async function unpublish() {
    setBusy(true)
    try {
      const res = await fetch('/api/record', { method: 'DELETE' })
      if (res.ok) {
        setLive(false)
        setLiveHandle(null)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg p-5" style={panelStyle()}>
      <p className="font-mono text-xs text-accent uppercase tracking-wide mb-2">Decision Record</p>
      <p className="text-text2 text-sm leading-relaxed mb-4">
        Your public proof-of-judgment page — skill map, decision counts, and verified capabilities.
        Share it with an application; everything on it was demonstrated here, never self-reported.
      </p>

      {live && liveHandle ? (
        <div>
          <p className="text-sm mb-3">
            <span className="text-text3 font-mono text-xs">Live at </span>
            <a href={`/u/${liveHandle}`} className="text-accent hover:underline font-mono text-sm">
              learnsignal.ai/u/{liveHandle}
            </a>
          </p>
          <div className="flex gap-3 items-center">
            <a
              href={`/u/${liveHandle}`}
              className="tap font-mono text-xs font-medium rounded px-4 py-2"
              style={{ background: 'var(--accent)', color: 'black', letterSpacing: '0.06em', textDecoration: 'none' }}
            >
              VIEW RECORD →
            </a>
            <button
              onClick={unpublish}
              disabled={busy}
              className="tap font-mono text-[11px] text-text3 hover:text-text uppercase tracking-wide"
            >
              Unpublish
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-mono text-xs text-text3">learnsignal.ai/u/</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            placeholder="your-handle"
            className="font-mono text-sm rounded px-3 py-2 flex-1 min-w-[120px]"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border2)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            onClick={publish}
            disabled={busy || handle.length < 3}
            className="tap font-mono text-xs font-medium rounded px-4 py-2 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'black', letterSpacing: '0.06em' }}
          >
            {busy ? 'PUBLISHING…' : 'PUBLISH'}
          </button>
        </div>
      )}
      {note && <p className="text-xs mt-3" style={{ color: 'var(--warm)' }}>{note}</p>}
    </div>
  )
}
