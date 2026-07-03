import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = await createServiceClient()
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The session must belong to the caller — the id alone grants nothing.
  const { data: session } = await supabase
    .from('playground_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session || session.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)

  if (!body || typeof body.signalId !== 'string') {
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
