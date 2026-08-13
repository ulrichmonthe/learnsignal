import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The AI PM Job Board reads the `ai_pm_jobs` table that the n8n workflow
// publishes to. That table may live in the platform's own Supabase project OR
// in a separate one — so the source is configurable:
//   JOBS_SUPABASE_URL / JOBS_SUPABASE_SERVICE_KEY  → a dedicated jobs project
//   (falls back to the platform's Supabase when those are unset).
// Same project → zero config. Different project → set the two JOBS_* env vars.

export function jobsClient(): SupabaseClient | null {
  const url = process.env.JOBS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.JOBS_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
