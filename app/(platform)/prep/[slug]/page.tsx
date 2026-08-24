import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { jobsClient } from '@/lib/jobs/client'
import { createServiceClient } from '@/lib/supabase/server'
import { CAPABILITY_MAP, itemHref, itemKindLabel } from '@/lib/capabilities/map'
import { getClaimedCaps, getPractice, itemDone, jobReadiness } from '@/lib/capabilities/readiness'
import { getScenarioPractice } from '@/lib/capabilities/scenarios'

export const dynamic = 'force-dynamic'

// Prep track — generated per (role, user), derived live from the capability map
// and the user's existing progress. Deliberately stateless: no prep_tracks
// table; completing any step through its normal surface (lesson page, lab)
// advances the track automatically because completion lives in lab_progress.

interface RawJob {
  job_hash: string
  company: string
  title: string
  url: string
  ai_depth: number | string
  seniority: string
  capabilities_required: unknown
}

function parseCaps(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

export default async function PrepPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { userId } = await auth()

  const jobs = jobsClient()
  if (!jobs) notFound()
  const { data } = await jobs
    .from('ai_pm_jobs')
    .select('job_hash, company, title, url, ai_depth, seniority, capabilities_required')
    .eq('job_hash', slug)
    .maybeSingle()
  if (!data) notFound()

  const raw = data as RawJob
  const job = {
    jobHash: raw.job_hash,
    company: raw.company ?? '',
    title: raw.title ?? '',
    url: raw.url ?? '',
    aiDepth: Number(raw.ai_depth ?? 0),
    seniority: raw.seniority ?? 'unknown',
    capabilitiesRequired: parseCaps(raw.capabilities_required),
  }

  const supabase = await createServiceClient()
  const [practice, claimed, scenarioPractice] = await Promise.all([
    getPractice(supabase, userId ?? ''),
    getClaimedCaps(supabase, userId ?? ''),
    getScenarioPractice(supabase, userId ?? ''),
  ])
  const readiness = jobReadiness(job, practice, claimed, scenarioPractice)

  // The track: every mapped item for each required capability, with live done
  // state. Gap capabilities lead; met ones collapse to a single confirmation.
  const gapCaps = readiness.caps.filter((c) => c.state !== 'met')
  const metCaps = readiness.caps.filter((c) => c.state === 'met')

  const sections = gapCaps.map((c) => {
    const def = CAPABILITY_MAP[c.cap]
    const items = def.items.map((item) => ({
      item: { title: item.title, minutes: item.minutes },
      done: itemDone(item, practice),
      href: itemHref(item),
      kind: itemKindLabel(item),
    }))
    // Scenarios tagged with this capability are the hardest practice available —
    // list them first so the track leads with the real decision.
    const scenarioItems = scenarioPractice
      .filter((s) => s.capabilities.includes(c.cap))
      .map((s) => ({
        item: { title: s.title, minutes: s.estimatedMinutes },
        done: s.completed,
        href: `/scenarios/${s.slug}`,
        kind: 'Scenario',
      }))
    return { cap: c, items: [...scenarioItems, ...items] }
  })

  const remainingMin = sections
    .flatMap((s) => s.items)
    .filter((i) => !i.done)
    .reduce((sum, i) => sum + i.item.minutes, 0)
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0)
  const doneItems = sections.reduce((n, s) => n + s.items.filter((i) => i.done).length, 0)

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-2">
        Prep track · generated for
      </p>
      <h1 className="font-display text-3xl font-black text-text mb-1">
        {job.company} — {job.title}
      </h1>
      <p className="font-mono text-xs text-text3 mb-8">
        {readiness.ready
          ? 'No gaps — you cover what this role demands.'
          : `${readiness.gaps} gap${readiness.gaps === 1 ? '' : 's'} · ~${remainingMin} min of practice to close them`}
        {gapCaps.length > 0 && ` · ${doneItems}/${totalItems} items done`}
      </p>

      {metCaps.length > 0 && (
        <div
          className="mb-6 rounded-lg p-4"
          style={{ border: '0.5px solid rgba(200,240,64,0.25)', background: 'rgba(200,240,64,0.03)' }}
        >
          <p className="font-mono text-[10px] text-accent uppercase tracking-wide mb-2">
            Already covered
          </p>
          <div className="flex flex-wrap gap-2">
            {metCaps.map((c) => (
              <span
                key={c.cap}
                className="font-mono text-[11px] px-2 py-1 rounded"
                style={{ color: 'var(--accent)', border: '0.5px solid rgba(200,240,64,0.35)' }}
              >
                ✓ {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {sections.map(({ cap, items }) => (
        <div key={cap.cap} className="mb-7">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-mono text-xs uppercase tracking-wide" style={{ color: 'var(--warm)' }}>
              {cap.state === 'claimed' ? '◇' : '△'} {cap.label} — you&apos;re {cap.level}/{cap.need}
            </h2>
            {cap.state === 'claimed' && (
              <span className="font-mono text-[10px]" style={{ color: 'var(--teal)' }}>
                claimed on your resume — verify by practicing
              </span>
            )}
          </div>
          <div className="space-y-2">
            {items.map(({ item, done, href, kind }, i) => (
              <a
                key={`${cap.cap}-${i}`}
                href={href}
                className="lift flex items-center gap-4 border border-border rounded-lg px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.015)', textDecoration: 'none' }}
              >
                <span
                  className="font-mono text-xs w-5 text-center flex-none"
                  style={{ color: done ? 'var(--accent)' : 'var(--text3)' }}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-sm"
                    style={{
                      color: done ? 'var(--text3)' : 'var(--text)',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wide text-text3 border border-border rounded px-2 py-0.5 flex-none">
                  {kind}
                </span>
                <span className="font-mono text-[11px] text-text2 flex-none">{item.minutes} min</span>
              </a>
            ))}
          </div>
        </div>
      ))}

      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="lift flex items-center gap-4 rounded-lg px-4 py-4 mb-8"
        style={{
          border: '0.5px dashed rgba(200,240,64,0.4)',
          background: 'rgba(200,240,64,0.03)',
          textDecoration: 'none',
        }}
      >
        <span className="font-mono text-sm flex-none" style={{ color: 'var(--accent)' }}>
          ★
        </span>
        <span className="flex-1">
          <span className="block text-sm" style={{ color: 'var(--text)' }}>
            Apply to {job.company}
          </span>
          <span className="block font-mono text-[10px] text-text3 mt-0.5">
            {readiness.ready
              ? 'Your practice covers this role — go.'
              : 'You can apply any time — the track just makes you readier.'}
          </span>
        </span>
        <span className="font-mono text-[11px] flex-none" style={{ color: 'var(--accent)' }}>
          Open posting →
        </span>
      </a>

      <p className="text-text3 text-xs leading-relaxed max-w-xl">
        This track is generated from the role&apos;s classified capabilities and your practice
        history — it updates as you complete lessons and missions anywhere on the platform.
        Time estimates are authored; they&apos;ll calibrate to real completion times as the
        platform learns. <a href="/jobs" className="text-accent hover:underline">← Back to the board</a>
      </p>
    </div>
  )
}
