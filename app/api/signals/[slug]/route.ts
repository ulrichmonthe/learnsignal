import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 300

const SLUG_RE = /^[a-z0-9-]+$/

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('signals')
    .select(`
      id, slug, name, core_question, why_it_matters, signal_type,
      signal_options(id, label, weight, display_order),
      signal_results(id, min_score, max_score, verdict, reasoning),
      evidence(
        id, evidence_type, content, speaker, confidence, display_order,
        sources(title, url, source_type, author, publication)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
  }

  const payload = {
    signal: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      coreQuestion: data.core_question,
      whyItMatters: data.why_it_matters,
      signalType: data.signal_type,
    },
    options: [...data.signal_options].sort((a, b) => a.display_order - b.display_order),
    results: [...data.signal_results].sort((a, b) => a.min_score - b.min_score),
    evidence: [...data.evidence]
      .sort((a, b) => a.display_order - b.display_order)
      .map(e => ({
        type: e.evidence_type,
        content: e.content,
        speaker: e.speaker,
        confidence: e.confidence,
        source: e.sources ?? null,
      })),
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
  })
}
