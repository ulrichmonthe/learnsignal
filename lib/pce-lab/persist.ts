// localStorage persistence for the PCE Lab. Key prefix: pcelab:
// Typed wrapper; all operations are safe to call SSR (no-ops on server).
// Mirrors lib/rag-lab/persist.ts. The `missions` shape (per-mission
// `completed` booleans) is what lib/skills/recompute.ts counts.

const PREFIX = 'pcelab:'
const PROGRESS_KEY = `${PREFIX}progress`

export interface PCEMissionProgress {
  completed: boolean
  bestScore: number
  completedAt?: string
}

export interface PCEProgress {
  missions: Record<string, PCEMissionProgress>
}

function isClient(): boolean {
  return typeof window !== 'undefined'
}

// ── Default progress ──────────────────────────────────────────────────────────

export function defaultProgress(): PCEProgress {
  return { missions: {} }
}

// ── Load / save ───────────────────────────────────────────────────────────────

export function loadProgress(): PCEProgress {
  if (!isClient()) return defaultProgress()
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as PCEProgress
    if (!parsed || typeof parsed !== 'object' || !parsed.missions) return defaultProgress()
    return parsed
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: PCEProgress): void {
  if (!isClient()) return
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Ignore storage errors (private mode, quota exceeded)
  }
}

// ── Convenience updaters ──────────────────────────────────────────────────────

export function recordMissionComplete(
  progress: PCEProgress,
  missionId: string,
  score: number,
): PCEProgress {
  const existing = progress.missions[missionId]
  return {
    ...progress,
    missions: {
      ...progress.missions,
      [missionId]: {
        completed: true,
        bestScore: Math.max(score, existing?.bestScore ?? 0),
        completedAt: existing?.completedAt ?? new Date().toISOString(),
      },
    },
  }
}

export function resetProgress(): void {
  if (!isClient()) return
  localStorage.removeItem(PROGRESS_KEY)
}

// ── Cloud sync (per Clerk account) ────────────────────────────────────────────
// localStorage is the fast local cache; the account (Supabase) is the source of
// truth that follows the user across devices.

const LAB = 'pcelab'

export async function fetchCloudProgress(): Promise<PCEProgress | null> {
  if (!isClient()) return null
  try {
    const res = await fetch(`/api/playground/progress?lab=${LAB}`)
    if (!res.ok) return null
    const json = await res.json()
    const d = json?.data as PCEProgress | null
    if (!d || !d.missions) return null
    return d
  } catch {
    return null
  }
}

export function pushCloudProgress(progress: PCEProgress): void {
  if (!isClient()) return
  // fire-and-forget; localStorage already holds the authoritative local copy
  fetch('/api/playground/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lab: LAB, data: progress }),
  }).catch(() => {})
}
