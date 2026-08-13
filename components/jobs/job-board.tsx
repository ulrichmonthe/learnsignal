'use client'

import { useMemo, useState } from 'react'
import type { Job } from '@/lib/jobs/get-jobs'

// ── AI PM Job Board ──────────────────────────────────────────────────────────
// Interactive, filterable board. Consumes the read-only getJobs() result. All
// styles are scoped under `.jb` via one <style> block so nothing depends on
// marketing.css and nothing leaks. Motion follows the honesty-gap easing tokens
// and respects prefers-reduced-motion.

type SortKey = 'newest' | 'depth'

interface JobBoardProps {
  jobs: Job[]
  ok: boolean
  error: string | null
}

// ── Humanizers ───────────────────────────────────────────────────────────────
const ARCHETYPES: Array<{ key: string; label: string }> = [
  { key: 'model_platform', label: 'Model / platform' },
  { key: 'applied_feature', label: 'Applied feature' },
  { key: 'ai_infra', label: 'AI infra' },
  { key: 'ai_native_0to1', label: 'AI-native 0→1' },
  { key: 'internal_ai_ops', label: 'Internal AI ops' },
]

const SENIORITIES: Array<{ key: string; label: string }> = [
  { key: 'ic_senior', label: 'Senior IC' },
  { key: 'staff', label: 'Staff' },
  { key: 'principal', label: 'Principal' },
  { key: 'lead', label: 'Lead' },
  { key: 'director', label: 'Director' },
]

const LOCATIONS: Array<{ key: string; label: string }> = [
  { key: 'remote', label: 'Remote' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'onsite', label: 'Onsite' },
]

const DEPTHS = [2, 3, 4, 5] as const

const CAPABILITY_OVERRIDES: Record<string, string> = {
  human_in_the_loop: 'human-in-the-loop',
  a_b_testing: 'A/B testing',
  llm_evaluation: 'LLM evaluation',
  rag: 'RAG',
  rlhf: 'RLHF',
}

function labelFor(list: Array<{ key: string; label: string }>, key: string): string {
  return list.find((x) => x.key === key)?.label ?? key.replace(/_/g, ' ')
}

function humanizeArchetype(key: string): string {
  return labelFor(ARCHETYPES, key)
}
function humanizeSeniority(key: string): string {
  return labelFor(SENIORITIES, key)
}
function humanizeLocationPolicy(key: string): string {
  const found = LOCATIONS.find((x) => x.key === key)
  if (found) return found.label
  return key.charAt(0).toUpperCase() + key.slice(1)
}
function humanizeCapability(key: string): string {
  return CAPABILITY_OVERRIDES[key] ?? key.replace(/_/g, ' ')
}

