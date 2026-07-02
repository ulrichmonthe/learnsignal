# RAG Lab — Answer Key

Internal reference for the platform owner. Covers every mission, the correct answer, and the exact scoring logic behind it. All numbers are pulled from the code (`lib/rag-lab/`) and were verified by executing the actual engine — nothing here is guessed.

---

## 1. How the RAG Lab works

### The corpus

Eight fictional "Helix Pay" support documents (`corpus.ts`): refund policy, fraud & liability handbook, dispute guide, payout schedule, KYC policy, API/policy changelog, fee schedule, and account security. Two documents are engineered:

- **doc-fraud** — the sentence "the account holder bears no liability…" is deliberately placed to straddle a 256-word chunk boundary (the Mission 2 crux).
- **doc-api-changelog** — contains both a fresh payout-timing entry ("2 business days", version 2024-11) and a superseded one ("5 business days", 2024-03). Mission 7 swaps in a stale version of this document (`STALE_CHANGELOG`).

### The learner's controls

Each mission exposes a subset of knobs (`exposedKnobs`); everything else is locked at values set in `missions.ts`:

| Knob | Range (from `config.ts`) | What it does |
|---|---|---|
| Chunk size | 64–1024 words, step 64, default 256 | Words per chunk. A "token" is a whitespace-split word (`chunk.ts`). |
| Overlap | 0–256 words, step 16, default 0 | Words shared between consecutive chunks. |
| Embedding model | `helix-embed-large` (strong) / `mini-lex-32` (weak) | Strong = semantic; weak = keyword-only. |
| Method | dense / sparse / hybrid | How chunks are ranked. |
| Hybrid alpha | 0–1, default 0.5 | Dense weight in hybrid (1 = all dense). |
| Top-K | 1–20, default 5 | How many chunks are fed to the model. |
| Threshold | 0–1, default 0 | Minimum score to feed a chunk. (Never exposed in any mission — vestigial.) |
| Reranker + candidate pool | off / on, pool 5–50 (default 20) | Cross-encoder re-scores the top *pool* candidates. |
| Mission-specific | diagnosis choices, scenario cards, monitors, routing policy, cache/routing toggles | See per-mission entries. |

### The "designed scoring" engine — how a run is actually scored

There is **no real LLM or embedding model at runtime**. Everything is deterministic simulation, which means every score is fully predictable:

**Step 1 — Does retrieval find the gold chunk?** (`retrieve.ts`, `goldFit`)
The engine computes BM25 and a designed "dense" score for display, but then *overrides* the position of the gold chunk(s) with a hit/miss rule based purely on (method, model, query kind, alpha):

| Query kind | Weak model | Dense | Sparse | Hybrid |
|---|---|---|---|---|
| **exact** (e.g. "Section 420") | hit (lexical) | **miss** | hit | hit if alpha ≤ 0.7 |
| **semantic** (paraphrase) | **miss** always | hit | **miss** | hit if alpha ≥ 0.3 |
| **multi-hop** | hit | hit | hit | hit |

On a *hit*, gold chunks are pinned to the top of the ranking with score 0.92 (then 0.91, …). On a *miss*, they are buried below the top 8 distractors at score 0.12 — so no realistic top-K reaches them. BM25 only orders the distractors. In other words: **the retrieval knobs are a lookup table, not a search engine.**

**Step 2 — Does generation hallucinate?** (`generate.ts`)
Each query has 1–2 "gold claims", each tied to a gold span (character range in a document). A claim is supported **only if one fed chunk FULLY contains its span** (start ≤ span.start and end ≥ span.end). Partial containment = the engine emits the claim's pre-written `distractorText` and marks it hallucinated. This is why chunk size/overlap matter even when retrieval "hits": a chunk can be gold (≥50% span overlap, `eval.ts chunkIsGold`) yet still not fully contain the span.

**Step 3 — Signal Score** (`score.ts` + `config.ts`), max 100:

