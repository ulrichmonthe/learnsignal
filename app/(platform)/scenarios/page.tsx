import { createClient } from '@/lib/supabase/server'

export default async function ScenariosPage() {
  const supabase = await createClient()
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, slug, title, difficulty, estimated_minutes, skill_dimensions')
    .eq('published', true)
    .order('created_at')

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-2">Learning modules</p>
      <h1 className="font-display text-3xl font-black text-text mb-10">Scenarios</h1>

      <div className="space-y-3">
        {(scenarios ?? []).map((s) => (
          <a
            key={s.id}
            href={`/scenarios/${s.slug}`}
            className="flex items-start justify-between border border-border p-5 hover:border-border2 transition-colors group"
          >
            <div>
              <p className="text-text text-sm font-medium group-hover:text-accent transition-colors mb-1">
                {s.title}
              </p>
              <p className="text-text3 text-xs font-mono">
                {s.skill_dimensions?.join(' · ')} · {s.estimated_minutes} min
              </p>
            </div>
            <div className="flex gap-1 shrink-0 ml-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 ${i < (s.difficulty ?? 1) ? 'bg-accent' : 'bg-surface2'}`}
                />
              ))}
            </div>
          </a>
        ))}

        {(!scenarios || scenarios.length === 0) && (
          <p className="text-text3 text-sm font-mono">No published scenarios yet.</p>
        )}
      </div>
    </div>
  )
}