function timeValue(job: Job): number {
  const iso = job.classifiedAt ?? job.postedAt
  if (!iso) return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

function humanizeDate(iso: string | null): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const day = 86_400_000
  if (diff < 0) return 'just now'
  if (diff < day) {
    const hrs = Math.floor(diff / 3_600_000)
    if (hrs < 1) return 'just now'
    return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`
  }
  const days = Math.floor(diff / day)
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Lime intensity rises 2 → 5.
function depthBadgeStyle(depth: number): React.CSSProperties {
  const clamped = Math.max(2, Math.min(5, depth))
  const alphaBg = { 2: 0.08, 3: 0.14, 4: 0.24, 5: 1 }[clamped] ?? 0.08
  const solid = clamped >= 5
  return {
    background: solid ? 'var(--acc)' : `rgba(200,240,64,${alphaBg})`,
    borderColor: solid ? 'var(--acc)' : `rgba(200,240,64,${Math.min(0.6, alphaBg + 0.2)})`,
    color: solid ? '#100f0c' : 'var(--acc)',
  }
}

function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function JobBoard({ jobs, ok, error }: JobBoardProps) {
  const [query, setQuery] = useState('')
  const [archetypes, setArchetypes] = useState<ReadonlySet<string>>(new Set())
  const [seniorities, setSeniorities] = useState<ReadonlySet<string>>(new Set())
  const [locations, setLocations] = useState<ReadonlySet<string>>(new Set())
  const [minDepth, setMinDepth] = useState<number>(2)
  const [compOnly, setCompOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  const filtersActive =
    query.trim() !== '' ||
    archetypes.size > 0 ||
    seniorities.size > 0 ||
    locations.size > 0 ||
    minDepth > 2 ||
    compOnly

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = jobs.filter((job) => {
      if (q) {
        const hay = `${job.company} ${job.title} ${job.oneLineSummary}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (archetypes.size > 0 && !archetypes.has(job.archetype)) return false
      if (seniorities.size > 0 && !seniorities.has(job.seniority)) return false
      if (locations.size > 0 && !locations.has(job.locationPolicy)) return false
      if (job.aiDepth < minDepth) return false
      if (compOnly && !job.compDisclosed) return false
      return true
    })
    out.sort((a, b) => {
      if (sort === 'depth') {
        if (b.aiDepth !== a.aiDepth) return b.aiDepth - a.aiDepth
        return timeValue(b) - timeValue(a)
      }
      const t = timeValue(b) - timeValue(a)
      if (t !== 0) return t
      return b.aiDepth - a.aiDepth
    })
    return out
  }, [jobs, query, archetypes, seniorities, locations, minDepth, compOnly, sort])

  function clearFilters() {
    setQuery('')
    setArchetypes(new Set())
    setSeniorities(new Set())
    setLocations(new Set())
    setMinDepth(2)
    setCompOnly(false)
  }

  function toggleExpanded(hash: string) {
    setExpanded((prev) => toggle(prev, hash))
  }

  return (
    <div className="jb">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Top bar */}
      <div className="jb-topbar">
        <div className="jb-count-block">
          <div className="jb-count">
            <span className="jb-count-n">{jobs.length}</span> AI PM roles
          </div>
          <div className="jb-refresh">
            Refreshed every 6 hours — {jobs.length} from real ATS boards, filtered by an AI-depth
            rubric.
          </div>
        </div>
        <label className="jb-search" aria-label="Search roles">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, title, summary…"
          />
        </label>
      </div>

      {/* Filters */}
      {ok && jobs.length > 0 && (
        <div className="jb-filters">
          <div className="jb-filters-head">
            <button
              type="button"
              className="jb-filters-toggle"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <span className={`jb-chev ${filtersOpen ? 'jb-chev-open' : ''}`} aria-hidden="true">
                ▸
              </span>
              Filters
              {filtersActive && <span className="jb-filters-dot" aria-hidden="true" />}
            </button>
            <div className="jb-live">
              <span className="jb-live-n">{filtered.length}</span> shown
              {filtersActive && (
                <button type="button" className="jb-clear" onClick={clearFilters}>
                  clear
                </button>
              )}
            </div>
          </div>

          <div className={`jb-filters-body ${filtersOpen ? 'jb-open' : ''}`}>
            <div className="jb-filters-inner">
              <FilterGroup label="Archetype">
                {ARCHETYPES.map((a) => (
                  <Chip
                    key={a.key}
                    active={archetypes.has(a.key)}
                    onClick={() => setArchetypes((s) => toggle(s, a.key))}
                  >
                    {a.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Seniority">
                {SENIORITIES.map((s) => (
                  <Chip
                    key={s.key}
                    active={seniorities.has(s.key)}
                    onClick={() => setSeniorities((prev) => toggle(prev, s.key))}
                  >
                    {s.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="AI depth (minimum)">
                {DEPTHS.map((d) => (
                  <Chip key={d} active={minDepth === d} onClick={() => setMinDepth(d)}>
                    {d}+
                  </Chip>
                ))}
                {minDepth > 2 && (
                  <button type="button" className="jb-mini-clear" onClick={() => setMinDepth(2)}>
                    reset
                  </button>
                )}
              </FilterGroup>

              <FilterGroup label="Location">
                {LOCATIONS.map((l) => (
                  <Chip
                    key={l.key}
                    active={locations.has(l.key)}
                    onClick={() => setLocations((s) => toggle(s, l.key))}
                  >
                    {l.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Compensation">
                <Chip active={compOnly} onClick={() => setCompOnly((v) => !v)}>
                  Comp disclosed
                </Chip>
              </FilterGroup>
            </div>
          </div>
        </div>
      )}

      {/* Sort + legend */}
      {ok && jobs.length > 0 && (
        <div className="jb-controls-row">
          <div className="jb-sort" role="group" aria-label="Sort roles">
            <span className="jb-sort-label">Sort</span>
            <button
              type="button"
              className={`jb-seg ${sort === 'newest' ? 'jb-seg-on' : ''}`}
              aria-pressed={sort === 'newest'}
              onClick={() => setSort('newest')}
            >
              Newest
            </button>
            <button
              type="button"
              className={`jb-seg ${sort === 'depth' ? 'jb-seg-on' : ''}`}
              aria-pressed={sort === 'depth'}
              onClick={() => setSort('depth')}
            >
              AI depth
            </button>
          </div>
          <div className="jb-legend">
            <span className="jb-legend-head">AI depth</span>
            <span>2 = AI is the surface</span>
            <span>3 = names a real artefact</span>
            <span>4 = owns model quality</span>
            <span>5 = the role IS the model</span>
          </div>
        </div>
      )}

      {/* States */}
      {!ok ? (
        <div className="jb-state">
          <div className="jb-state-title">The board is briefly unavailable</div>
          <div className="jb-state-body">Check back shortly.</div>
        </div>
      ) : filtered.length === 0 ? (
        jobs.length === 0 ? (
          <div className="jb-state">
            <div className="jb-state-title">The board is warming up</div>
            <div className="jb-state-body">The ingest runs every 6 hours.</div>
          </div>
        ) : (
          <div className="jb-state">
            <div className="jb-state-title">No roles match</div>
            <div className="jb-state-body">Try clearing filters.</div>
            {filtersActive && (
              <button type="button" className="jb-state-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )
      ) : (
        <ul className="jb-list">
          {filtered.map((job) => (
            <JobCard
              key={job.jobHash}
              job={job}
              expanded={expanded.has(job.jobHash)}
              onToggle={() => toggleExpanded(job.jobHash)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="jb-fgroup">
      <div className="jb-fgroup-label">{label}</div>
      <div className="jb-fgroup-chips">{children}</div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={`jb-chip ${active ? 'jb-chip-on' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function JobCard({
  job,
  expanded,
  onToggle,
}: {
  job: Job
  expanded: boolean
  onToggle: () => void
}) {
  const posted = humanizeDate(job.classifiedAt ?? job.postedAt)
  const hasEvidence = job.aiDepthEvidence.length > 0
  return (
    <li className="jb-card">
      <div className="jb-card-top">
        <div className="jb-card-headings">
          <a
            className="jb-card-title"
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {job.title || 'Untitled role'}
          </a>
          <div className="jb-card-meta">
            <span className="jb-company">{job.company || 'Unknown company'}</span>
            {job.location && <span className="jb-dot-sep">·</span>}
            {job.location && <span className="jb-loc">{job.location}</span>}
            <span className={`jb-locpill jb-loc-${job.locationPolicy}`}>
              {humanizeLocationPolicy(job.locationPolicy)}
            </span>
          </div>
        </div>
        <span className="jb-depth" style={depthBadgeStyle(job.aiDepth)}>
          AI depth {job.aiDepth}
        </span>
      </div>

      <div className="jb-tags">
        <span className="jb-tag jb-tag-arch">{humanizeArchetype(job.archetype)}</span>
        <span className="jb-tag">{humanizeSeniority(job.seniority)}</span>
        {job.compDisclosed && <span className="jb-tag jb-tag-comp">✓ comp disclosed</span>}
        {posted && <span className="jb-tag jb-tag-date">{posted}</span>}
      </div>

      {job.oneLineSummary && <p className="jb-summary">{job.oneLineSummary}</p>}

      {job.capabilitiesRequired.length > 0 && (
        <div className="jb-caps">
          {job.capabilitiesRequired.map((c) => (
            <span key={c} className="jb-cap">
              {humanizeCapability(c)}
            </span>
          ))}
        </div>
      )}

      <div className="jb-card-actions">
        {hasEvidence && (
          <button
            type="button"
            className="jb-why"
            aria-expanded={expanded}
            onClick={onToggle}
          >
            <span className={`jb-chev ${expanded ? 'jb-chev-open' : ''}`} aria-hidden="true">
              ▸
            </span>
            Why it qualified
          </button>
        )}
        <a className="jb-view" href={job.url} target="_blank" rel="noopener noreferrer">
          View role →
        </a>
      </div>

      {hasEvidence && (
        <div className={`jb-evidence ${expanded ? 'jb-evidence-open' : ''}`}>
          <div className="jb-evidence-inner">
            <ul className="jb-evidence-list">
              {job.aiDepthEvidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  )
}

// ── Scoped styles ────────────────────────────────────────────────────────────
const CSS = `
.jb{
  --acc:#C8F040; --clay:#CE9079; --bg:#100f0c; --line:rgba(255,255,255,0.10);
  --t1:rgba(255,255,255,0.92); --t2:rgba(255,255,255,0.62); --t3:rgba(255,255,255,0.38);
  --e-out:cubic-bezier(0.23,1,0.32,1); --e-drawer:cubic-bezier(0.32,0.72,0,1);
  color:var(--t1); font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;
  font-variant-numeric:tabular-nums; max-width:100%; box-sizing:border-box;
}
.jb *{box-sizing:border-box}
.jb button{font-family:inherit}
.jb .jb-mono,.jb-count,.jb-refresh,.jb-fgroup-label,.jb-chip,.jb-seg,.jb-sort-label,.jb-legend,
.jb-depth,.jb-tag,.jb-cap,.jb-locpill,.jb-live,.jb-clear,.jb-filters-toggle,.jb-why,.jb-view,
.jb-mini-clear,.jb-state-clear{font-family:ui-monospace,"SF Mono",Menlo,monospace}

/* Top bar */
.jb-topbar{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;justify-content:space-between;
  padding-bottom:18px;border-bottom:0.5px solid var(--line)}
.jb-count-block{min-width:0}
.jb-count{font-size:15px;letter-spacing:0.01em;color:var(--t1)}
.jb-count-n{color:var(--acc);font-size:17px}
.jb-refresh{margin-top:6px;font-size:11px;line-height:1.5;color:var(--t3);letter-spacing:0.01em;max-width:520px;
  font-variant-numeric:tabular-nums}
.jb-search{display:flex;align-items:center;gap:8px;flex:1 1 220px;max-width:340px;
  border:0.5px solid var(--line);border-radius:9px;padding:9px 12px;color:var(--t3);
  transition:border-color .18s var(--e-out)}
.jb-search:focus-within{border-color:rgba(200,240,64,0.5);color:var(--t2)}
.jb-search input{flex:1;min-width:0;background:transparent;border:none;outline:none;color:var(--t1);
  font-family:"DM Sans",sans-serif;font-size:13.5px}
.jb-search input::placeholder{color:var(--t3)}

/* Filters */
.jb-filters{margin-top:16px}
.jb-filters-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.jb-filters-toggle{display:inline-flex;align-items:center;gap:8px;background:transparent;border:none;
  color:var(--t2);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;padding:4px 0;
  transition:color .18s var(--e-out)}
.jb-filters-toggle:hover{color:var(--t1)}
.jb-filters-dot{width:6px;height:6px;border-radius:50%;background:var(--acc);display:inline-block}
.jb-chev{display:inline-block;font-size:9px;color:var(--t3);transition:transform .2s var(--e-out)}
.jb-chev-open{transform:rotate(90deg);color:var(--acc)}
.jb-live{font-size:11px;color:var(--t2);display:inline-flex;align-items:center;gap:10px}
.jb-live-n{color:var(--acc)}
.jb-clear{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:10px;
  letter-spacing:0.06em;text-transform:uppercase;padding:4px 9px;border-radius:14px;cursor:pointer;
  transition:border-color .18s var(--e-out),color .18s var(--e-out),transform .12s var(--e-out)}
.jb-clear:hover{border-color:var(--clay);color:var(--clay)}
.jb-clear:active{transform:scale(0.96)}
.jb-filters-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s var(--e-drawer)}
.jb-filters-body.jb-open{grid-template-rows:1fr}
.jb-filters-inner{overflow:hidden;min-height:0;display:flex;flex-direction:column;gap:14px;padding-top:16px}
.jb-fgroup{display:flex;flex-direction:column;gap:8px}
.jb-fgroup-label{font-size:9.5px;letter-spacing:0.12em;text-transform:uppercase;color:var(--t3)}
.jb-fgroup-chips{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.jb-chip{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:11px;
  padding:6px 11px;border-radius:20px;cursor:pointer;letter-spacing:0.01em;
  transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
.jb-chip:hover{border-color:rgba(200,240,64,0.5);color:var(--t1)}
.jb-chip:active{transform:scale(0.96)}
.jb-chip-on{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}
.jb-mini-clear{background:transparent;border:none;color:var(--t3);font-size:10px;cursor:pointer;
  text-decoration:underline;text-underline-offset:2px}
.jb-mini-clear:hover{color:var(--t2)}

/* Controls row */
.jb-controls-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;
  margin-top:20px;padding-top:16px;border-top:0.5px solid var(--line)}
.jb-sort{display:inline-flex;align-items:center;gap:8px}
.jb-sort-label{font-size:9.5px;letter-spacing:0.12em;text-transform:uppercase;color:var(--t3)}
.jb-seg{background:transparent;border:0.5px solid var(--line);color:var(--t2);font-size:11px;padding:6px 12px;
  border-radius:7px;cursor:pointer;transition:border-color .18s var(--e-out),color .18s var(--e-out),background .18s var(--e-out),transform .12s var(--e-out)}
.jb-seg:hover{border-color:rgba(200,240,64,0.5);color:var(--t1)}
.jb-seg:active{transform:scale(0.97)}
.jb-seg-on{background:rgba(200,240,64,0.10);border-color:var(--acc);color:var(--acc)}
.jb-legend{display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:9.5px;color:var(--t3);letter-spacing:0.02em}
.jb-legend-head{color:var(--acc);text-transform:uppercase;letter-spacing:0.1em}

/* States */
.jb-state{margin-top:34px;padding:44px 22px;text-align:center;border:0.5px dashed var(--line);border-radius:14px}
.jb-state-title{font-size:16px;color:var(--t1);font-style:italic;margin-bottom:6px;font-family:"DM Sans",sans-serif}
.jb-state-body{font-size:13px;color:var(--t2)}
.jb-state-clear{margin-top:16px;background:rgba(200,240,64,0.08);border:0.5px solid var(--acc);color:var(--acc);
  font-size:11px;padding:8px 14px;border-radius:7px;cursor:pointer;
  transition:background .18s var(--e-out),transform .16s var(--e-out)}
.jb-state-clear:hover{background:rgba(200,240,64,0.16)}
.jb-state-clear:active{transform:scale(0.97)}

/* List + cards */
.jb-list{list-style:none;margin:22px 0 0;padding:0;display:flex;flex-direction:column;gap:12px}
.jb-card{border:0.5px solid var(--line);border-radius:13px;padding:18px 18px 16px;
  transition:border-color .2s var(--e-out),background .2s var(--e-out)}
.jb-card:hover{border-color:rgba(200,240,64,0.28);background:rgba(200,240,64,0.02)}
.jb-card-top{display:flex;gap:14px;align-items:flex-start;justify-content:space-between}
.jb-card-headings{min-width:0}
.jb-card-title{display:inline-block;font-size:16px;font-weight:600;line-height:1.35;color:var(--t1);
  text-decoration:none;letter-spacing:-0.005em;transition:color .16s var(--e-out)}
.jb-card-title:hover{color:var(--acc)}
.jb-card-meta{margin-top:5px;display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:12.5px;color:var(--t2)}
.jb-company{color:var(--t1)}
.jb-dot-sep{color:var(--t3)}
.jb-loc{color:var(--t2)}
.jb-locpill{font-size:9px;letter-spacing:0.08em;text-transform:uppercase;padding:2px 7px;border-radius:12px;
  border:0.5px solid var(--line);color:var(--t3)}
.jb-loc-remote{color:var(--acc);border-color:rgba(200,240,64,0.4)}
.jb-loc-hybrid{color:var(--clay);border-color:rgba(206,144,121,0.4)}
.jb-depth{flex:0 0 auto;font-size:10px;letter-spacing:0.04em;padding:5px 10px;border-radius:7px;
  border:0.5px solid;white-space:nowrap;font-weight:500}
.jb-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.jb-tag{font-size:9.5px;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;border-radius:5px;
  border:0.5px solid var(--line);color:var(--t3)}
.jb-tag-arch{color:var(--t2);border-color:rgba(255,255,255,0.16)}
.jb-tag-comp{color:var(--acc);border-color:rgba(200,240,64,0.3)}
.jb-tag-date{border-style:dashed}
.jb-summary{margin:13px 0 0;font-size:13.5px;line-height:1.55;color:var(--t2);font-family:"DM Sans",sans-serif}
.jb-caps{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.jb-cap{font-size:10.5px;padding:3px 9px;border-radius:14px;background:rgba(255,255,255,0.04);
  border:0.5px solid var(--line);color:var(--t2)}
.jb-card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;flex-wrap:wrap}
.jb-why{display:inline-flex;align-items:center;gap:7px;background:transparent;border:none;color:var(--t2);
  font-size:11px;letter-spacing:0.02em;cursor:pointer;padding:2px 0;transition:color .16s var(--e-out)}
.jb-why:hover{color:var(--acc)}
.jb-view{font-size:11px;letter-spacing:0.03em;color:var(--acc);text-decoration:none;
  border:0.5px solid rgba(200,240,64,0.35);padding:7px 12px;border-radius:7px;
  transition:background .18s var(--e-out),transform .14s var(--e-out)}
.jb-view:hover{background:rgba(200,240,64,0.1)}
.jb-view:active{transform:scale(0.97)}
.jb-evidence{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s var(--e-drawer)}
.jb-evidence-open{grid-template-rows:1fr}
.jb-evidence-inner{overflow:hidden;min-height:0}
.jb-evidence-list{margin:14px 0 2px;padding-left:18px;display:flex;flex-direction:column;gap:7px}
.jb-evidence-list li{font-size:12.5px;line-height:1.5;color:var(--t2);font-family:"DM Sans",sans-serif}
.jb-evidence-list li::marker{color:var(--acc)}

@media(max-width:520px){
  .jb-card-top{flex-direction:column-reverse;align-items:flex-start;gap:10px}
  .jb-depth{align-self:flex-start}
  .jb-search{max-width:none}
}
@media(prefers-reduced-motion:reduce){
  .jb *{transition-duration:0.01ms!important;animation-duration:0.01ms!important}
}
`
