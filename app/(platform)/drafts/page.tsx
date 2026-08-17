import { isSignalsAdmin } from '@/lib/signals/admin'
import { getSignalDrafts } from '@/lib/signals/drafts'
import { DraftReview } from '@/components/signals/draft-review'

// Always fresh — new drafts land here on the agent's weekly run.
export const dynamic = 'force-dynamic'

// Internal review queue for the Signals Writer agent. Gated to the admin
// allowlist (SIGNALS_ADMIN_EMAILS). Lives under the auth-protected (platform)
// group, so Clerk requires a signed-in user before this even renders.
export default async function DraftsPage() {
  const { ok: admin, email } = await isSignalsAdmin()

  if (!admin) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16">
        <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-2">Signals · Review</p>
        <h1 className="font-display text-2xl font-black text-text mb-3">Not authorized</h1>
        <p className="text-text2 text-sm leading-relaxed">
          This is the internal review queue for Signal drafts.
          {email ? ` You’re signed in as ${email}.` : ''} Ask an admin to add you to
          <span className="font-mono text-xs text-text3"> SIGNALS_ADMIN_EMAILS</span>.
        </p>
      </div>
    )
  }

  const { drafts, ok, error } = await getSignalDrafts()
  return <DraftReview drafts={drafts} ok={ok} error={error} />
}
