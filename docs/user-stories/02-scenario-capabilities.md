# US-02 · Scenario capability tagging

**Status:** specced → built → QA
**Roadmap:** Approach A §12 ("a scenario schema with a decision-taxonomy field, so pairing is
enforceable"), plus the job-gap loop already shipped.
**Why now:** one migration unlocks the pairing rule A needs *and* wires the hardest practice on
the platform into the job-gap loop.

---

## Context

The platform already has a closed 14-key capability taxonomy — produced by the n8n job
classifier, consumed by `lib/capabilities/map.ts` and the readiness/prep surfaces. Scenarios
are the only major learning surface not speaking it, so today a scenario can never count
toward being ready for a real role, and a skill can never be paired to a scenario by decision.

---

## User stories

**US-02a — the learner**
> As an AI PM two gaps from ready on a job I want, I want the *scenarios* that train those
> gaps to appear in my prep track next to lessons and labs — so the platform's hardest,
> most realistic practice actually counts toward the role I'm chasing.

**US-02b — the platform**
> As LearnSignal, I need every scenario tagged with the same decision taxonomy as jobs,
> lessons and labs, so scenario ↔ skill ↔ job ↔ prep all resolve through one vocabulary
> and a companion skill can be paired to its scenario by decision, not by hand.

---

## Acceptance criteria

| # | Criterion |
|---|---|
| **AC-1** | `scenarios` gains a `capabilities` column (jsonb array of taxonomy keys), defaulting to empty. |
| **AC-2** | The taxonomy is **closed**: unknown keys are filtered out on read and never reach the UI or readiness maths. |
| **AC-3** | A completed scenario raises the learner's practice level for each capability it carries. |
| **AC-4** | Prep tracks for a role include scenarios tagged with that role's gap capabilities, rendered alongside lessons and missions with their own `Scenario` kind label and minute estimate. |
| **AC-5** | Scenario capabilities are visible on the scenario surface, using the same humanised labels as the job board. |
| **AC-6** | **Non-regression:** a scenario with no capabilities (all of them, today) behaves exactly as it does now — no empty sections, no layout shift, no errors. |
| **AC-7** | **Non-regression:** readiness and prep produce identical output to before for a learner with no scenario completions. |
| **AC-8** | Scenario completion counts only when the scenario is actually finished, not merely opened. |

---

## Explicitly out of scope

Companion skills themselves (`skill_slug` pairing, the `learnsignal/skills` repo), the
`/instruments` earned-skills page, admin UI for editing tags. This story delivers the
vocabulary and the wiring; A's artifacts come later and depend on it.
