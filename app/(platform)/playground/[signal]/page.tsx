import { createServiceClient } from '@/lib/supabase/server'
import { SignalChecklist } from '@/components/playground/signal-checklist'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ signal: string }>
}

export default async function SignalPage({ params }: Props) {
  const { signal: slug } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('signals')
    .select(`
      id, slug, name, core_question, why_it_matters, signal_type,
      signal_options(id, label, weight, display_order),
      signal_results(id, min_score, max_score, verdict, reasoning),
      evidence(
        id, evidence_type, content, speaker, confidence,
        sources(title, url, source_type, author, publication)
      )
    `)
    .eq('slug', slug)
    .single()

  if (!data) notFound()

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <SignalChecklist signal={data} />
    </div>
  )
}
