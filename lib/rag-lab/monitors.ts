// Mission 9 — monitor wiring. Seeded incident traffic + threshold evaluation.
// Two weeks of replayed Helix traffic with THREE seeded incidents. The learner
// sets the four monitor thresholds; a day alerts when any metric crosses its
// threshold. Pass = every incident alerted, with at most ONE false alarm.
// Everything is deterministic so the pass/fail boundary is fully predictable.

import type { MonitorThresholds } from './types'

export interface TrafficDay {
  day: number
  retrievalRate: number    // fraction of queries where the gold chunk was fed
  relevanceScore: number   // mean relevance of fed chunks
  faithfulness: number     // fraction of claims grounded in fed context
  costPerRun: number       // mean tokens per run
  incident: string | null  // non-null = seeded incident the monitors must catch
}

// Normal traffic: retrievalRate 0.90–0.96 (two benign dips at 0.83/0.84),
// relevance 0.76–0.86, faithfulness 0.92–0.98 (one benign 0.90), cost 960–1290.
// Incident levels sit clearly outside those bands.
export const MONITOR_TRAFFIC: TrafficDay[] = [
  { day: 1,  retrievalRate: 0.94, relevanceScore: 0.82, faithfulness: 0.97, costPerRun: 1010, incident: null },
  { day: 2,  retrievalRate: 0.92, relevanceScore: 0.80, faithfulness: 0.95, costPerRun: 980,  incident: null },
  { day: 3,  retrievalRate: 0.95, relevanceScore: 0.84, faithfulness: 0.96, costPerRun: 1040, incident: null },
  { day: 4,  retrievalRate: 0.90, relevanceScore: 0.78, faithfulness: 0.93, costPerRun: 1120, incident: null },
  { day: 5,  retrievalRate: 0.84, relevanceScore: 0.79, faithfulness: 0.94, costPerRun: 990,  incident: null }, // benign dip
  { day: 6,  retrievalRate: 0.71, relevanceScore: 0.62, faithfulness: 0.92, costPerRun: 1030,
    incident: 'Index refresh job silently failed — retrieval rate and relevance collapsed' },
  { day: 7,  retrievalRate: 0.93, relevanceScore: 0.83, faithfulness: 0.97, costPerRun: 1000, incident: null },
  { day: 8,  retrievalRate: 0.91, relevanceScore: 0.76, faithfulness: 0.90, costPerRun: 1080, incident: null }, // benign low faithfulness
  { day: 9,  retrievalRate: 0.96, relevanceScore: 0.86, faithfulness: 0.98, costPerRun: 960,  incident: null },
  { day: 10, retrievalRate: 0.83, relevanceScore: 0.77, faithfulness: 0.95, costPerRun: 1010, incident: null }, // benign dip
  { day: 11, retrievalRate: 0.92, relevanceScore: 0.81, faithfulness: 0.96, costPerRun: 1190, incident: null },
  { day: 12, retrievalRate: 0.93, relevanceScore: 0.81, faithfulness: 0.74, costPerRun: 990,
    incident: 'Prompt-template regression — answers drifted off the retrieved context' },
  { day: 13, retrievalRate: 0.94, relevanceScore: 0.83, faithfulness: 0.96, costPerRun: 1290, incident: null }, // traffic spike
  { day: 14, retrievalRate: 0.91, relevanceScore: 0.80, faithfulness: 0.95, costPerRun: 1875,
    incident: 'Retry loop re-embedded context on every query — cost per run nearly doubled' },
]

// Starting thresholds. Deliberately mis-tuned: cost 600 alerts on every single
// day (11 false alarms) and retrieval rate 0.85 alerts on both benign dips.
export const MONITOR_DEFAULTS: MonitorThresholds = {
  retrievalRate: 0.85,
  relevanceScore: 0.7,
  faithfulness: 0.85,
  costPerRun: 600,
}

export type MonitorKey = keyof MonitorThresholds

export interface MonitorDayResult {
  day: TrafficDay
  alerts: MonitorKey[]     // which monitors fired on this day
  caughtIncident: boolean  // incident day AND at least one alert
  missedIncident: boolean  // incident day AND no alert
  falseAlarm: boolean      // normal day AND at least one alert
}

export interface MonitorEvalResult {
  days: MonitorDayResult[]
  incidentsTotal: number
  incidentsCaught: number
  falseAlarms: number
  passed: boolean
  score: number
  rating: 'retry' | 'pass' | 'gold'
}

export function evaluateMonitors(t: MonitorThresholds): MonitorEvalResult {
  const days: MonitorDayResult[] = MONITOR_TRAFFIC.map(day => {
    const alerts: MonitorKey[] = []
    if (day.retrievalRate < t.retrievalRate) alerts.push('retrievalRate')
    if (day.relevanceScore < t.relevanceScore) alerts.push('relevanceScore')
    if (day.faithfulness < t.faithfulness) alerts.push('faithfulness')
    if (day.costPerRun > t.costPerRun) alerts.push('costPerRun')
    const alerted = alerts.length > 0
    return {
      day,
      alerts,
      caughtIncident: alerted && day.incident !== null,
      missedIncident: !alerted && day.incident !== null,
      falseAlarm: alerted && day.incident === null,
    }
  })

  const incidentsTotal = MONITOR_TRAFFIC.filter(d => d.incident !== null).length
  const incidentsCaught = days.filter(d => d.caughtIncident).length
  const falseAlarms = days.filter(d => d.falseAlarm).length
  const passed = incidentsCaught === incidentsTotal && falseAlarms <= 1

  // Pass: 100 (gold) with zero false alarms, 85 with the one allowed alarm.
  // Fail: a diagnostic sub-70 score — worse the more incidents missed and the
  // noisier the alert stream.
  const score = passed
    ? (falseAlarms === 0 ? 100 : 85)
    : Math.max(0, 60 - 20 * (incidentsTotal - incidentsCaught) - 5 * Math.max(0, falseAlarms - 1))
  const rating: MonitorEvalResult['rating'] = !passed ? 'retry' : score >= 95 ? 'gold' : 'pass'

  return { days, incidentsTotal, incidentsCaught, falseAlarms, passed, score, rating }
}
