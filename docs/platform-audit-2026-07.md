# LearnSignal Platform Audit — July 2026

Scope: full codebase + product surface (marketing, auth, dashboard, courses, labs,
APIs, data layer). Findings verified against the code; each carries a file reference.
Companion document: `docs/answer-key/` (full question/logic reference for all playgrounds).

---

## 1. Security & data integrity (fix first)

| # | Severity | Finding | Fix |
|---|---|---|---|
| S1 | **Critical** | `app/api/sessions/[id]/responses/route.ts` verifies the user is signed in but never that the session belongs to them — any signed-in user can upsert responses into any other user's session by changing the URL id. **Verified.** | Look up `playground_sessions.user_id` for the id and 403 on mismatch. |
| S2 | **Critical** | RLS was dropped during the Clerk migration and every API route uses the service-role client. All `/api/*` routes are public in `middleware.ts` (each self-guards). One forgotten `auth()` check = full table exposure. | Defense in depth: re-add RLS policies keyed on user_id, or add a shared `requireUser()` helper every route must call. |
| S3 | High | Progress APIs (`/api/playground/progress`, `/api/learn/progress`) accept arbitrary JSON — a user can POST fabricated lab progress and inflate their own skill scores. Low stakes today (own scores only), but breaks leaderboards/credentials later. | Validate shape server-side; clamp counts to known mission/lesson totals. |
| S4 | High | `/api/playground/classify` is unauthenticated with no rate limiting. | Add `auth()` + basic rate limit. |
| S5 | Medium | Malformed-JSON handling: several routes call `req.json()` bare (500 instead of 400); `Number()` coercions accept junk (`learn/progress` `total`). | Wrap parses; validate types explicitly. |
| S6 | Medium | Cloud-sync semantics (`lib/rag-lab/persist.ts`): on mount cloud overwrites local; pushes are fire-and-forget with no timeout or conflict handling. Two tabs/devices can silently clobber each other. | Merge by most-progress (union of completed missions) instead of overwrite; add fetch timeout. |

## 2. Playground logic bugs (from the answer-key deep-trace)

The answer key (`docs/answer-key/`) was produced by executing/tracing the real engines.
It surfaced real defects:

**RAG Lab** (`lib/rag-lab/`, `app/(platform)/playground/rag-lab/`)
- **Mission 9 is unpassable** — monitor slider state is never read; no submit button; no pass path. A learner hits a wall.
- **Mission 8** one-shot diagnosis submit can permanently lock out the pass if clicked early; its default configuration already passes (no learning required).
- **Mission 4** passes without the reranker it exists to teach (topK 6 scores 76).
- **Mission 7** stale-index injection is narrative-only — the pipeline still scores 79 with zero hallucinations, contradicting the story.
- Mission 2's pass grid is non-monotone (384/0 fails while 256/0 passes); Mission 5's "generation" tag is never the right answer; Mission 12's method knob is a red herring; the latency penalty is dead code; 3 authored queries are unused.

**PCE Lab** (`lib/pce-lab/`)
- **Mission 1 completes on page load** (no learner action required).
- Criterion regexes have false positives/negatives: `docs-not-in-middle` fails the canonical blueprint order; `retrieval-reranked` passes on the literal text "no reranking"; the canonical "~1500t" budget fails `retrieval-max-5-chunks`; `uses-xml-structure` is dead code.
- Missions 2/6/7/8/10 secretly require trimming (Context Efficiency floors at ~43 for the canonical prompt); 5/6/10 require an undocumented sycophancy fix. Attempt limits never actually block completion.

**Eval Lab** (`app/(platform)/playground/eval-lab/`)
- Reveal slots are hardcoded; the DB `expected_label` column is unused (drift risk).
- The concept page spoils the three patterns the vibe check wants you to "discover" — read order defeats the pedagogy.
- Ticket 6 is a real failure no pattern credits; NEEDS_EDITS counts as a miss on hallucination/sarcasm tickets; no overall grade or completion signal, and it feeds nothing (no skill credit, no lab_progress).

**Course exercises** (`lib/courses/exercises/`)
- Healthy. One cosmetic flag: PCE lesson-7's zero-width band makes "directionally right" unreachable (0–3 integer scale; acceptable).

## 3. Product / UX

*(Corrected for current state: RAG Lab **does** sync to the account and skill map as of the
Tier 0 work, and lessons now have completion + exercises. The gaps below are what remains.)*

| # | Impact | Finding | Fix |
|---|---|---|---|
| P1 | Very high | **No first-run experience.** A new user lands on a dashboard of six empty skill dimensions with no "start here." | First-run banner when all scores are 0: two paths (Courses / Labs) + one recommended first lesson. |
| P2 | Very high | **Scenarios nav tab → "coming soon"** — the nav advertises the core marketing promise and delivers a stub. | Reframe the page as "in development, here's what's coming" and point to the labs as today's decision environments; or hide the tab until real. |
| P3 | High | **Course overview pages show no progress** — no checkmarks, no %, no Resume, even though the data now exists (`getCourseProgress`). | Add progress bar + per-lesson checkmarks + "Resume lesson N" CTA on the 4 overview pages. |
| P4 | High | **PCE Lab has no persistence** — progress vanishes on refresh and never feeds Product Craft, unlike RAG Lab. | Copy the RAG Lab persist pattern (`fetchCloudProgress`/`pushCloudProgress`, lab='pcelab'). |
| P5 | Medium | **Eval Lab feeds nothing** — completing the vibe check earns no skill credit (Product Taste is course-only). | Write an `evallab` row to `lab_progress` on reveal; add to the recompute TRACKS registry. |
| P6 | Medium | Dashboard shows no lab/course activity — only the radar and hardcoded "continue" cards. | "Continue where you left off" section driven by `lab_progress` rows. |
| P7 | Low | Orphan/cryptic routes: `/playground/confirm` (unlinked intent classifier), `/waitlist` remnants. | Delete or integrate. |

## 4. Code health & testing

- **Tests**: only the RAG Lab engine has coverage (19 vitest tests). Zero tests on API routes, auth gating, skill recompute, exercise schema integrity. Priority: ownership/auth tests for every API route; a schema-conformance test over the 46 exercise specs.
- **Dead code**: waitlist-era routes/components, `/playground/confirm`, unused `uses-xml-structure` criterion, RAG latency penalty, 3 unused queries.
- **Error handling**: no `error.tsx`/`loading.tsx` boundaries in the `(platform)` group; several client fetch failures are silently swallowed (`console.error` only).
- Admin gating is solid (email gate in layout + `requireAdmin()` in every action). Service-role key correctly server-only.

## 5. Recommended order of work

1. **Security S1 + S2 + S3** — one focused session; small diffs, big risk retired.
2. **RAG Lab M9 unpassable + M8 lockout** — learners are hitting these walls today.
3. **Quick UX wins** (~2h total): first-run banner, Scenarios reframe, course-overview progress.
4. **PCE Lab persistence + Eval Lab skill credit** — completes the "everything feeds the skill map" story.
5. **PCE Lab regex fixes** — restores trust in mission scoring.
6. **API tests** — lock in the security fixes.

**Overall:** foundations are strong (Clerk gating, server-only service role, modular
course/lab architecture, and now a uniform exercise system). The risk is concentrated in
(a) three API-layer gaps and (b) playground scoring defects that quietly break the
platform's core promise — that the answer you commit to is judged by logic you can trust.
