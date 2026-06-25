import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { SkillMapRadar } from '@/components/dashboard/skill-map-radar'

export default async function DashboardPage() {
  const { userId } = await auth()
  const supabase = await createServiceClient()

  const [{ data: scores }, { data: dimensions }] = await Promise.all([
    supabase
      .from('skill_scores')
      .select('dimension, score, decisions_count')
      .eq('user_id', userId ?? ''),
    supabase
      .from('skill_dimensions')
      .select('id, name, description, display_order')
      .order('display_order'),
  ])

  const scoreByDim = new Map((scores ?? []).map((s) => [s.dimension, s]))

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-2">Your progress</p>
      <h1 className="font-display text-3xl font-black text-text mb-10">Skill Map</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkillMapRadar scores={scores ?? []} />

        <div className="space-y-3">
          <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-4">Continue learning</p>
          <a
            href="/scenarios"
            className="block border border-border p-4 hover:border-border2 transition-colors"
          >
            <p className="font-mono text-xs text-accent uppercase tracking-wide mb-1">Scenario</p>
            <p className="text-text text-sm">Fine-tune vs RAG</p>
            <p className="text-text3 text-xs mt-1">Technical Foundation · 12 min</p>
          </a>
          <a
            href="/playground"
            className="block border border-border p-4 hover:border-border2 transition-colors"
          >
            <p className="font-mono text-xs text-teal uppercase tracking-wide mb-1">Playground</p>
            <p className="text-text text-sm">Problem Selection & Framing</p>
            <p className="text-text3 text-xs mt-1">5 decision signals · self-paced</p>
          </a>
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
