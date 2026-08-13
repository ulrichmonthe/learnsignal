import 'server-only'
import { jobsClient } from './client'

// Row shape written by the n8n "Publish To Supabase" node.
export interface Job {
  jobHash: string
  company: string
  ats: string
  title: string
  location: string
  url: string
  postedAt: string | null
  archetype: string
  seniority: string
  aiDepth: number
  aiDepthEvidence: string[]
  capabilitiesRequired: string[]
  compDisclosed: boolean
  locationPolicy: string
  oneLineSummary: string
  classifiedAt: string | null
}

export interface JobsResult {
  jobs: Job[]
  ok: boolean
  error: string | null
}

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

interface RawJob {
  job_hash?: string
  company?: string
  ats?: string
  title?: string
  location?: string
  url?: string
  posted_at?: string | null
  archetype?: string
  seniority?: string
  ai_depth?: number | string
  ai_depth_evidence?: unknown
  capabilities_required?: unknown
  comp_disclosed?: boolean
  location_policy?: string
  one_line_summary?: string
  classified_at?: string | null
}

function normalize(r: RawJob): Job {
  return {
    jobHash: r.job_hash ?? '',
    company: r.company ?? '',
    ats: r.ats ?? '',
    title: r.title ?? '',
    location: r.location ?? '',
    url: r.url ?? '',
    postedAt: r.posted_at ?? null,
    archetype: r.archetype ?? 'unknown',
    seniority: r.seniority ?? 'unknown',
    aiDepth: typeof r.ai_depth === 'number' ? r.ai_depth : Number(r.ai_depth ?? 0) || 0,
    aiDepthEvidence: parseJsonArray(r.ai_depth_evidence),
    capabilitiesRequired: parseJsonArray(r.capabilities_required),
    compDisclosed: !!r.comp_disclosed,
    locationPolicy: r.location_policy ?? 'unknown',
    oneLineSummary: r.one_line_summary ?? '',
    classifiedAt: r.classified_at ?? null,
  }
}

/**
 * All qualified roles the workflow has published, newest first. Read-only, and
 * resilient: a missing table or unreachable DB returns an empty, flagged result
 * rather than throwing — the board renders a graceful empty state.
 */
export async function getJobs(): Promise<JobsResult> {
  const sb = jobsClient()
  if (!sb) return { jobs: [], ok: false, error: 'Jobs data source is not configured.' }

  try {
    const { data, error } = await sb
      .from('ai_pm_jobs')
      .select(
        'job_hash, company, ats, title, location, url, posted_at, archetype, seniority, ai_depth, ai_depth_evidence, capabilities_required, comp_disclosed, location_policy, one_line_summary, classified_at',
      )
      .order('classified_at', { ascending: false })
      .limit(1000)

    if (error) return { jobs: [], ok: false, error: error.message }
    return { jobs: (data ?? []).map((r) => normalize(r as RawJob)), ok: true, error: null }
  } catch (e) {
    return { jobs: [], ok: false, error: e instanceof Error ? e.message : 'Failed to load jobs.' }
  }
}
