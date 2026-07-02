# LearnSignal — Playground Answer Key

The complete reference for every question, mission, and exercise on the platform:
what the learner is asked, what the correct answer is, and the logic that scores it.
Generated 2026-07-02 from the code as source of truth.

| Document | Covers | Items |
|---|---|---|
| [rag-lab.md](rag-lab.md) | RAG Lab: the designed scoring engine, all missions, query & gold-span table | 13 missions · 15 queries |
| [pce-eval-labs.md](pce-eval-labs.md) | PCE Lab missions + deterministic scoring; Eval Lab vibe-check tickets + reveal logic | 10 missions · 20 tickets |
| [course-exercises.md](course-exercises.md) | All embedded course exercises (Commit Loop): question, answer, verdict logic, KEEP line | 46 exercises across 4 courses |

## Known issues surfaced while documenting

These were found by tracing the actual logic and are tracked for fixing (see
`docs/platform-audit-2026-07.md`):

- **RAG Lab Mission 9 is unpassable** — monitor sliders are never read; no submit path.
- **RAG Lab M8** can lock the learner out (one-shot diagnosis submit before pipeline is green); its default knobs already pass.
- **RAG Lab M4** passes without the reranker it teaches; M7's stale-index injection is narrative-only.
- **PCE Lab Mission 1** completes on page load; several criteria have regex bugs
  (`docs-not-in-middle` false-positives, `retrieval-reranked` passes on "no reranking",
  canonical budget fails `retrieval-max-5-chunks`).
- **Eval Lab** reveal slots are hardcoded (DB `expected_label` unused); ticket 6 is a real
  failure no pattern credits; the concept page spoils the patterns the vibe check is
  supposed to let you discover.
- **Course exercises**: PCE lesson-7 has a zero-width "directional" band `[2,2]` (verdict is
  effectively binary) — minor, by design of a 0–3 integer scale.
