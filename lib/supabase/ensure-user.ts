import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// Clerk owns identity. The `users` table is a local mirror that exists so
// user-scoped tables (skill_scores, vibe_check_sessions, …) can foreign-key to
// it. Nothing reads it — but every user-scoped write needs the row to exist,
// or the FK rejects the write.
//
// Email is best-effort: a pre-Clerk row may already hold this address (the
// column is UNIQUE), and losing that race must not fail the caller's write.
// We keep the id-only row instead — the address is not load-bearing.

export async function ensureUser(
  supabase: SupabaseClient,
  userId: string,
  email?: string,
): Promise<void> {
  if (email) {
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, email }, { onConflict: 'id' })
    if (!error) return
    // 23505 = unique_violation: the address belongs to a legacy row. Fall
    // through and register the id without it.
    if (error.code !== '23505') {
      throw new Error(`Could not register user: ${error.message}`)
    }
  }

  const { error } = await supabase
    .from('users')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
  if (error) {
    throw new Error(`Could not register user: ${error.message}`)
  }
}
