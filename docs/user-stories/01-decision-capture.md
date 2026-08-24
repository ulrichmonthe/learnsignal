# US-01 · Decision capture (Calibration corpus, Phase 0)

**Status:** specced → built → QA
**Roadmap:** Approach D §2.1 (`decision_event` schema), §3 (publishable-N gate), §5 (integrity rules), §6 (privacy)
**Why now:** irreversible. Every scenario shipped without capture is decision history that can never be reconstructed.

---

## Context found in the codebase

`app/api/scenarios/progress/` and `app/api/scenarios/[id]/` are **empty directories**. The
scenario page reads `scenario_completions` on load, but nothing ever writes it — decisions
live in React state and are lost on refresh. So this story delivers two things at once:
the calibration capture layer *and* the persistence the engine was always missing.

---

## User stories

**US-01a — the learner**
> As an AI PM working through a scenario, I want to commit my decision *with* my confidence,
> my reasoning, and my guess at what most PMs chose — and have it survive a page refresh —
> so the comparison I get afterwards is honest and my record reflects what I actually decided
> under pressure.

**US-01b — the platform**
> As LearnSignal, I need every decision recorded in a pseudonymised, version-locked form
> from day one, so a calibration corpus accumulates while the library is small and can
> support published distributions later, under the integrity rules, without retrofitting.

---

## Acceptance criteria

### Capture surface (learner-facing)

| # | Criterion |
|---|---|
| **AC-1** | The decision act collects four things before the commit button unlocks: chosen option, confidence (0–100), predicted majority choice, and a written rationale. |
| **AC-2** | Rationale is required and must be **≥120 characters** (D §12 anti-straight-lining gate). The commit control stays disabled and states what is missing. |
| **AC-3** | Time-to-decide is measured from first render of the decision act to commit, in ms. |
| **AC-4** | Capture failure **never blocks the learner**. If the network call fails, the scenario advances normally and no error is shown. |
| **AC-5** | Progress persists: reloading the scenario resumes at the same act with prior decisions intact. |

### Record integrity (corpus-facing)

| # | Criterion |
|---|---|
| **AC-6** | `learner_key` = HMAC-SHA256(user_id, server pepper). The raw Clerk `user_id` **never** appears in `decision_events`. |
| **AC-7** | `choice_set_hash` is deterministic for an identical option set, order-independent, and **changes when any option's text changes** — so distributions can never pool across reworded options. |
| **AC-8** | `is_first_attempt` is `true` only for the learner's first recorded event at a given (scenario, node); later attempts record `false`. |
| **AC-9** | Every row carries `scenario_version`, `pressure_profile`, and `client_surface`. |
| **AC-10** | Rationale free text is stored for coding only and is **never** returned by any read path that could be published. |

### API contract

| # | Criterion |
|---|---|
| **AC-11** | `POST /api/scenarios/decision` requires auth → **401** when signed out. |
| **AC-12** | Rejects with **400**: missing/blank `scenarioId`, `nodeId`, or `choiceId`; confidence not an integer 0–100; rationale <120 chars; malformed JSON. |
| **AC-13** | Returns **200 `{ok:true}`** on a valid write, and degrades to `{ok:false}` (not a 5xx) when the corpus table is absent. |
| **AC-14** | `POST /api/scenarios/progress` upserts `{current_act, decisions}` per (user, scenario) and requires auth. |

### Non-regression

| # | Criterion |
|---|---|
| **AC-15** | A scenario runs end-to-end with the capture layer disabled or failing (`tsc` clean, build green, no console errors). |
| **AC-16** | No raw rationale, user id, or email is exposed to any client component. |

---

## Explicitly out of scope

Published distributions, percentages, segmentation, the expert/Delphi panel, surprisingly-popular
computation, Brier scoring surfaced to the learner, live MCP fetch. Those are D v2/v3 and are
gated on N, not on code. This story only guarantees the events exist and are trustworthy.
