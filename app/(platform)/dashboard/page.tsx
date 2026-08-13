import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { SkillMapRadar } from '@/components/dashboard/skill-map-radar'

const COURSE_META: Record<string, { title: string; href: string; dimension: string }> = {
  rag: {
    title: 'RAG: Building Knowledge-Grounded AI Products',
    href: '/playground/learn/rag',
    dimension: 'Technical Foundation',
  },
  'prompt-context-engineering': {
    title: 'Prompt & Context Engineering',
    href: '/playground/learn/prompt-context-engineering',
    dimension: 'Product Craft',
  },
  'evals-foundations': {
    title: 'Evals: From Vibe Checks to Production Quality',
    href: '/playground/learn/evals-foundations',
    dimension: 'Product Taste',
  },
  'harness-engineering': {
    title: 'Harness Engineering',
    href: '/playground/learn/harness-engineering',
    dimension: 'Execution',
  },
  'agent-orchestration': {
    title: 'Agent Orchestration',
    href: '/playground/learn/agent-orchestration',
    dimension: 'Strategic Thinking',
  },
}

const LAB_META: Record<string, { title: string; href: string; dimension: string }> = {
  raglab: { title: 'RAG Lab', href: '/playground/rag-lab', dimension: 'Technical Foundation' },
  pcelab: { title: 'PCE Lab', href: '/playground/pce-lab', dimension: 'Product Craft' },
  evallab: { title: 'Eval Lab', href: '/playground/eval-lab/concept', dimension: 'Product Taste' },
}

interface ContinueCard {
  kind: string
  title: string
  href: string
  detail: string
}

function buildContinueCards(
  rows: { lab: string; data: Record<string, unknown> }[],
): ContinueCard[] {
  const cards: ContinueCard[] = []
  for (const row of rows) {
    if (row.lab.startsWith('course:')) {
      const meta = COURSE_META[row.lab.slice('course:'.length)]
      if (!meta) continue
      const done = Array.isArray(row.data?.completedSlugs) ? row.data.completedSlugs.length : 0
      const total = typeof row.data?.total === 'number' ? row.data.total : null
      if (total && done >= total) continue // finished — nothing to continue
      cards.push({
        kind: 'Course',
        title: meta.title,
        href: meta.href,
        detail: `${meta.dimension} · ${done}${total ? ` of ${total}` : ''} lessons done`,
      })
    } else {
      const meta = LAB_META[row.lab]
      if (!meta) continue
      const missions = (row.data?.missions ?? {}) as Record<string, { completed?: boolean }>
      const done = Object.values(missions).filter((m) => m?.completed).length
      cards.push({
        kind: 'Lab',
        title: meta.title,
        href: meta.href,
        detail: `${meta.dimension}${done ? ` · ${done} missions cleared` : ' · in progress'}`,
      })
    }
    if (cards.length === 2) break
  }
  return cards
}

