import 'server-only'
import { currentUser } from '@clerk/nextjs/server'

// Who may review Signal drafts. Defaults to the owner; override in prod with
// SIGNALS_ADMIN_EMAILS="a@x.com,b@y.com". Approving/publishing content is a
// privileged action, so the review surface and its API both gate on this.
function adminAllowlist(): string[] {
  return (process.env.SIGNALS_ADMIN_EMAILS || 'umonthe1@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/** The signed-in user's primary email, or null. */
export async function currentUserEmail(): Promise<string | null> {
  const user = await currentUser()
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null
  )
}

export async function isSignalsAdmin(): Promise<{ ok: boolean; email: string | null }> {
  const email = await currentUserEmail()
  const ok = !!email && adminAllowlist().includes(email.toLowerCase())
  return { ok, email }
}
