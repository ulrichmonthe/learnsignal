import { createClient } from '@/lib/supabase/server'
import { ScenarioContainer } from '@/components/scenario/scenario-container'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ScenarioPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!scenario) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: completion } = await supabase
    .from('scenario_completions')
    .select('*')
    .eq('user_id', user!.id)
    .eq('scenario_id', scenario.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <ScenarioContainer scenario={scenario} existingCompletion={completion} />
    </div>
  )
}
