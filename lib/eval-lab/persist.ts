// Cloud progress push for the Eval Lab vibe check — mirrors the fire-and-forget
// pattern in lib/rag-lab/persist.ts. The lab is one-shot: reaching the reveal
// with all 20 tickets labelled counts as completed; score is informational.

const LAB = 'evallab'

export function pushEvalLabProgress(score: number): void {
  if (typeof window === 'undefined') return
  fetch('/api/playground/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lab: LAB, data: { completed: true, score } }),
  }).catch(() => {})
}
