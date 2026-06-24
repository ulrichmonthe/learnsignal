import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (!body.signalId) {
    return NextResponse.json({ error: 'signalId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('playground_responses')
    .upsert({
      session_id: sessionId,
      signal_id: body.signalId,
      selected_options: body.selectedOptions ?? null,
      reflection_text: body.reflectionText ?? null,
      saved_without_deciding: body.savedWithoutDeciding ?? false,
      disagreed_with_framing: body.disagreedWithFraming ?? false,
    }, { onConflict: 'session_id,signal_id' })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
