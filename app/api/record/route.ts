import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Publish/unpublish the Decision Record public profile (learnsignal.ai/u/<handle>).

const HANDLE = /^[a-z0-9][a-z0-9-]{2,23}$/
const RESERVED = new Set(['admin', 'api', 'jobs', 'signals', 'drafts', 'dashboard', 'prep', 'learnsignal'])

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const handle = String((body as { handle?: unknown } | null)?.handle ?? '')
    .trim()
    .toLowerCase()
  if (!HANDLE.test(handle) || RESERVED.has(handle)) {
    return NextResponse.json(
      { error: 'Handle must be 3–24 chars: lowercase letters, digits, hyphens' },
      { status: 400 },
    )
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('public_profiles')
    .upsert({ user_id: userId, handle, is_public: true }, { onConflict: 'user_id' })
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That handle is taken' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, handle })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('public_profiles')
    .update({ is_public: false })
    .eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
