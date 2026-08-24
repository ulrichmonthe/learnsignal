import { CAPABILITY_MAP } from './map'

// Pure taxonomy helpers — deliberately NOT server-only so they can be unit
// tested and reused on either side of the boundary.

/**
 * Coerces a scenario's `capabilities` jsonb into a clean list of taxonomy keys.
 * The taxonomy is closed: anything not in CAPABILITY_MAP is dropped, so a typo
 * in the database can never reach the UI or the readiness maths.
 */
export function normalizeCapabilities(v: unknown): string[] {
  const raw = Array.isArray(v)
    ? v
    : typeof v === 'string'
      ? (() => {
          try {
            const p = JSON.parse(v)
            return Array.isArray(p) ? p : []
          } catch {
            return []
          }
        })()
      : []

  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    if (!CAPABILITY_MAP[item]) continue
    if (seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}
