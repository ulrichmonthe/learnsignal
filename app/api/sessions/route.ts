import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const { data, error } = await supabase
    .from('playground_sessions')
    .insert({ user_id: user.id, scenario_context: body.scenarioContext ?? {} })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: data.id }, { status: 201 })
}
