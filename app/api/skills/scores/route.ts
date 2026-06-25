import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('skill_scores')
    .select('dimension, score, decisions_count, last_updated')
    .eq('user_id', userId)

  return NextResponse.json(data ?? [])
}
