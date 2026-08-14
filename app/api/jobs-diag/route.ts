import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// TEMPORARY diagnostic for wiring the job board's Supabase source. Returns only
// safe facts (booleans, host ref, error text — never keys). Guarded by a token.
// Delete after diagnosing.
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('k') !== 'diag-2026') {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const jobsUrl = process.env.JOBS_SUPABASE_URL
  const jobsKey = process.env.JOBS_SUPABASE_SERVICE_KEY
  const effUrl = jobsUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
  const effKey = jobsKey || process.env.SUPABASE_SERVICE_ROLE_KEY
  const host = (() => {
    try {
      return new URL(effUrl!).host
    } catch {
      return 'INVALID_OR_MISSING_URL'
    }
  })()

  let probe = 'not run'
  try {
    if (!effUrl || !effKey) {
      probe = 'no url/key available'
    } else {
      const sb = createClient(effUrl, effKey, { auth: { persistSession: false } })
      const { count, error } = await sb.from('ai_pm_jobs').select('*', { count: 'exact', head: true })
      probe = error ? `ERROR: ${error.message}` : `OK: ${count} rows`
    }
  } catch (e) {
    probe = `THROW: ${e instanceof Error ? e.message : 'unknown'}`
  }

  return NextResponse.json({
    JOBS_SUPABASE_URL_set: !!jobsUrl,
    JOBS_SUPABASE_SERVICE_KEY_set: !!jobsKey,
    connectingToHost: host,
    keyLength: effKey ? effKey.length : 0,
    probe,
  })
}
