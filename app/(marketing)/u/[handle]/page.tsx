import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { SkillMapRadar } from '@/components/dashboard/skill-map-radar'
import { CAPABILITY_MAP, capLabel } from '@/lib/capabilities/map'
import { getPractice, practiceLevel } from '@/lib/capabilities/readiness'
import { getScenarioPractice } from '@/lib/capabilities/scenarios'

export const dynamic = 'force-dynamic'

// The Decision Record — an opt-in public proof-of-judgment page. Everything on
// it derives from demonstrated activity (completed lessons, cleared missions,
// timed commit-before-reveal decisions). Resume claims are deliberately absent.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  return {
    title: `@${handle} — Decision Record · LearnSignal`,
    description: `Demonstrated AI product judgment: timed decisions, verified capabilities, and practice history for @${handle} on LearnSignal.`,
  }
}

interface TrackStat {
  label: string
  done: number
  total: number
}

export default async function RecordPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params
  const supabase = await createServiceClient()

  let profile: { user_id: string; handle: string; is_public: boolean; created_at: string } | null = null
  try {
    const { data } = await supabase
      .from('public_profiles')
      .select('user_id, handle, is_public, created_at')
      .eq('handle', handle.toLowerCase())
      .maybeSingle()
    profile = data
  } catch {
    profile = null
  }
  if (!profile || !profile.is_public) notFound()

  const [{ data: scores }, practice, scenarioPractice] = await Promise.all([
    supabase
      .from('skill_scores')
      .select('dimension, score, decisions_count')
      .eq('user_id', profile.user_id),
    getPractice(supabase, profile.user_id),
    getScenarioPractice(supabase, profile.user_id),
  ])

  const decisions = (scores ?? []).reduce((n, s) => n + (s.decisions_count ?? 0), 0)
  const dimsActive = (scores ?? []).filter((s) => s.score > 0).length

  // Scenarios count here too, so a capability reads the same on the record as it
  // does on the job board. They can push level past the map's item count, so the
  // displayed denominator grows with it rather than rendering "4/3".
  const verified = Object.keys(CAPABILITY_MAP)
    .map((cap) => {
      const level = practiceLevel(cap, practice, scenarioPractice)
      return {
        cap,
        label: capLabel(cap),
        level,
        max: Math.max(CAPABILITY_MAP[cap].items.length, level),
      }
    })
    .filter((c) => c.level > 0)
    .sort((a, b) => b.level / b.max - a.level / a.max)

  const tracks: TrackStat[] = []
  const missions = (key: string, label: string, total: number) => {
    const d = practice.get(key) as { missions?: Record<string, { completed?: boolean }> } | undefined
    const done = Object.values(d?.missions ?? {}).filter((m) => m?.completed).length
    if (done > 0) tracks.push({ label, done: Math.min(done, total), total })
  }
  missions('raglab', 'RAG Lab', 13)
  missions('pcelab', 'PCE Lab', 10)
  const evalDone = (practice.get('evallab') as { completed?: boolean } | undefined)?.completed === true
  if (evalDone) tracks.push({ label: 'Eval Lab — vibe check to verdict', done: 1, total: 1 })
  const COURSES: Array<[string, string, number]> = [
    ['rag', 'RAG course', 16],
    ['prompt-context-engineering', 'Prompt & Context course', 10],
    ['evals-foundations', 'Evals course', 10],
    ['harness-engineering', 'Harness course', 10],
    ['agent-orchestration', 'Agent Orchestration course', 11],
  ]
  for (const [slug, label, fallbackTotal] of COURSES) {
    const d = practice.get(`course:${slug}`) as { completedSlugs?: string[]; total?: number } | undefined
    const done = (d?.completedSlugs ?? []).length
    if (done > 0) tracks.push({ label, done, total: d?.total && d.total > 0 ? d.total : fallbackTotal })
  }

  const since = new Date(profile.created_at)
  const sinceLabel = isNaN(since.getTime())
    ? ''
    : since.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="rec">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rec-inner">
        <header className="rec-head">
          <span className="rec-avatar">{profile.handle.charAt(0).toUpperCase()}</span>
          <div className="rec-id">
            <h1>@{profile.handle}</h1>
            <p>DECISION RECORD · EVERYTHING BELOW WAS DEMONSTRATED, NOT SELF-REPORTED</p>
          </div>
          <Link href="/" className="rec-brand">
            Learn<b>Signal</b>
          </Link>
        </header>

        <div className="rec-stats">
          <div className="rec-stat rec-stat-hi">
            <b>{decisions}</b>
            <span>timed decisions</span>
          </div>
          <div className="rec-stat">
            <b>{verified.length}</b>
            <span>verified capabilities</span>
          </div>
          <div className="rec-stat">
            <b>{dimsActive}</b>
            <span>skill dimensions active</span>
          </div>
          <div className="rec-stat">
            <b>{sinceLabel || '—'}</b>
            <span>record since</span>
          </div>
        </div>

        <div className="rec-grid">
          <div className="rec-radar">
            <SkillMapRadar scores={scores ?? []} />
            <p className="rec-radar-cap">Skill map · six dimensions</p>
          </div>
          <div className="rec-col">
            <h2 className="rec-h2">Verified capabilities</h2>
            {verified.length === 0 ? (
              <p className="rec-empty">No verified capabilities yet — the record fills in with practice.</p>
            ) : (
              <div className="rec-caps">
                {verified.map((c) => (
                  <span key={c.cap} className="rec-cap">
                    ✓ {c.label} · {c.level}/{c.max}
                  </span>
                ))}
              </div>
            )}

            <h2 className="rec-h2" style={{ marginTop: 26 }}>
              Practice history
            </h2>
            {tracks.length === 0 ? (
              <p className="rec-empty">No completed practice yet.</p>
            ) : (
              <ul className="rec-tracks">
                {tracks.map((t) => (
                  <li key={t.label}>
                    <span>{t.label}</span>
                    <b>
                      {t.done}/{t.total}
                    </b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="rec-foot">
          <p>
            <b>Why this is credible:</b> capability levels count completed lessons and lab missions;
            decision counts come from timed commit-before-reveal exercises where the call is recorded
            <i> before</i> the answer is shown. Nothing on this page can be self-reported or back-filled.
          </p>
          <p className="rec-cta">
            Build your own record — <Link href="/sign-up">start with a decision, not a video →</Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

const CSS = `
.rec{--acc:#C8F040;--teal:#30C4B0;--bg:#100f0c;--line:rgba(255,255,255,0.10);
  --t1:rgba(255,255,255,0.92);--t2:rgba(255,255,255,0.62);--t3:rgba(255,255,255,0.38);
  --e-out:cubic-bezier(0.23,1,0.32,1);
  background:var(--bg);color:var(--t1);min-height:100vh;padding:0 20px;box-sizing:border-box;
  font-family:"DM Sans",ui-sans-serif,system-ui,-apple-system,sans-serif}
.rec *{box-sizing:border-box}
.rec-inner{max-width:860px;margin:0 auto;padding:44px 0 72px}
.rec-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding-bottom:22px;
  border-bottom:0.5px solid var(--line);margin-bottom:22px}
.rec-avatar{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.05);
  border:0.5px solid var(--line);display:flex;align-items:center;justify-content:center;
  font-size:20px;font-weight:700;color:var(--acc);flex:none}
.rec-id{flex:1;min-width:200px}
.rec-id h1{margin:0;font-size:20px;font-weight:600;letter-spacing:-0.01em}
.rec-id p{margin:3px 0 0;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;
  letter-spacing:0.1em;color:var(--t3)}
.rec-brand{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12px;letter-spacing:0.06em;
  color:var(--t2);text-decoration:none;transition:color .16s var(--e-out)}
.rec-brand b{color:var(--acc);font-weight:500}
.rec-brand:hover{color:var(--t1)}
.rec-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
@media(max-width:640px){.rec-stats{grid-template-columns:repeat(2,1fr)}}
.rec-stat{border:0.5px solid var(--line);border-radius:10px;padding:13px 15px;background:rgba(255,255,255,0.015)}
.rec-stat b{display:block;font-size:22px;font-weight:700;letter-spacing:-0.01em;font-variant-numeric:tabular-nums}
.rec-stat span{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--t3)}
.rec-stat-hi b{color:var(--acc)}
.rec-grid{display:grid;grid-template-columns:300px 1fr;gap:26px;align-items:start}
@media(max-width:720px){.rec-grid{grid-template-columns:1fr}}
.rec-radar{border:0.5px solid var(--line);border-radius:12px;padding:12px;background:rgba(255,255,255,0.015);min-height:260px}
.rec-radar-cap{margin:6px 0 0;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;
  letter-spacing:0.1em;text-transform:uppercase;color:var(--t3);text-align:center}
.rec-h2{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;letter-spacing:0.14em;
  text-transform:uppercase;color:var(--t3);margin:0 0 10px;font-weight:400}
.rec-empty{font-size:13px;color:var(--t3);margin:0}
.rec-caps{display:flex;flex-wrap:wrap;gap:7px}
.rec-cap{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10.5px;color:var(--acc);
  border:0.5px solid rgba(200,240,64,0.35);border-radius:6px;padding:4px 9px}
.rec-tracks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.rec-tracks li{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--t2);
  border:0.5px solid var(--line);border-radius:8px;padding:9px 13px;background:rgba(255,255,255,0.015)}
.rec-tracks b{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;color:var(--t1);
  font-variant-numeric:tabular-nums;font-weight:500}
.rec-foot{margin-top:30px;padding-top:18px;border-top:0.5px dashed var(--line)}
.rec-foot p{font-size:12px;line-height:1.6;color:var(--t3);margin:0 0 10px;max-width:640px}
.rec-foot b{color:var(--t2);font-weight:500}
.rec-cta a{color:var(--acc);text-decoration:none}
.rec-cta a:hover{text-decoration:underline}
@media(prefers-reduced-motion:reduce){.rec *{transition-duration:0.01ms!important}}
`