- **+ correctness × 50** — supported claims ÷ gold claims
- **+ groundedness × 30** — non-hallucinated claims ÷ total claims
- **+ retrieval F1 × 20** — precision/recall over *fed* chunks vs gold chunks
- **− 12 per hallucinated claim**
- **− 2 per irrelevant fed chunk**, capped at −10
- **− 0.03 per token over the mission budget** (budget is per attempt, default 12,000; only Mission 13's 4,000 budget ever bites)
- **− 1.5 per second of latency over 4 s** — *can never trigger*: simulated latency maxes at 2.5 s (1.2 + 0.8 rerank + 0.5 if topK > 10)

**Rating:** ≥ 95 = gold ⭐, ≥ 70 = pass (the standard `passThreshold`), else retry. Diagnosis/classification missions (1, 7, 10) use threshold 100 — right or wrong.

**Run cost** (`computeRunCost`): 400 base + 60 embedding + 180 per fed chunk + 25 per rerank candidate. Cached chunks cost half (Mission 13).

**Multi-query missions** (client.tsx `computeRun`): every query in the mission runs; the mission score is the **weakest query's score**, re-scored against the total token spend. All queries must pass.

**Predicting a score in your head:** a single-gold-claim query that hits with topK 5 scores **79** (50 + 30 + F1 0.33 → 6.7, minus 8 for 4 irrelevant fed chunks). A two-gold-chunk query scores **85**. A miss scores **0** (both components zero, minus penalties). These three numbers cover almost every run in the Lab.

⚠ **Global quirks:** (1) correctness and groundedness are always equal in single-hop runs — generated claims map 1:1 to gold claims — so the 50/30 split is cosmetic; effectively one number weighted 80. (2) The latency penalty is dead code in practice. (3) Because gold-hit chunks always score 0.92 and misses 0.12, the threshold knob would be trivial if it were ever exposed.

**XP** (`score.ts computeXP`): 100 per pass, +50 gold, +25 first try, +20 zero hallucinations, +15 if tokens ≤ half budget, +10/day streak (cap 7 days).

---

## 2. Mission-by-mission answer key

### Mission 1 — Isolate the Failure (Module 1)

- **Task:** Inspect the pipeline stages for `q-liability` and pick which layer failed: retrieval, generation, or both. No knobs; the pipeline auto-runs with a sabotaged config (weak model, topK = 1, chunk 256/0).
- **Pass criteria:** pick the one correct diagnosis (`passThreshold: 100`).
- **Correct answer:** **"Retrieval failure"** (`diagnosisCorrect: 'retrieval'`). The weak model + semantic query = guaranteed miss; both claims come out as hallucinated distractors; Signal Score of the auto-run is 0.
- **Wrong answers:** "Generation failure" and "Both" — generation only hallucinated *because* it was never fed the gold chunks; the Retrieve stage panel shows the gold chunk is not in top-K.
- **Teaching point:** always split RAG debugging into retrieval vs generation before touching anything.

### Mission 2 — Chunk Helix's Docs (Module 1)

- **Task:** Tune chunk size and overlap (start: 128/0) so the 261-character liability span lands inside a single chunk. Query: `q-liability`. Everything else locked (strong model, dense, topK 5).
- **Pass criteria:** Signal Score ≥ 70.
- **Correct answers (verified by running the engine):** the starting 128/0 scores **33** (one of two claims hallucinated). Almost any increase works: **128/16 already passes (85)**, as do 256/0 (85), 512/0 (85). Gold ⭐ is reachable at 128/64 (96), 128/96 (95), 192/96 (96), 192/128 (98).
- **Wrong configurations:** 128/0 and 128/128 fail (33 / 29); **192 with overlap ≤ 16 fails (33)** and — counterintuitively — **384 with overlap ≤ 32 fails (33)**: bigger chunks re-split the span at a different boundary.
- ⚠ **Quirks:** the pass region is non-monotone (384/0 fails while 256/0 passes), which contradicts the intuition "bigger chunk = safer" the brief implies. Also the brief says "Increase the chunk size or add overlap" — adding just 16 words of overlap at size 128 is enough, which may feel anticlimactic.
- **Teaching point:** chunk boundaries silently split evidence; overlap is insurance.

### Mission 3 — Dense vs Sparse vs Hybrid (Module 2)

- **Task:** One config must serve both `q-section420` (exact) and `q-lies-for-money` (semantic, zero lexical overlap). Knobs: method + alpha.
- **Pass criteria:** weakest of the two queries ≥ 70.
- **Correct answer:** **hybrid with alpha between 0.3 and 0.7 inclusive** (both queries score 79). Default alpha 0.5 works.
- **Wrong configurations:** dense → Section 420 scores 0 (dense buries exact identifiers per `goldFit`); sparse → lies-for-money scores 0 (no shared vocabulary); hybrid with alpha ≤ 0.25 or ≥ 0.75 fails one side (the cutoffs in `retrieve.ts` are alpha ≤ 0.7 for exact, ≥ 0.3 for semantic).
- **Teaching point:** exact-match and semantic queries fail on opposite methods; hybrid with a balanced weight covers both.

### Mission 4 — Add a Reranker (Module 2)

- **Task:** `q-payout-timing` with the `lowRankGold` injection: the gold chunk is artificially pinned at rank 6, just outside topK 5. Knobs: rerank, candidate pool, topK.
- **Pass criteria:** ≥ 70.
- **Correct answer:** **reranker ON with candidate pool ≥ 6** (default 20 fine). The rerank formula (`rerankScore`) weights gold-span overlap at 0.55, so the gold chunk jumps to rank 1. Best play: **rerank on + topK 1 → score 100, gold ⭐** (precision 1.0, no irrelevant-chunk penalty, cost only 1,140 tokens).
- **Wrong configurations:** rerank off + topK 5 → 0 (gold at rank 6 never fed). **Rerank on with pool = 5 → 0**: the pool is taken from the top of the pre-rerank ranking, and the gold sits at rank 6 — the reranker never sees it. That's the intended "pool must cover the gold's raw rank" lesson.
- ⚠ **Quirks:** the brief claims raising topK "will bust your budget with irrelevant chunks" — false. **topK 6 with rerank off passes at 76** (cost 1,540 of a 12,000 budget; the only sting is the −10 irrelevant-chunk cap and low F1). The mission is passable without ever touching the reranker.
- **Teaching point:** a reranker rescues relevant-but-buried chunks more precisely than widening top-K.

### Mission 5 — Score the Halves Separately (Module 2)

- **Task:** The eval-suite view runs 6 queries under a locked config (dense, strong model, 256/32, topK 5). The learner tags each query as `retrieval` failure, `generation` failure, or `both-ok`. No RUN button.
- **Pass criteria:** all 6 tags correct in one submission (then recorded as score 85, "pass").
- **Correct answers (verified):**

| Query | Kind | Correct tag | Why |
|---|---|---|---|
| q-liability | semantic | **both-ok** | dense + strong = hit; spans contained at 256/32 |
| q-section420 | exact | **retrieval** | dense buries exact identifiers |
| q-lies-for-money | semantic | **both-ok** | hit |
| q-payout-timing | semantic | **both-ok** | hit |
| q-2fa-methods | exact | **retrieval** | dense buries exact identifiers |
| q-kyc-docs | semantic | **both-ok** | hit |

- ⚠ **Quirks:** the `generation` tag is **never the correct answer** — in this engine, hallucination only ever happens downstream of a retrieval miss, and a retrieval miss is always tagged `retrieval` first (`correctLabel` checks retrieval before generation). A learner who understands the engine can ignore that button entirely. The pattern is also fully predictable from query kind: exact → retrieval, semantic → both-ok.
- **Teaching point:** retrieval and generation must be measured independently; a bad answer usually starts as a retrieval problem.

### Mission 6 — Pick the Embedding Model (Module 2)

- **Task:** Run the 6-query eval set (hybrid α 0.5, 256/32, topK 5) with the two models and pick the winner. Starts on `mini-lex-32`.
- **Pass criteria:** weakest query ≥ 70.
- **Correct answer:** switch to **helix-embed-large** — all 6 queries pass (79–85). `mini-lex-32` fails all 4 semantic queries (score 0 each; the weak model always misses semantic queries per `goldFit`) and only clears the two exact ones (79).
- **Teaching point:** benchmark leaderboards (MTEB) don't matter; evaluate models on *your* eval set. (Here the leaderboard winner also happens to be the right pick — the lesson is the habit of running the comparison.)

### Mission 7 — Stale Index (Module 3)

- **Task:** Pure diagnosis. The index serves the stale changelog (version 2024-03, "5 business days"). Pick why Helix answers wrongly.
- **Pass criteria:** the one correct choice (`passThreshold: 100`).
- **Correct answer:** **"Stale index"** (`diagnosisCorrect: 'stale-index'`). The DOCUMENT stage panel explicitly shows a red warning: "Index is serving doc-api-changelog version 2024-03 (5 business days). The current version is 2024-11 (2 business days)."
- **Wrong answers:** bad chunking / wrong model / low top-K — the pipeline stages all show green, which is the point.
- ⚠ **Quirks:** the injection is narrative-only. The gold span for `q-payout-timing` lives in **doc-payouts** (which is *not* swapped), so the simulated pipeline still retrieves it, scores 79, and shows **zero hallucinations** — the "wrong answer to users" exists only in the brief and the DOCUMENT panel text, not in the actual generated output. A sharp learner may notice the contradiction.
- **Teaching point:** a pipeline can be perfectly healthy and still wrong — index freshness is a failure mode outside the pipeline.

### Mission 8 — Query Drift (Module 3)

- **Task:** Three messy production queries ("when does the money show up", "how do i set up the code thing for logging in", "what do u need to prove who i am"). Diagnose the gap AND tune (knobs: chunk size, method, topK) until all three pass.
- **Pass criteria:** correct diagnosis **and** pipeline ≥ 70 (client requires both: `handleDiagnosisSubmit` checks `pipelineOk`).
- **Correct answer:** diagnosis = **"Query drift"**; pipeline = **dense or hybrid** (all three drift queries are kind `semantic` and score 79 with either; the strong model is locked on). Sparse fails all three at 0.
- **Wrong configurations:** method = sparse (0 across the board — no vocabulary overlap with the messy phrasing).
- ⚠ **Quirks:** (1) The default knob state is method = hybrid, so **the pipeline is already green on the very first RUN** — the "re-tune until the production set hits target" part is a no-op unless the learner breaks it themselves. (2) **Lock-out bug:** the diagnosis submit is one-shot (`diagnosisSubmitted`). If the learner submits the (correct) diagnosis *before* running a green pipeline, `pipelineOk` is false, the pass never fires, and the submit button disappears — the mission becomes unpassable without a page reload.
- **Teaching point:** test-set queries flatter you; production phrasing is the real distribution.

### Mission 9 — Wire the Monitors (Module 3)

- **Task (per the brief):** configure four monitors (retrieval rate, relevance, faithfulness, cost/run) with thresholds that would have caught three seeded incidents with ≤ 1 false alarm.
- **Pass criteria (per `missions.ts`):** Signal Score ≥ 70.
- **Correct answer:** **none exists — the mission is not passable in the current build.**
- ⚠ **Quirks — this is a bug, not a quirk:** `client.tsx` renders the four `MonitorControl` sliders (defaults: retrieval rate 0.85, relevance 0.7, faithfulness 0.85, cost 600) but the `monitorThresholds` state is **never read by anything**. There is no submit button, the RUN button is explicitly hidden for monitor missions (`!isExposed('monitors')` guard), no seeded-incident data exists anywhere in `lib/rag-lab/`, and no pass path calls `finishPass`. The learner can move sliders forever with no feedback. Needs a scoring handler (e.g. replayed incident traffic + false-alarm counting) before launch.
- **Teaching point (intended):** monitoring thresholds are a precision/recall trade-off on alerts.

### Mission 10 — RAG's Ceiling (Module 3)

- **Task:** Classify five scenario cards as `rag`, `long-context`, or `fine-tune`. All-or-nothing (`passThreshold: 100`; `handleScenarioSubmit` requires every card correct).
- **Correct answers** (from `SCENARIO_CARDS`):

| Card | Scenario | Answer |
|---|---|---|
| 1 | Legal research, 2M+ docs, daily updates | **rag** |
| 2 | 40-page handbook, 12-person team, changes yearly | **long-context** |
| 3 | Bot that must match exact brand voice (not answer from docs) | **fine-tune** |
| 4 | SaaS copilot, 5000+ articles, weekly updates | **rag** |
| 5 | JSON output formatter, proprietary schema, no factual lookup | **fine-tune** |

- **The rubric baked into the cards:** large corpus + high volatility → RAG; small stable corpus → long context; behavior/format (not knowledge) → fine-tune.
- ⚠ **Quirk:** after a wrong submission, the UI reveals the correct answer on every card (`✗ Correct answer: …`), so attempt 2 is a free pass — but first-try XP (+25) is lost.
- **Teaching point:** RAG is a choice, not a default.

### Mission 11 — Retrieval as a Policy (Module 4)

- **Task:** Five queries; method locked to sparse. Toggle the ROUTING POLICY knob so the retriever is picked per query kind (exact → sparse, semantic → dense, multi-hop → hybrid — hardcoded in `client.tsx computeForQuery`).
- **Pass criteria:** weakest of the 5 queries ≥ 70.
- **Correct answer:** **turn the routing policy ON.** Verified: with the sparse baseline, the two exact queries (q-section420, q-chargeback-fee) pass at 79 but all three semantic ones (q-lies-for-money, q-payout-timing, q-kyc-docs) score 0. With the policy on, all five score 79.
- **Wrong configuration:** leaving the toggle off — the mission score is the worst query, so 0.
- ⚠ **Quirk:** it's a single boolean toggle; there is nothing to "tune". One click passes the mission.
- **Teaching point:** retrieval strategy can be a per-query routing decision instead of one global setting.

### Mission 12 — Multi-Hop & Per-Span Eval (Module 4)

- **Task:** `q-refund-then-liability` needs evidence from two documents (doc-refunds + doc-fraud). Starts at topK 1. Knobs: method + topK. Chunk locked at 512/64.
- **Pass criteria:** ≥ 70.
- **Correct answer:** **topK = 2 → score 100, gold ⭐** (both gold chunks pinned at ranks 1–2, precision and recall 1.0). topK 3 scores 94, topK 5 scores 85 — all pass. topK 1 scores 41 (one claim hallucinated: 25 + 15 + F1 13.3 − 12).
- **Wrong configurations:** only topK 1 fails. **The method knob is a red herring**: query kind `multi-hop` returns 'hit' for every method in `goldFit`, so dense/sparse/hybrid all behave identically (verified).
- ⚠ **Quirks:** despite the title, no actual multi-hop machinery runs — `scoreMultiHop` in `eval.ts` exists but the client uses the ordinary single-pass pipeline; "hops" are just two gold spans. Raising topK is the whole mission.
- **Teaching point:** multi-part questions need enough context slots for *every* required span; evaluate per claim, not per answer.

### Mission 13 — Cost Levers (Module 4)

- **Task:** Five queries under a reduced **4,000-token budget** (vs the usual 12,000). Knobs: CONTEXT CACHE and QUERY ROUTING toggles. Config otherwise locked (hybrid, topK 5).
- **Pass criteria:** weakest query ≥ 70, with the over-budget penalty (−0.03/token over 4,000) applied to the **total** spend across all five queries.
- **Correct answer:** **both toggles ON.** Verified totals: neither = 6,800 tokens → worst query 0 (−84 penalty); cache only = 4,550 → worst 62; routing only = 5,000 → worst 49; **both = 3,650 → worst 79, pass**. Cache halves fed-chunk cost (0.5 discount, `config.ts`); routing skips retrieval cost entirely for the two exact-kind queries (q-section420, q-2fa-methods → 460 tokens each instead of 1,360).
- **Wrong configurations:** any single lever — cache-only comes closest (62) but still fails, which matches the brief's "You need both levers."
- ⚠ **Quirk:** "routing easy queries away from retrieval" only changes the *cost* calculation — the retrieval and answer are still computed and scored normally, so quality never drops. In reality skipping retrieval would risk the answer.
- **Teaching point:** cost is a first-class design constraint; caching and routing compound.

---

## 3. Query & gold-span reference

Gold spans are character offsets into the document body (`queries.ts`); a chunk counts as gold at ≥ 50% span overlap (`eval.ts`), but a claim is only *supported* if a fed chunk fully contains the span (`generate.ts`). "Favored method" follows the `goldFit` table: exact → sparse or hybrid (α ≤ 0.7); semantic → dense or hybrid (α ≥ 0.3), strong model required; multi-hop → any.

| Query | Text | Kind | Gold doc(s) / span(s) | Gold fact | Favored method | Used in missions |
|---|---|---|---|---|---|---|
| q-liability | "Who is liable if a user is tricked into authorizing a payment?" | semantic | doc-fraud 2565–2826 and 3757–3839 (2 claims) | No liability for unauthorized transactions; APP fraud reimbursement | dense / hybrid | 1, 2, 5, 6, 9, 13 |
| q-section420 | "What does Section 420 say about refunds?" | exact | doc-refunds 1448–1501 | Formal dispute within 45 calendar days | sparse / hybrid α ≤ 0.7 | 3, 5, 6, 11, 13 |
| q-lies-for-money | "What if someone lies to get a refund they don't deserve?" | semantic | doc-refunds 1978–2139 | Misrepresentation → denial, suspension, fraud referral | dense / hybrid (zero lexical overlap by design) | 3, 5, 6, 9, 11 |
| q-payout-timing | "How long do payouts take?" | semantic | doc-payouts 379–452 | 2 business days (2024-11) | dense / hybrid | 4, 5, 6, 7, 8(drift), 9, 11, 13 |
| q-refund-then-liability | "If my refund is denied because of fraud, am I still liable?" | multi-hop | doc-refunds 1978–2139 + doc-fraud 2729–2780 | Refund denial on fraud + no-liability rule | any (needs topK ≥ 2) | 12 |
| q-instant-payout | "Is there a faster payout option…?" | semantic | doc-payouts 1443–1478 | Instant Payout, 30 min, fee | dense / hybrid | — (unused by missions) |
| q-2fa-methods | "What 2FA methods does Helix Pay support?" | exact | doc-security 577–624 | SMS, authenticator apps, hardware keys | sparse / hybrid α ≤ 0.7 | 5, 6, 13 |
| q-kyc-docs | "What documents do I need for identity verification?" | semantic | doc-kyc 790–872 | Photo ID + proof of address | dense / hybrid | 5, 6, 8(drift), 11 |
| q-chargeback-fee | "How much does a chargeback cost the merchant?" | exact | doc-fees 811–870 | $15, waived if merchant wins stage 1 | sparse / hybrid α ≤ 0.7 | 11 |
| q-unverified-limit | "What happens if I haven't completed identity verification?" | semantic | doc-kyc 1588–1643 | Threshold, then transactions blocked | dense / hybrid | — (unused) |
| q-refund-timeline | "How long does it take to get a refund approved?" | semantic | doc-refunds 2714–2757 | 7–10 business days; §420 up to 30 | dense / hybrid | — (unused) |
| q-security-alert | "Will Helix Pay notify me if someone logs in from a new device?" | semantic | doc-security 1569–1609 | New-device / suspicious-activity alerts | dense / hybrid | 13 |
| q-payout-timing-drift | "when does the money show up" | semantic | same as q-payout-timing | same | dense / hybrid | 8 |
| q-2fa-drift | "how do i set up the code thing for logging in" | semantic | same as q-2fa-methods (kind changed to semantic!) | same | dense / hybrid | 8 |
| q-kyc-drift | "what do u need to prove who i am" | semantic | same as q-kyc-docs | same | dense / hybrid | 8 |

⚠ Note on the drift set: `q-2fa-drift` reuses the gold span of the *exact*-kind `q-2fa-methods` but is re-labeled `semantic` — which is what makes sparse fail it in Mission 8. Three authored queries (q-instant-payout, q-unverified-limit, q-refund-timeline) are never referenced by any mission.

---

*Verified against the engine on 2026-07-02 by executing `lib/rag-lab/` directly (chunk → retrieve → generate → eval → score) for every mission configuration listed above.*
