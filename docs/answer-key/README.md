# LearnSignal — Playground Answer Key

The complete reference for every question, mission, and exercise on the platform:
what the learner is asked, what the correct answer is, and the logic that scores it.
Generated 2026-07-02 from the code as source of truth.

| Document | Covers | Items |
|---|---|---|
| [rag-lab.md](rag-lab.md) | RAG Lab: the designed scoring engine, all missions, query & gold-span table | 13 missions · 15 queries |
| [pce-eval-labs.md](pce-eval-labs.md) | PCE Lab missions + deterministic scoring; Eval Lab vibe-check tickets + reveal logic | 10 missions · 20 tickets |
| [course-exercises.md](course-exercises.md) | All embedded course exercises (Commit Loop): question, answer, verdict logic, KEEP line | 46 exercises across 4 courses |

## Issue status (July 2026 fix pass)

The issues surfaced while documenting were fixed in the July 2026 fix pass
(see `docs/platform-audit-2026-07.md` for the audit that drove it):

- ✅ **RAG Lab M9** now has a real pass path: 14 days of seeded traffic, 3 incidents,
  threshold sliders + RUN MONITORS; pass = all incidents caught with ≤1 false alarm
  (`lib/rag-lab/monitors.ts`).
- ✅ **RAG Lab M8** allows diagnosis re-submission (no lockout) and opens in the broken
  state (`initialKnobs: { method: 'sparse' }`) so defaults no longer pass.
- ✅ **RAG Lab M4** pass bar raised to 78 — topK-widening without the reranker tops out
  at 76, so the reranker is genuinely required.
- ✅ **RAG Lab M7** stale-index injection now marks claims `isStale`, which counts against
  correctness (grounded ≠ correct).
- ✅ **RAG Lab M5** locked knobs recalibrated so every diagnosis tag (including
  "generation") is the correct answer for some query.
- ✅ **PCE Lab** Mission 1 requires the real action; broken criteria regexes fixed;
  hidden requirements surfaced in briefs; cloud persistence added (`lab='pcelab'`).
- ✅ **Eval Lab** crediting fixed (ticket 6 credits, EITHER tickets accept either label),
  concept page de-spoiled, completion feeds Product Taste (`lab='evallab'`, 70/30 with
  the course).
- ⚠ Remaining (cosmetic): PCE course exercise lesson-7 has a zero-width "directional"
  band `[2,2]` — verdict is effectively binary on its 0–3 integer scale; acceptable.

Mission entries below each doc reflect pre-fix numbers where not yet updated — the
fix-pass deltas above take precedence where they conflict.
