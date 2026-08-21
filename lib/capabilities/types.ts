// Client-safe types for the job-gap loop. The server computes readiness
// (lib/capabilities/readiness.ts) and hands these plain shapes to client
// components — no capability map or progress data crosses the wire.

export type CapState = 'met' | 'near' | 'none' | 'claimed'

export interface CapReadiness {
  cap: string // taxonomy key, e.g. "cost_modelling"
  label: string // display form, e.g. "cost modelling"
  state: CapState
  level: number // completed mapped items
  need: number // demanded level for this role (designed rule, not from the JD)
}

export interface JobReadiness {
  gaps: number // required capabilities below demand
  ready: boolean
  caps: CapReadiness[]
}
