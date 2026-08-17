import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSignalsAdmin } from '@/lib/signals/admin'

export const dynamic = 'force-dynamic'

// Approve or reject a single Signal draft. Admin-only (same allowlist as the
// review surface). Does not publish — flips status + records the reviewer, which
// is the signal the (future) publish step keys off.
export async function POST(req: Request) {
  const { ok: admin, email } = await isSignalsAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, action } = (body ?? {}) as { id?: unknown; action?: unknown }
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Missing draft id' }, { status: 400 })
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const status = action === 'approve' ? 'approved' : 'rejected'
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('signal_drafts')
    .update({ status, reviewed_at: new Date().toISOString(), reviewer: email })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status })
}