export default async function DashboardPage() {
  const { userId } = await auth()
  const supabase = await createServiceClient()

  const [{ data: scores }, { data: dimensions }, { data: progressRows }] = await Promise.all([
    supabase
      .from('skill_scores')
      .select('dimension, score, decisions_count')
      .eq('user_id', userId ?? ''),
    supabase
      .from('skill_dimensions')
      .select('id, name, description, display_order')
      .order('display_order'),
    supabase
      .from('lab_progress')
      .select('lab, data')
      .eq('user_id', userId ?? '')
      .order('updated_at', { ascending: false }),
  ])

  const scoreByDim = new Map((scores ?? []).map((s) => [s.dimension, s]))
  const isFirstRun =
    (progressRows ?? []).length === 0 && !(scores ?? []).some((s) => s.score > 0)
  const continueCards = buildContinueCards(progressRows ?? [])

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-2">Your progress</p>
      <h1 className="font-display text-3xl font-black text-text mb-10">Skill Map</h1>

      {isFirstRun && (
        <div
          className="mb-10 rounded-lg p-6"
          style={{
            border: '0.5px solid rgba(200,240,64,0.3)',
            background: 'rgba(200,240,64,0.04)',
          }}
        >
          <p className="font-mono text-xs text-accent tracking-wide uppercase mb-2">Start here</p>
          <h2 className="font-display text-xl font-black text-text mb-2">
            Your map fills in as you make decisions
          </h2>
          <p className="text-text2 text-sm leading-relaxed mb-5 max-w-2xl">
            Two ways to build judgment: read a course and commit to the exercises inside it, or
            step into a lab and make the calls yourself. Courses earn partial credit on a skill;
            clearing the matching lab completes it.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="/playground/learn"
              className="font-mono text-xs font-medium rounded px-4 py-2 transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'black', letterSpacing: '0.08em' }}
            >
              START WITH A COURSE →
            </a>
            <a
              href="/playground"
              className="font-mono text-xs font-medium rounded px-4 py-2 transition-opacity hover:opacity-70"
              style={{
                border: '0.5px solid rgba(255,255,255,0.25)',
                color: 'var(--text)',
                letterSpacing: '0.08em',
              }}
            >
              JUMP INTO A LAB
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkillMapRadar scores={scores ?? []} />

        <div className="space-y-3">
          <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-4">
            {continueCards.length > 0 ? 'Continue where you left off' : 'Ways to learn'}
          </p>
          {continueCards.length > 0 ? (
            continueCards.map((c) => (
              <a
                key={c.href}
                href={c.href}
                className="block border border-border p-4 hover:border-border2 transition-colors"
              >
                <p className="font-mono text-xs text-accent uppercase tracking-wide mb-1">{c.kind}</p>
                <p className="text-text text-sm">{c.title}</p>
                <p className="text-text3 text-xs mt-1">{c.detail}</p>
              </a>
            ))
          ) : (
            <>
              <a
                href="/playground/learn"
                className="block border border-border p-4 hover:border-border2 transition-colors"
              >
                <p className="font-mono text-xs text-accent uppercase tracking-wide mb-1">Courses</p>
                <p className="text-text text-sm">Four courses, an exercise in every lesson</p>
                <p className="text-text3 text-xs mt-1">RAG · Prompt &amp; Context · Evals · Harness</p>
              </a>
              <a
                href="/playground"
                className="block border border-border p-4 hover:border-border2 transition-colors"
              >
                <p className="font-mono text-xs text-teal uppercase tracking-wide mb-1">Labs</p>
                <p className="text-text text-sm">Hands-on missions where you make the call</p>
                <p className="text-text3 text-xs mt-1">RAG Lab · PCE Lab · Eval Lab</p>
              </a>
            </>
          )}
        </div>
      </div>

      {/* ── Skills you can acquire ─────────────────────────────────────── */}
      <div className="mt-14 pt-10" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
        <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-2">Build judgment across</p>
        <h2 className="font-display text-2xl font-black text-text mb-3">Skills you can acquire</h2>
        <p className="text-text2 text-sm mb-8 max-w-2xl leading-relaxed">
          The six dimensions every AI PM is measured on. Each scenario and playground sharpens
          one or more — your Skill Map fills in as you build judgment in each.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dimensions ?? []).map((d) => {
            const s = scoreByDim.get(d.id)
            const score = s?.score ?? 0
            const started = score > 0
            return (
              <div
                key={d.id}
                className="border border-border p-5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center justify-between mb-2 gap-3">
                  <p className="text-text text-sm font-medium">{d.name}</p>
                  <span
                    className="font-mono text-[10px] uppercase tracking-wide whitespace-nowrap"
                    style={{ color: started ? 'var(--accent)' : 'var(--text3)' }}
                  >
                    {started ? `${score}% · in progress` : 'Not started'}
                  </span>
                </div>
                <p className="text-text3 text-xs leading-relaxed">{d.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
