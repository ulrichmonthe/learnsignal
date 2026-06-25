import { createClient } from '@/lib/supabase/server'
import { SkillMapRadar } from '@/components/dashboard/skill-map-radar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: scores } = await supabase
    .from('skill_scores')
    .select('dimension, score, decisions_count')

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
    </div>
  )
}
