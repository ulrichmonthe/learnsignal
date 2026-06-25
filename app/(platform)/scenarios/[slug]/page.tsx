import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { ScenarioContainer } from '@/components/scenario/scenario-container'
import { notFound } from 'next/navigation'

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

  const { data: completion } = await supabase
    .from('scenario_completions')
    .select('*')
    .eq('user_id', userId ?? '')
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
