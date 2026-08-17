import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

// Row shape written by the Signals Writer agent into `signal_drafts`.
export interface SignalSource {
  title: string
  url: string
}

export interface SignalCriterion {
  name: string
  pass: boolean
  note?: string
}

export interface SignalGrade {
  score: number
  max: number
  verdict: string
  criteria: SignalCriterion[]
}

export type DraftStatus = 'pending' | 'approved' | 'rejected'

export interface SignalDraft {
  id: string
  createdAt: string
  weekOf: string | null
  title: string
  dek: string | null
  bodyMd: string
  decisionFraming: string | null
  category: string | null
  sources: SignalSource[]
  selfGrade: SignalGrade | null
  status: DraftStatus
  reviewedAt: string | null
  reviewer: string | null
}

export interface DraftsResult {
  drafts: SignalDraft[]
  ok: boolean
  error: string | null
}

// jsonb columns come back parsed from supabase-js, but the agent may write them
// as JSON strings depending on how the row is inserted — accept both.
function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }
  return v as T
}

function parseSources(v: unknown): SignalSource[] {
  const arr = parseJson<unknown[]>(v, [])
  if (!Array.isArray(arr)) return []
  return arr
    .map((s) => {
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>
        const url = typeof o.url === 'string' ? o.url : ''
        const title = typeof o.title === 'string' ? o.title : url
        if (url) return { title, url }
      }
      return null
    })
    .filter((s): s is SignalSource => s !== null)
}

interface RawDraft {
  id: string
  created_at: string
  week_of: string | null
  title: string
  dek: string | null
  body_md: string
  decision_framing: string | null
  category: string | null
  sources: unknown
  self_grade: unknown
  status: string
  reviewed_at: string | null
  reviewer: string | null
}

function normalizeStatus(s: string): DraftStatus {
  return s === 'approved' || s === 'rejected' ? s : 'pending'
}

/**
 * Reads every Signal draft, newest first. Returns a graceful result object —
 * if the table doesn't exist yet or the service key is unset, `ok` is false and
 * the review surface shows an empty state rather than throwing.
 */
export async function getSignalDrafts(): Promise<DraftsResult> {
  let supabase
  try {
    supabase = await createServiceClient()
  } catch (e) {
    return { drafts: [], ok: false, error: e instanceof Error ? e.message : 'no client' }
  }

  const { data, error } = await supabase
    .from('signal_drafts')
    .select(
      'id, created_at, week_of, title, dek, body_md, decision_framing, category, sources, self_grade, status, reviewed_at, reviewer',
    )
    .order('created_at', { ascending: false })

  if (error) {
    return { drafts: [], ok: false, error: error.message }
  }

  const drafts: SignalDraft[] = ((data ?? []) as RawDraft[]).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    weekOf: r.week_of,
    title: r.title,
    dek: r.dek,
    bodyMd: r.body_md ?? '',
    decisionFraming: r.decision_framing,
    category: r.category,
    sources: parseSources(r.sources),
    selfGrade: parseJson<SignalGrade | null>(r.self_grade, null),
    status: normalizeStatus(r.status),
    reviewedAt: r.reviewed_at,
    reviewer: r.reviewer,
  }))

  return { drafts, ok: true, error: null }
}
