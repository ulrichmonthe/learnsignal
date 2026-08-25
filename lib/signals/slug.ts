// Pure slug helpers for published Weekly Signal issues. Not server-only so the
// behaviour is unit-testable.
//
// Character classes use \u escapes rather than literal combining marks and
// smart quotes: those are invisible in most editors and diff tools, which makes
// them easy to corrupt during a later edit.

const MAX_LEN = 70

/** Routes under /weekly-signal that must not be shadowed by an issue slug. */
const RESERVED = new Set(['new', 'index', 'feed', 'rss', 'api', 'admin'])

/**
 * URL-safe slug from an issue title. Deliberately lossy and ASCII-only — a slug
 * is an address, not a representation of the title.
 */
export function slugify(title: string): string {
  const base = String(title ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining marks (diacritics)
    .toLowerCase()
    .replace(/[’']/g, '') // curly + straight apostrophe: "don't" → "dont"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LEN)
    .replace(/-+$/g, '') // slice may have left a trailing hyphen

  if (!base) return 'weekly-signal'
  return RESERVED.has(base) ? `${base}-signal` : base
}

/**
 * First slug not already taken. Suffixes rather than overwriting, because two
 * issues may legitimately share a title and a published URL must never move.
 */
export function uniqueSlug(title: string, taken: Iterable<string>): string {
  const base = slugify(title)
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`
    if (!used.has(candidate)) return candidate
  }
  // Pathological collision count — fall back to something certainly free.
  return `${base}-${Date.now().toString(36)}`
}
