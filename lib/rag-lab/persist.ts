// localStorage persistence — §11. Key prefix: raglab:
// Typed wrapper; all operations are safe to call SSR (no-ops on server).

import type { GameProgress, MissionRating } from './types'

const PREFIX = 'raglab:'
const PROGRESS_KEY = `${PREFIX}progress`

function isClient(): boolean {
  return typeof window !== 'undefined'
}

// ── Default progress ──────────────────────────────────────────────────────────

export function defaultProgress(): GameProgress {
  return {
    missions: {},
    totalXP: 0,
    level: 1,
    streak: 0,
    lastActiveDate: '',
    badges: {},
    artifacts: {},
    seenStages: new Set(),
  }
}

// ── Load / save ───────────────────────────────────────────────────────────────

export function loadProgress(): GameProgress {
  if (!isClient()) return defaultProgress()
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Omit<GameProgress, 'seenStages'> & { seenStages: string[] }
    return {
      ...parsed,
      seenStages: new Set(parsed.seenStages ?? []),
    }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: GameProgress): void {
  if (!isClient()) return
  try {
    const serializable = {
      ...progress,
      seenStages: Array.from(progress.seenStages),
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(serializable))
  } catch {
    // Ignore storage errors (private mode, quota exceeded)
  }
}

// ── Convenience updaters ──────────────────────────────────────────────────────

export function recordMissionResult(
  progress: GameProgress,
  missionId: string,
  score: number,
  rating: MissionRating,
  xpEarned: number,
): GameProgress {
  const existing = progress.missions[missionId]
  const isImprovement = !existing || score > existing.bestScore

  const updated: GameProgress = {
    ...progress,
    totalXP: progress.totalXP + (rating !== 'retry' ? xpEarned : 0),
    missions: {
      ...progress.missions,
      [missionId]: {
        bestScore: isImprovement ? score : (existing?.bestScore ?? 0),
        rating: isImprovement ? rating : (existing?.rating ?? 'retry'),
        attempts: (existing?.attempts ?? 0) + 1,
        completed: rating !== 'retry',
      },
    },
  }

  // Update streak
  const today = new Date().toISOString().split('T')[0]
  if (updated.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    updated.streak = progress.lastActiveDate === yesterday ? progress.streak + 1 : 1
    updated.lastActiveDate = today
  }

  return updated
}

export function recordStageOpened(progress: GameProgress, stageId: string): GameProgress {
  const updated = { ...progress, seenStages: new Set(progress.seenStages) }
  updated.seenStages.add(stageId)
  return updated
}

export function unlockBadge(progress: GameProgress, badgeId: string): GameProgress {
  if (progress.badges[badgeId]) return progress
  return { ...progress, badges: { ...progress.badges, [badgeId]: true } }
}

export function saveArtifact(progress: GameProgress, artifactId: string, content: string): GameProgress {
  return { ...progress, artifacts: { ...progress.artifacts, [artifactId]: content } }
}

export function resetProgress(): void {
  if (!isClient()) return
  localStorage.removeItem(PROGRESS_KEY)
}

// ── Cloud sync (per Clerk account) ────────────────────────────────────────────
// localStorage is the fast local cache; the account (Supabase) is the source of
// truth that follows the user across devices.

const LAB = 'raglab'

// Two devices (or tabs) can hold different progress; never let one clobber the
// other — take the union, keeping the best result per mission.
function mergeProgress(local: GameProgress, cloud: GameProgress): GameProgress {
  const missions: GameProgress['missions'] = { ...cloud.missions }
  for (const [id, m] of Object.entries(local.missions)) {
    const c = missions[id]
    missions[id] = !c
      ? m
      : {
          bestScore: Math.max(c.bestScore, m.bestScore),
          rating: c.bestScore >= m.bestScore ? c.rating : m.rating,
          attempts: Math.max(c.attempts, m.attempts),
          completed: c.completed || m.completed,
        }
  }
  return {
    missions,
    totalXP: Math.max(local.totalXP, cloud.totalXP),
    level: Math.max(local.level, cloud.level),
    streak: Math.max(local.streak, cloud.streak),
    lastActiveDate:
      local.lastActiveDate > cloud.lastActiveDate ? local.lastActiveDate : cloud.lastActiveDate,
    badges: { ...cloud.badges, ...local.badges },
    artifacts: { ...cloud.artifacts, ...local.artifacts },
    seenStages: new Set([...cloud.seenStages, ...local.seenStages]),
  }
}

export async function fetchCloudProgress(): Promise<GameProgress | null> {
  if (!isClient()) return null
  try {
    const res = await fetch(`/api/playground/progress?lab=${LAB}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const json = await res.json()
    const d = json?.data as (Omit<GameProgress, 'seenStages'> & { seenStages?: string[] }) | null
    if (!d || !d.missions) return null
    const cloud: GameProgress = { ...d, seenStages: new Set(d.seenStages ?? []) }
    const merged = mergeProgress(loadProgress(), cloud)
    // If local knew things the cloud didn't, sync the union back up.
    if (Object.keys(merged.missions).length > Object.keys(cloud.missions).length ||
        merged.totalXP > cloud.totalXP) {
      pushCloudProgress(merged)
    }
    return merged
  } catch {
    return null
  }
}

export function pushCloudProgress(progress: GameProgress): void {
  if (!isClient()) return
  const serializable = { ...progress, seenStages: Array.from(progress.seenStages) }
  // fire-and-forget; localStorage already holds the authoritative local copy
  fetch('/api/playground/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lab: LAB, data: serializable }),
  }).catch(() => {})
}
