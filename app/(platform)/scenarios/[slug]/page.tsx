import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { ScenarioContainer } from '@/components/scenario/scenario-container'
import { notFound } from 'next/navigation'
import { capLabel } from '@/lib/capabilities/map'
import { normalizeCapabilities } from '@/lib/capabilities/taxonomy'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ScenarioPage({ params }: Props) {
  const { slug } = await params
  const { userId } = await auth()
  const supabase = await createServiceClient()

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!scenario) notFound()

  // Select only what the client component needs. `select('*')` would serialise
  // the whole row — including the raw Clerk user_id — into the RSC payload,
  // where it is readable in page source. The TS prop type narrows at compile
  // time only; it does not strip anything at runtime.
  // maybeSingle: a first-time learner has no row, which is normal, not an error.
  const { data: completion } = await supabase
    .from('scenario_completions')
    .select('current_act, decisions')
    .eq('user_id', userId ?? '')
    .eq('scenario_id', scenario.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const capabilities = normalizeCapabilities(scenario.capabilities)

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      {capabilities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="font-mono text-[10px] text-text3 uppercase tracking-wide">
            Trains
          </span>
          {capabilities.map((c) => (
            <span
              key={c}
              className="font-mono text-[10px] rounded px-2 py-1"
              style={{ color: 'var(--teal)', border: '0.5px solid rgba(48,196,176,0.35)' }}
            >
              {capLabel(c)}
            </span>
          ))}
        </div>
      )}
      <ScenarioContainer
        scenario={{
          id: scenario.id,
          title: scenario.title,
          acts: scenario.acts,
          estimated_minutes: scenario.estimated_minutes,
          version: scenario.version,
        }}
        existingCompletion={completion}
      />
    </div>
  )
}
