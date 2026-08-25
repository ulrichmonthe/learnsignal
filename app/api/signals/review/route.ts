import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSignalsAdmin } from '@/lib/signals/admin'
import { uniqueSlug } from '@/lib/signals/slug'

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

  const patch: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewer: email,
  }

  // Approving IS publishing. Assign a URL on the first approval only — a
  // published link must never move, so an existing slug is left alone even if
  // the draft is re-approved or its title later changes.
  if (action === 'approve') {
    const { data: draft } = await supabase
      .from('signal_drafts')
      .select('slug, title')
      .eq('id', id)
      .maybeSingle()

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (!draft.slug) {
      const { data: existing } = await supabase
        .from('signal_drafts')
        .select('slug')
        .not('slug', 'is', null)
      const taken = (existing ?? [])
        .map((r: { slug: string | null }) => r.slug)
        .filter((s): s is string => typeof s === 'string')
      patch.slug = uniqueSlug(String(draft.title ?? ''), taken)
    }
  }

  const { error } = await supabase.from('signal_drafts').update(patch).eq('id', id)

  if (error) {
    // The unique index is the real arbiter: if two approvals raced for the same
    // slug, report it rather than silently leaving the issue unpublished.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'That URL was just taken — try approving again.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    status,
    slug: typeof patch.slug === 'string' ? patch.slug : undefined,
  })
}
