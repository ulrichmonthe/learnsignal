# US-04 · Weekly Signal (publish) + admin-only Drafts

**Status:** specced → built → QA
**Closes:** the gap flagged when the Signals Writer shipped — approving a draft flipped a
status and nothing was ever published.

---

## Context

- `/drafts` is already gated by `isSignalsAdmin()` (SIGNALS_ADMIN_EMAILS, default owner) —
  a non-admin sees "Not authorized". But the **nav link renders for every signed-in user**,
  so learners see a link into an admin surface.
- Approving sets `status='approved'` and stops. There is no public surface for approved work.
- `signal_drafts` has no `slug`, so issues have no addressable URL.

---

## User stories

**US-04a — the reader (signed in or not)**
> As an AI PM, I want to read the published Weekly Signal without an account, so the thing the
> homepage promises — one piece of research a week, translated into the decision it changes —
> is actually something I can find and share.

**US-04b — the admin**
> As the owner, I want Drafts to be invisible to everyone but me, and approving a draft to be
> the single act that publishes it, so review and publication are one step rather than two.

---

## Acceptance criteria

### Publishing

| # | Criterion |
|---|---|
| **AC-1** | Approving a draft assigns a URL-safe `slug` derived from its title and publishes it. Rejecting never publishes. |
| **AC-2** | Slugs are unique. A title colliding with an existing slug gets a suffixed variant rather than overwriting or failing. |
| **AC-3** | A slug, once assigned, never changes — re-approving an already-approved draft keeps the original URL so shared links don't rot. |
| **AC-4** | Only `status='approved'` drafts are publicly readable. Pending and rejected are never exposed by any public route. |

### Public surface

| # | Criterion |
|---|---|
| **AC-5** | `/weekly-signal` lists published issues, newest first, and is reachable **signed out**. |
| **AC-6** | `/weekly-signal/[slug]` renders one issue: title, dek, the "decision it changes", body, and sources as working links. |
| **AC-7** | An unknown or unpublished slug returns 404, not a partial render or an error page. |
| **AC-8** | Both pages carry per-issue SEO metadata (title, description) and degrade to an honest empty state when nothing is published yet. |
| **AC-9** | "Weekly Signal" appears in the marketing nav (signed out) **and** the platform nav (signed in). |

### Admin gating

| # | Criterion |
|---|---|
| **AC-10** | The Drafts nav link renders only for an admin; a signed-in non-admin never sees it. |
| **AC-11** | The `/drafts` page and `/api/signals/review` remain gated server-side — hiding the link is presentation, not the control. |
| **AC-12** | The self-grade, rationale and review metadata never appear on any public surface. |

---

## Decisions worth flagging

**`/signals` is left untouched.** It serves the hand-authored `lib/articles.ts` collection.
That leaves two adjacent surfaces — Signals (essays) and Weekly Signal (the agent's weekly
issue). This story adds the second as asked; merging them is a separate call.

---

## Out of scope

LinkedIn auto-post, RSS, the in-app reader experience, editing an approved issue.
