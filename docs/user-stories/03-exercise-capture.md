# US-03 · Commit-Loop exercise capture

**Status:** specced → built → QA
**Roadmap:** Approach D §2.1 (decision events) + §2.2 (expert reference layer)
**Why now:** the scenario engine is empty (`select count(*) from scenarios` = 0), but 34
choice-type Commit-Loop exercises are live inside the courses and capture nothing. This is
where real decisions are actually being made today.

---

## Context found in the codebase

- 51 exercises across 5 courses; **34 are choice-shaped** (`kind: 'choice'` ×30,
  `'predict-choice'` ×4) with discrete options.
- Every option already carries an authored expert verdict: **`on-it` (34)**,
  **`directional` (47)**, **`miss` (44)** across 125 options.
  That is roadmap D's expert reference layer — the artefact D budgets a 20-person Delphi
  panel and ~$78k to produce — already written, for free.
- `components/courses/exercise.tsx` contains **zero** `fetch` calls. Nothing is persisted.
- `Exercise` receives only `spec` — no course/lesson context. The lesson route
  (`/playground/learn/<course>/<lesson>`) supplies both without touching 51 call sites.

---

## User stories

**US-03a — the learner**
> As an AI PM working through a course, I want the calls I commit to — and how sure I was —
> to count toward my record, so the judgment I demonstrate inside lessons is the same
> judgment a hiring manager can see on my profile.

**US-03b — the platform**
> As LearnSignal, I need every Commit-Loop decision recorded against the expert verdict that
> was live at the time, so a calibration corpus starts accumulating from existing content and
> "matched the practitioner call in N% of decisions" becomes computable without a panel.

---

## Acceptance criteria

### Capture

| # | Criterion |
|---|---|
| **AC-1** | Committing a choice-type exercise records a decision event: course, lesson, chosen option, the option-set fingerprint, and the **expert verdict of the chosen option**. |
| **AC-2** | The learner may set a confidence before committing. Unlike the scenario surface this is **optional by design** — 34 inline exercises are not one flagship scenario, and hard-gating every one would suppress the completion rate everything else depends on. When unset it is recorded as null, never as a default number. |
| **AC-3** | Where an exercise already defines a rationale prompt, the learner's rationale is captured. Exercises without one are unaffected — the author's design wins. |
| **AC-4** | Capture is fire-and-forget. A failure never blocks the reveal, never shows an error, and never changes what the learner sees. |
| **AC-5** | Only the first commit per (learner, course, lesson) is `is_first_attempt` — enforced by the database, not a client check. |
| **AC-6** | Non-choice kinds (`predict-number`, `rank`, `reflect`) are unaffected and capture nothing in this story. |

### Record integrity

| # | Criterion |
|---|---|
| **AC-7** | `learner_key` is the same HMAC pseudonym used by the scenario surface. The raw Clerk id never reaches `decision_events`. |
| **AC-8** | The expert verdict is stored **as it was at decision time**, so later edits to exercise content cannot retroactively change whether a past answer counted as matching. |
| **AC-9** | `client_surface` distinguishes exercise events (`course-exercise`) from scenario events (`web`), so distributions never silently pool two different pressure conditions. |
| **AC-10** | Course and lesson are derived from the route and validated; a malformed path captures nothing rather than writing a junk row. |

### Calibration read

| # | Criterion |
|---|---|
| **AC-11** | The Decision Record (`/u/[handle]`) shows a **calibration percentage** — the share of first-attempt decisions whose chosen option was `on-it` — replacing the raw decision count as the headline stat. |
| **AC-12** | Calibration is suppressed below a stated minimum (n < 5) rather than shown as a noisy percentage, and the n is always displayed alongside it. |
| **AC-13** | With no captured decisions the record renders exactly as it does today — no empty stat, no error. |

### API

| # | Criterion |
|---|---|
| **AC-14** | `POST /api/exercises/decision` requires auth → 401 signed out; rejects unknown verdicts, unknown courses, and malformed lesson slugs with 400; degrades to `{ok:false}` rather than 5xx when the corpus is unavailable. |

---

## Explicitly out of scope

Published distributions or percentages of *other* learners, segmentation, surprisingly-popular
computation, Brier scoring surfaced to the learner, capture for `predict-number` / `rank` /
`reflect`. Those need either more N or a different record shape.
