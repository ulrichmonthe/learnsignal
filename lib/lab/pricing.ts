import type { PricingTable } from './types'

// Default modelled pricing (spec Appendix C of the course): frontier $3/$15,
// cheap $0.80/$4 per 1e6 tokens; mid interpolated. In production this comes from
// a versioned Supabase table with the effective date shown next to any figure.
export const DEFAULT_PRICING: PricingTable = {
  effectiveDate: '2026-08',
  tiers: {
    frontier: { in: 3, out: 15 },
    mid: { in: 1, out: 5 },
    cheap: { in: 0.8, out: 4 },
  },
  cacheReadMultiplier: 0.1, // cached input reads at ~10% of normal input price
}
