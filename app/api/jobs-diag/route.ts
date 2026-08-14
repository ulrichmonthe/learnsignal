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

  let countProbe = 'not run'
  let realProbe = 'not run'
  let columns: string[] = []
  try {
    if (!effUrl || !effKey) {
      countProbe = 'no url/key available'
    } else {
      const sb = createClient(effUrl, effKey, { auth: { persistSession: false } })

      const c = await sb.from('ai_pm_jobs').select('*', { count: 'exact', head: true })
      countProbe = c.error ? `ERROR: ${c.error.message}` : `OK: ${c.count} rows`

      // the exact select the board uses
      const r = await sb
        .from('ai_pm_jobs')
        .select('job_hash, company, ats, title, location, url, posted_at, archetype, seniority, ai_depth, ai_depth_evidence, capabilities_required, comp_disclosed, location_policy, one_line_summary, classified_at')
        .order('classified_at', { ascending: false })
        .limit(3)
      realProbe = r.error ? `ERROR: ${r.error.message}` : `OK: ${r.data?.length ?? 0} rows`

      // actual columns present (from one raw row, if any)
      const s = await sb.from('ai_pm_jobs').select('*').limit(1)
      if (!s.error && s.data && s.data[0]) columns = Object.keys(s.data[0])
    }
  } catch (e) {
    realProbe = `THROW: ${e instanceof Error ? e.message : 'unknown'}`
  }

  return NextResponse.json({
    JOBS_SUPABASE_URL_set: !!jobsUrl,
    JOBS_SUPABASE_SERVICE_KEY_set: !!jobsKey,
    connectingToHost: host,
    keyLength: effKey ? effKey.length : 0,
    countProbe,
    realProbe,
    actualColumns: columns,
  })
}
