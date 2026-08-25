import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import type { SignalSource } from './drafts'

// Public read side of the Weekly Signal. Only `status = 'approved'` rows are
// ever returned, and the review-only fields (self_grade, reviewer, timestamps)
// are never selected — they must not reach a public surface.

export interface PublishedSignal {
  slug: string
  title: string
  dek: string | null
  bodyMd: string
  decisionFraming: string | null
  category: string | null
  sources: SignalSource[]
  weekOf: string | null
  publishedAt: string
}

function parseSources(v: unknown): SignalSource[] {
  const raw =
    typeof v === 'string'
      ? (() => {
          try {
            return JSON.parse(v)
          } catch {
            return []
          }
        })()
      : v
  if (!Array.isArray(raw)) return []
  return raw
    .map((s) => {
      if (!s || typeof s !== 'object') return null
      const o = s as Record<string, unknown>
      const url = typeof o.url === 'string' ? o.url : ''
      // Only http(s) — a published page must not emit javascript: links.
      if (!/^https?:\/\//i.test(url)) return null
      return { title: typeof o.title === 'string' && o.title ? o.title : url, url }
    })
    .filter((s): s is SignalSource => s !== null)
}

interface RawRow {
  slug: string | null
  title: string
  dek: string | null
  body_md: string
  decision_framing: string | null
  category: string | null
  sources: unknown
  week_of: string | null
  reviewed_at: string | null
  created_at: string
}

function toPublished(r: RawRow): PublishedSignal | null {
  if (!r.slug) return null // approved but never assigned a URL
  return {
    slug: r.slug,
    title: r.title,
    dek: r.dek,
    bodyMd: r.body_md ?? '',
    decisionFraming: r.decision_framing,
    category: r.category,
    sources: parseSources(r.sources),
    weekOf: r.week_of,
    publishedAt: r.reviewed_at ?? r.created_at,
  }
}

const COLUMNS =
  'slug, title, dek, body_md, decision_framing, category, sources, week_of, reviewed_at, created_at'

/** Published issues, newest first. Returns [] on any failure — the page shows
 *  an empty state rather than an error. */
export async function getPublishedSignals(): Promise<PublishedSignal[]> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('signal_drafts')
      .select(COLUMNS)
      .eq('status', 'approved')
      .not('slug', 'is', null)
      .order('reviewed_at', { ascending: false, nullsFirst: false })
    if (error || !data) return []
    return (data as RawRow[]).map(toPublished).filter((s): s is PublishedSignal => s !== null)
  } catch {
    return []
  }
}

/** One published issue, or null if it isn't published. */
export async function getPublishedSignal(slug: string): Promise<PublishedSignal | null> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('signal_drafts')
      .select(COLUMNS)
      .eq('status', 'approved')
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) return null
    return toPublished(data as RawRow)
  } catch {
    return null
  }
}
