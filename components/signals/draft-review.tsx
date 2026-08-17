'use client'

import { useState } from 'react'
import type { SignalDraft } from '@/lib/signals/drafts'

// ── tiny markdown-lite renderer (admin-only content → React text nodes, no innerHTML) ──
function renderInline(text: string, key: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={`${key}-${i}`} style={{ color: 'var(--text)' }}>
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${key}-${i}`}>{p}</span>
    ),
  )
}

function renderMarkdown(md: string) {
  return md
    .trim()
    .split(/\n{2,}/)
    .map((block, bi) => {
      const lines = block.split('\n')
      if (lines.every((l) => l.trim().startsWith('- '))) {
        return (
          <ul key={bi} className="list-disc pl-5 space-y-1 my-3">
            {lines.map((l, li) => (
              <li key={li}>{renderInline(l.replace(/^\s*-\s+/, ''), `${bi}-${li}`)}</li>
            ))}
          </ul>
        )
      }
      const h = block.match(/^(#{1,3})\s+([\s\S]*)$/)
      if (h) {
        const cls = h[1].length === 1 ? 'text-lg font-black mt-5 mb-2' : 'text-base font-bold mt-4 mb-2'
        return (
          <p key={bi} className={cls} style={{ color: 'var(--text)' }}>
            {renderInline(h[2], `h-${bi}`)}
          </p>
        )
      }
      return (
        <p key={bi} className="my-3 leading-relaxed">
          {renderInline(block.replace(/\n/g, ' '), `p-${bi}`)}
        </p>
      )
    })
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE: Record<SignalDraft['status'], { label: string; color: string }> = {
  pending: { label: 'Pending review', color: 'var(--warm)' },
  approved: { label: 'Approved', color: 'var(--accent)' },
  rejected: { label: 'Rejected', color: 'var(--red)' },
}

export function DraftReview({
  drafts,
  ok,
  error,
}: {
  drafts: SignalDraft[]
  ok: boolean
  error: string | null
}) {
  const [items, setItems] = useState(drafts)
  const [openBody, setOpenBody] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const pending = items.filter((d) => d.status === 'pending').length

  function toggleBody(id: string) {
    setOpenBody((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function review(id: string, action: 'approve' | 'reject') {
    setBusy(id)
    setToast(null)
    try {
      const res = await fetch('/api/signals/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`)
      setItems((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: data.status, reviewedAt: new Date().toISOString() }
            : d,
        ),
      )
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-2">Signals · Review queue</p>
      <h1 className="font-display text-3xl font-black text-text mb-3">The Week&apos;s Signal — drafts</h1>
      <p className="text-text2 text-sm leading-relaxed max-w-2xl mb-8">
        The Signals Writer files one draft here each week. Read it, check the sources and its self-grade,
        then approve or reject. Nothing is published until you approve.
      </p>

      {toast && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm"
          style={{ border: '0.5px solid rgba(232,64,64,0.4)', background: 'rgba(232,64,64,0.06)', color: 'var(--text)' }}
        >
          {toast}
        </div>
      )}

      {items.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="font-mono text-xs text-accent uppercase tracking-wide mb-2">Empty queue</p>
          <p className="text-text text-sm mb-1">No drafts yet.</p>
          <p className="text-text3 text-xs max-w-md mx-auto leading-relaxed">
            The Signals Writer publishes one pending draft here on its weekly run. Once it does, it will
            appear here for approval.
            {!ok && error ? ' (The drafts table isn’t reachable yet — run the migration and set the service key.)' : ''}
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-4">
            {pending} pending · {items.length} total
          </p>
          {items.map((d) => {
            const s = STATUS_STYLE[d.status]
            const grade = d.selfGrade
            return (
              <article
                key={d.id}
                className="border border-border rounded-lg p-6 mb-5"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span
                    className="font-mono text-[10px] uppercase tracking-wide"
                    style={{ color: s.color }}
                  >
                    ● {s.label}
                  </span>
                  <span className="font-mono text-[10px] text-text3 uppercase tracking-wide">
                    {d.category ? `${d.category} · ` : ''}
                    {d.weekOf ? `Week of ${fmtDate(d.weekOf)}` : fmtDate(d.createdAt)}
                  </span>
                </div>

                <h2 className="font-display text-xl font-black text-text mb-1.5 leading-snug">{d.title}</h2>
                {d.dek && <p className="text-text2 text-sm leading-relaxed mb-4">{d.dek}</p>}

                {d.decisionFraming && (
                  <div
                    className="pl-4 mb-4"
                    style={{ borderLeft: '2px solid var(--accent)' }}
                  >
                    <p className="font-mono text-[10px] text-accent uppercase tracking-wide mb-1">
                      The decision it changes
                    </p>
                    <p className="text-text text-sm italic leading-relaxed">{d.decisionFraming}</p>
                  </div>
                )}

                {grade && (
                  <div className="mb-4">
                    <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                      <span className="font-mono text-xs text-text3 uppercase tracking-wide">Self-grade </span>
                      <strong>
                        {grade.score}/{grade.max}
                      </strong>
                      {grade.verdict ? ` — ${grade.verdict}` : ''}
                    </p>
                    <ul className="space-y-1">
                      {grade.criteria?.map((c, i) => (
                        <li key={i} className="text-xs text-text2 leading-relaxed">
                          <span style={{ color: c.pass ? 'var(--accent)' : 'var(--red)' }}>
                            {c.pass ? '✓' : '✗'}
                          </span>{' '}
                          {c.name}
                          {c.note ? <span className="text-text3"> — {c.note}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {d.sources.length > 0 && (
                  <div className="mb-4">
                    <p className="font-mono text-[10px] text-text3 uppercase tracking-wide mb-1.5">Sources</p>
                    <ul className="space-y-1">
                      {d.sources.map((src, i) => (
                        <li key={i} className="text-xs leading-relaxed">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline break-words"
                          >
                            {src.title || src.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => toggleBody(d.id)}
                  className="tap font-mono text-[11px] text-text2 hover:text-text uppercase tracking-wide"
                >
                  {openBody.has(d.id) ? '– Hide draft' : '+ Read draft'}
                </button>

                {openBody.has(d.id) && (
                  <div
                    className="mt-4 pt-4 text-sm text-text2"
                    style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}
                  >
                    {renderMarkdown(d.bodyMd)}
                  </div>
                )}

                <div className="mt-5 pt-4 flex items-center gap-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                  {d.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => review(d.id, 'approve')}
                        disabled={busy === d.id}
                        className="tap font-mono text-xs font-medium rounded px-4 py-2 disabled:opacity-50"
                        style={{ background: 'var(--accent)', color: 'black', letterSpacing: '0.06em' }}
                      >
                        {busy === d.id ? 'SAVING…' : 'APPROVE'}
                      </button>
                      <button
                        onClick={() => review(d.id, 'reject')}
                        disabled={busy === d.id}
                        className="tap font-mono text-xs font-medium rounded px-4 py-2 disabled:opacity-50"
                        style={{ border: '0.5px solid rgba(255,255,255,0.25)', color: 'var(--text)', letterSpacing: '0.06em' }}
                      >
                        REJECT
                      </button>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-text3 uppercase tracking-wide">
                      {d.status === 'approved' ? 'Approved' : 'Rejected'}
                      {d.reviewer ? ` · ${d.reviewer}` : ''}
                      {d.reviewedAt ? ` · ${fmtDate(d.reviewedAt)}` : ''}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </>
      )}
    </div>
  )
}
