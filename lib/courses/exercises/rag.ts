import type { CourseExercises } from '@/lib/courses/exercise-types'

// Exercises for "RAG: Building Knowledge-Grounded AI Products", keyed by lesson slug.
// Every exercise runs the Commit Loop: STAKE → COMMIT → REVEAL → KEEP.
export const RAG_EXERCISES: CourseExercises = {
  // ── Lesson 1 · "The knowledge cutoff is the least of your problems." ──
  // Diagnosis — the obvious read (it's a cutoff problem) is wrong.
  'lesson-1': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['technical-foundation', 'product-taste'],
    stake:
      "Your exec read that the new model's training cutoff moved up nine months and wants to know if that fixes Helix's complaints. Three real tickets are open against Helix this week: (a) it gave a confidently wrong answer about Acme's annual-plan refund window, which changed in a policy update last quarter; (b) it didn't know about a feature Acme shipped two weeks ago; (c) it failed to apply Acme's unwritten rule that enterprise refunds always route to a human, a convention every support rep knows but nobody documented.",
    commitPrompt:
      'A model with a newer cutoff is about to ship. Which of these three tickets does the newer cutoff actually fix?',
    options: [
      {
        id: 'b',
        label: 'Ticket (b) — the feature shipped two weeks ago',
        verdict: 'miss',
        feedback:
          "Tempting, because it's the cleanest 'recent thing' framing. But a feature shipped two weeks ago is newer than ANY cutoff — no model update reaches it. This is a private-gap problem solved by indexing Acme's docs, not by retraining. The cutoff is a moving wall you never catch up to.",
      },
      {
        id: 'none',
        label: 'None of them — all three are gaps a cutoff change cannot close',
        verdict: 'on-it',
        feedback:
          "Right. (a) is a private-gap problem: Acme's refund policy was never in training, cutoff or not. (b) is too recent for any cutoff. (c) is the institutional gap — an unwritten convention living in reps' heads that no model could have seen. The cutoff is the one gap your exec can see, and the least of your problems.",
      },
      {
        id: 'a',
        label: 'Ticket (a) — the refund window changed last quarter',
        verdict: 'miss',
        feedback:
          "Plausible, because the change is dated and 'last quarter' sounds like it could fall inside a newer cutoff. But Acme's internal refund policy was never in the training corpus at any cutoff — it's behind a firewall. Newer weights don't import your private data; retrieval does.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: what kind of gap is ticket (c)?',
      tell: "If the rationale says 'the model just needs more recent data,' the learner is still collapsing every gap into the temporal one. Ticket (c) is the institutional gap — tacit knowledge nobody wrote down — and no amount of data, recent or not, fixes it until someone writes the rule.",
    },
    reveal: {
      consequence:
        "You greenlight the model upgrade as the fix. It ships. All three tickets stay open — plus you've now spent a release cycle and a vendor bill on the one lever that addressed none of them. The refund-policy hallucination keeps approving refunds Acme would deny.",
      principle:
        'There are three knowledge gaps, not one. The temporal gap (cutoff) is visible and usually overstated. The private gap (your firewalled data) is where enterprise products actually break. The institutional gap (unwritten conventions) is the hardest of all. Updating the model only touches the first.',
      keep:
        'The cutoff is the gap you can see. The gaps that break the product are private (never in training) and institutional (never written down). Reach for retrieval and documentation, not a newer model.',
    },
  },

  // ── Lesson 2 · "What RAG is, and what it isn't." ──
  // Showdown — a confident eng lead conflates RAG with memory/learning.
  'lesson-2': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['technical-foundation', 'strategic-thinking'],
    stake:
      "In planning, your eng lead pitches a slick line: \"Once Helix has answered enough billing questions through RAG, it'll have learned our billing domain and we can lean on retrieval less over time — the system gets smarter the more it runs.\" The room nods. It sounds like a flywheel. Leadership likes flywheels.",
    commitPrompt:
      'Do you back this claim, push back, or amend it? Pick your position.',
    options: [
      {
        id: 'pushback',
        label: 'Push back — RAG never teaches the model anything; nothing is being learned',
        verdict: 'on-it',
        feedback:
          "Correct and the cleanest rebuttal. RAG hands the model documents at answer time and nothing more. Weights don't change. When the conversation ends, the model forgets. It will need retrieval exactly as much on query one-million as on query one. There is no flywheel here.",
      },
      {
        id: 'amend',
        label: 'Amend — the flywheel is real but it improves retrieval, not the model',
        verdict: 'directional',
        feedback:
          "You're on the right axis — you correctly reject 'the model learns.' Production logs CAN improve your eval set, chunking, and routing over time. But that's an operational flywheel on the retrieval half, not the model getting smarter, and it never lets you 'lean on retrieval less.' Good instinct, one step short of naming the actual error.",
      },
      {
        id: 'back',
        label: 'Back it — a maturing RAG system does internalize domain knowledge',
        verdict: 'miss',
        feedback:
          "This is the trap the whole lesson exists to disarm. Retrieval is not memory; it is attention. Nothing accumulates in the model. Back this and you'll promise leadership a declining retrieval dependence that never arrives — then spend next year explaining why retrieval costs didn't drop.",
      },
    ],
    rationale: {
      prompt: 'One sentence: what would actually have to change for the model to "learn" Acme billing?',
      tell: "If the answer is 'more RAG calls,' they've missed the mechanic. Teaching the model facts means fine-tuning (which doesn't reliably hold changing facts) — RAG changes context at runtime, full stop.",
    },
    reveal: {
      consequence:
        "You back the flywheel. The roadmap bakes in 'declining retrieval load' as a cost assumption for next year. It never materializes — retrieval load tracks query volume, flat. Worse, when Acme changes its refund policy, the 'learned' system is just as dependent on a fresh index as day one, because it learned nothing.",
      principle:
        'RAG is question-time knowledge injection. It changes what is in context at runtime; it does not change the model. Retrieval is attention, not memory. Conflating the two produces roadmaps built on a flywheel that does not exist.',
      keep:
        'RAG injects knowledge at answer time and the model forgets when the turn ends. It never learns your domain. If someone promises the system gets smarter from usage, they are describing fine-tuning, not RAG.',
    },
  },

  // ── Lesson 3 · "The three failure modes that kill RAG systems." ──
  // Diagnosis — bad answer looks like hallucination; it's actually assembly.
  'lesson-3': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['technical-foundation', 'execution'],
    stake:
      "Helix gave a wrong answer about the Premium cancellation window. You pull the trace. Manual retrieval for that query DOES surface the correct policy chunk — it's in the top 5. But when you log what actually entered the context window, the policy chunk isn't there: the window filled with eight verbose FAQ entries first and the policy chunk got truncated off the end. The answer the model gave is fluent, confident, and cites one of the FAQ entries instead.",
    commitPrompt:
      'Three failure modes: retrieval, assembly, generation. Which one is this — and where do you send the fix?',
    options: [
      {
        id: 'generation',
        label: 'Generation failure — the model ignored the policy and hallucinated from the FAQ',
        verdict: 'miss',
        feedback:
          "This is the obvious read and it's wrong. The model can't 'ignore' a chunk that never reached its context — and the trace shows the policy chunk was truncated before generation. Send a fix to the prompt or the model and you'll change nothing; the right text was never in the window. This is exactly the misdiagnosis the lesson warns kills RAG debugging.",
      },
      {
        id: 'assembly',
        label: 'Assembly failure — retrieval found it, but it got truncated out of context',
        verdict: 'on-it',
        feedback:
          "Right. Retrieval succeeded (chunk in top 5). Generation never got the chance to fail correctly because assembly dropped the chunk: the window filled with verbose FAQs and truncated the policy. The fix lives in assembly — ordering, dedup, reserving budget for the highest-relevance chunk — not in the prompt and not in the index.",
      },
      {
        id: 'retrieval',
        label: 'Retrieval failure — the right chunk didn\'t make it to the model',
        verdict: 'directional',
        feedback:
          "You correctly located the failure upstream of generation, which is the right instinct. But retrieval did its job — the chunk was in the top 5. The breakage is one stage later, in assembly, where the chunk was truncated. Right neighborhood, wrong house: the diagnostic test (does the chunk appear in top-20 retrieval?) passes here.",
      },
    ],
    rationale: {
      prompt: 'One sentence: what single log line proved this was NOT a retrieval failure?',
      tell: "If they can't point to 'the chunk appeared in the top 5 on manual retrieval,' they reasoned from the bad answer backward instead of from the trace. The whole method is: retrieve manually, log what entered context, isolate the chunk and re-ask. Each step rules out one mode.",
    },
    reveal: {
      consequence:
        "If you'd called it generation, you'd have rewritten the prompt, maybe swapped models — burning a sprint while the truncation kept silently dropping the one chunk that mattered. Because you called assembly, the fix is a day: cap FAQ verbosity, reserve context budget for top-ranked policy chunks, reorder so must-have content survives truncation.",
      principle:
        'A RAG failure has three independent modes mapping to three pipeline phases. Run the three-part diagnosis before touching anything: Which chunks were retrieved? Were the right ones in context? Did the model use them? A fluent wrong answer feels like hallucination but is usually retrieval or assembly.',
      keep:
        "Don't trust the answer's vibe to name the failure. Retrieve manually, log what entered context, then isolate the chunk and re-ask. Most 'hallucinations' are assembly or retrieval wearing a confident voice.",
    },
  },

  // ── Lesson 4 · "Chunking: the decision nobody takes seriously enough." ──
  // Lever — chunk size; every setting buys one thing and costs another.
  'lesson-4': {
    type: 'Lever',
    kind: 'choice',
    dimensions: ['technical-foundation', 'product-craft'],
    stake:
      "You're setting chunk size for Helix's step-by-step troubleshooting guides. Each guide is one article with numbered steps; a correct answer almost always needs the step PLUS the warning callout that follows it. Your current fixed-size setting is 200 tokens, which often splits a step from its warning. You can move the knob. Engineering wants a number today — the index rebuild is queued.",
    commitPrompt:
      'Pick the chunk-size move you ship. Each one buys something and costs something — name what yours costs.',
    options: [
      {
        id: 'structural',
        label: 'Switch to structural chunking — one chunk per step-with-its-callout, variable size',
        verdict: 'on-it',
        feedback:
          "This is the lesson's actual answer for structured help-center content: let document structure set the boundaries so the step and its warning stay together. Cost: variable chunk sizes and more ingestion logic, and you still need an edge-case rule for steps that blow past your token target. But it solves the split that was breaking answers.",
      },
      {
        id: 'bigger',
        label: 'Bump fixed size to 800 tokens so a step and its callout fit in one chunk',
        verdict: 'directional',
        feedback:
          "Right direction — bigger chunks reduce split-step failures — but you bought it with a real cost the reveal will charge you: a 800-token chunk embeds a blurrier average meaning, so retrieval precision drops and the model sees more irrelevant text per relevant step. You fixed splitting by trading away retrieval sharpness. Fixed-size is still fighting the document's structure.",
      },
      {
        id: 'overlap',
        label: 'Keep 200 tokens, add 50-token overlap to catch the split',
        verdict: 'miss',
        feedback:
          "Tempting because overlap is the cheap, no-rebuild-philosophy fix. But 50 tokens of carry-over won't reliably span a step-to-callout boundary that can be longer than the overlap, and you've added redundant text to every chunk for a partial fix. Overlap reduces split-sentence risk; it doesn't make structure-spanning content retrievable as a unit.",
      },
    ],
    reveal: {
      consequence:
        "Ship structural and the troubleshooting answers start including the warning that was getting dropped — the failure mode disappears for most guides. Ship the 800-token bump and split-step failures fall, but precision@3 quietly sags as fatter chunks dilute the match, and you'll be back debugging 'why did it retrieve the wrong step' in a month.",
      principle:
        "There is no universally right chunk size — only the right one for your documents and query distribution. Chunk boundaries determine what can be retrieved together. For structured content, structure should set the boundary; bigger-fixed buys coherence at the cost of retrieval precision.",
      keep:
        'Chunking is the hardest decision to reverse — your whole index rides on it. Bigger chunks buy coherence and cost precision; structure-aware chunks buy both but cost ingestion complexity. Pick for your document shape, not for convenience.',
    },
  },

  // ── Lesson 5 · "Dense, sparse, and hybrid retrieval: when each wins." ──
  // Prediction — dense-only fails on the exact-match query; predict the recall.
  'lesson-5': {
    type: 'Prediction',
    kind: 'predict-number',
    dimensions: ['technical-foundation', 'product-taste'],
    stake:
      "Helix runs dense (embedding) retrieval only — clean, semantic, handles paraphrasing beautifully. You're told 100 real customer queries reference an exact policy code like 'Section 420' or a SKU like 'PLAN-ENT-04' — strings that appear verbatim in exactly one document and nowhere else. Dense retrieval has to surface that one exact-match document in the top results.",
    commitPrompt:
      'Of those 100 exact-identifier queries, how many will dense-only retrieval put the correct document in the top 5?',
    min: 0,
    max: 100,
    step: 5,
    unit: ' / 100',
    actual: 55,
    band: [40, 70],
    result:
      "Dense-only lands the right document in the top 5 on roughly half of exact-identifier queries — and the misses are brutal: the embedding treats 'Section 420' as semantically close to 'Section 419' and 'Section 421', and a SKU as a fuzzy token, so it ranks plausible-but-wrong neighbors above the exact match. The cases where the user typed a precise code are exactly the cases dense retrieval blurs.",
    reveal: {
      consequence:
        "If you predicted 85+, you trusted dense retrieval on its weakest query class. In production that's a steady stream of confidently-wrong answers about adjacent policy sections — the kind support escalates angrily. The fix isn't a better embedding model; it's adding sparse (BM25) and fusing with RRF so the exact string match wins when it should.",
      principle:
        "Sparse finds exact text; dense finds meaning; they fail on opposite query classes. An exact identifier is dense retrieval's blind spot — no amount of semantic understanding beats an exact keyword match, and it may rank semantically-similar-but-wrong sections higher. If your corpus has codes, SKUs, or section numbers, start hybrid.",
    keep:
        'Dense retrieval blurs exactly what must match exactly. Codes, SKUs, section numbers → add sparse and fuse with RRF. The tell that you need hybrid is any identifier a user might type verbatim.',
    },
  },

  // ── Lesson 6 · "When to add a reranking layer." ──
  // Diagnosis — reranker is tempting but recall is the actual bottleneck.
  'lesson-6': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['technical-foundation', 'execution'],
    stake:
      "Helix answers are mediocre and an eng lead wants budget for a Cohere reranker — 'retrieve broadly, rank precisely, it's the standard fix.' Before approving, you pull the retrieval eval. Two numbers: recall@50 is 0.58 (the correct chunk is in the top 50 only 58% of the time), and for the queries where it IS in the top 50, precision@5 is 0.45 (it rarely surfaces in the top 5).",
    commitPrompt:
      'Reranker now, or not yet? Commit to the call the eval supports.',
    options: [
      {
        id: 'not-yet',
        label: 'Not yet — recall@50 is too low; fix retrieval before adding a reranker',
        verdict: 'on-it',
        feedback:
          "Correct, and it takes reading the right number. A reranker only reorders what retrieval already found — it cannot rescue the 42% of correct chunks that never make it into the top 50. With recall@50 at 0.58, a reranker raises precision on the minority of queries that had the chunk and does nothing for the rest. Fix recall first (hybrid, better embedding, chunking), then rerank.",
      },
      {
        id: 'rerank',
        label: 'Approve the reranker — precision@5 of 0.45 is exactly what reranking fixes',
        verdict: 'miss',
        feedback:
          "The 0.45 precision is real bait — reranking does improve precision@5. But you're optimizing the second stage while the first stage leaks 42% of correct chunks entirely. You'll spend the budget, watch precision improve on the queries that already had the answer, and the overall quality barely moves because nearly half of queries never had the chunk to rank.",
      },
      {
        id: 'both',
        label: 'Approve the reranker AND fund retrieval work in parallel',
        verdict: 'directional',
        feedback:
          "Sequencing-wise your heart's in the right place, but you've inverted the order of operations and doubled the spend. The reranker delivers almost nothing until recall@50 is healthy — there's no point ranking a candidate set that's missing the answer 42% of the time. Fix recall, re-measure, then decide if precision@5 still needs a reranker.",
      },
    ],
    rationale: {
      prompt: 'One sentence: what is the single number that decides whether a reranker can help at all?',
      tell: "If they cite precision@5, they're treating the symptom; the gating number is recall at the retrieve-broadly k. A reranker is a precision tool that assumes recall is already solved.",
    },
    reveal: {
      consequence:
        "Approve the reranker on these numbers and you ship a 50–200ms latency hit plus a vendor bill for a 13-point precision bump on barely half your queries — overall answer quality moves a few points. Fix recall first and the same reranker, applied later, lands on a candidate set that actually contains the answer, and the gains compound.",
      principle:
        "Retrieval is a recall problem; ranking is a precision problem. A reranker improves precision at low k but cannot rescue chunks that weren't retrieved. If recall at high k is already bad, fix retrieval first — the reranker is the highest-leverage change only AFTER recall is solid.",
      keep:
        'A reranker can only reorder what retrieval found. Check recall@k before you buy precision. Low recall + a reranker = paying to sharpen a list that\'s missing the answer.',
    },
  },

  // ── Lesson 7 · "Evaluating retrieval quality separately from generation." ──
  // Diagnosis — one metric isolates the broken half. Pick the test.
  'lesson-7': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['technical-foundation', 'product-craft'],
    stake:
      "Helix's end-to-end answer quality dropped this week. You have a labeled eval set. You can run exactly ONE diagnostic before the standup to say which half of the pipeline broke. The candidate tests: (A) recall@20 on the retrieval output; (B) faithfulness on the final answers; (C) precision@3 on the retrieval output; (D) overall answer-quality rating from users.",
    commitPrompt:
      'You get one run. Which single test most cleanly isolates retrieval-vs-generation as the culprit?',
    options: [
      {
        id: 'recall',
        label: 'recall@20 on retrieval output',
        verdict: 'on-it',
        feedback:
          "Best single isolator. recall@20 asks: are the relevant chunks even being found? If it cratered, the right info isn't reaching the context and the problem is squarely retrieval — no generation theory needed. If recall@20 held steady, retrieval is doing its job and you pivot to assembly/generation. One number, clean fork.",
      },
      {
        id: 'faithfulness',
        label: 'faithfulness on the final answers',
        verdict: 'directional',
        feedback:
          "A genuinely useful metric, but as your SINGLE run it can't isolate the half. Low faithfulness happens both when the model hallucinates (generation) AND when retrieval fed it garbage so it had nothing to ground on. You'd learn 'something's wrong' without learning which half — the exact trap the lesson names.",
      },
      {
        id: 'precision',
        label: 'precision@3 on retrieval output',
        verdict: 'directional',
        feedback:
          "Right family — a retrieval-side metric, measured before generation, so it can implicate retrieval. But precision@3 can look fine while recall is the thing that collapsed (you're returning clean-but-incomplete sets), so as the one diagnostic it's a weaker fork than recall@20 for a sudden quality drop. Good instinct, second-best pick.",
      },
      {
        id: 'overall',
        label: 'overall user answer-quality rating',
        verdict: 'miss',
        feedback:
          "This is the metric you already have and it's why you're confused. Scoring the full pipeline at once tells you something is wrong and nothing about which half. Running it again just re-confirms the symptom. The entire point of the lesson is that this number can't be your diagnostic.",
      },
    ],
    rationale: {
      prompt: 'One sentence: why can a single end-to-end score never tell you which half broke?',
      tell: "If they say 'it can if it's low enough,' they've missed the structural point: retrieval and generation failures both depress the end-to-end score, so it's non-identifiable by construction. You need a metric computed on retrieval output alone.",
    },
    reveal: {
      consequence:
        "Pick the end-to-end rating and you walk into standup with 'quality is down, investigating' — and burn the week guessing. Pick recall@20 and you walk in with 'retrieval recall fell from 0.90 to 0.61 after Tuesday's index rebuild; generation is fine' — a named cause and a scoped fix in one number.",
      principle:
        'Score retrieval and generation with separate suites, on separate outputs. Retrieval metrics (recall@k, precision@k, MRR) run on retrieval output before generation; generation metrics (faithfulness, answer relevance) run on the answer. An end-to-end score is non-identifiable — it can\'t name the broken half.',
      keep:
        "If you score the whole pipeline at once, you'll know something broke and never which half. Keep one retrieval-only metric (recall@k) you can run on demand — it forks the investigation in a single number.",
    },
  },

  // ── Lesson 8 · "Embedding models: what makes one better for your use case." ──
  // Showdown — vendor cites MTEB rank as proof of fit.
  'lesson-8': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['technical-foundation', 'strategic-thinking'],
    stake:
      "An embedding vendor is in the room: \"Our model is #2 on MTEB this quarter — three spots above what Helix runs today. Swap it in and your retrieval quality goes up, guaranteed. Here's the leaderboard.\" The numbers are real. The Helix corpus is Acme's analytics help center: dense with product-specific jargon, abbreviations, and a house style that looks nothing like web crawl.",
    commitPrompt:
      'The vendor wants a yes on the leaderboard. What\'s your position and one-sentence rebuttal?',
    options: [
      {
        id: 'eval',
        label: 'No commitment — shortlist it, then eval on the Acme corpus before deciding',
        verdict: 'on-it',
        feedback:
          "Right call. MTEB is a prior, not an oracle — it measures benchmark datasets that don't share Acme's domain, document structure, or query distribution. The #2 model might lose to a domain-adapted #20 on YOUR precision@3. The move is: use MTEB to shortlist 3–5, then trust your eval set over the leaderboard.",
      },
      {
        id: 'swap',
        label: 'Approve the swap — a three-rank jump on MTEB is a real, measurable upgrade',
        verdict: 'miss',
        feedback:
          "The 'numbers are real' framing is the whole trap. MTEB rank measures generic benchmark performance; the delta on YOUR corpus is often larger AND in a different direction. The lesson's Helix example: a smaller domain-adapted model beat the MTEB top-10 by 11 points on precision@3. Swap on rank alone and you might ship the worse model with high confidence.",
      },
      {
        id: 'reject',
        label: 'Reject it — leaderboard models are trained on web data and never fit enterprise corpora',
        verdict: 'directional',
        feedback:
          "You reached the right action (don't swap on the leaderboard) via an overclaim. 'Never fit enterprise corpora' is too strong — sometimes the MTEB leader does win on your data. The disciplined position isn't 'reject,' it's 'eval': you don't know until you measure on the Acme set, and refusing to measure is as unscientific as trusting the rank.",
      },
    ],
    rationale: {
      prompt: 'One sentence: what would you need to see before saying yes to the swap?',
      tell: "If the answer is 'a higher MTEB rank,' they're still trusting the leaderboard. The only thing that licenses a yes is better retrieval metrics on the Acme eval set at acceptable cost and latency.",
    },
    reveal: {
      consequence:
        "Say yes on the leaderboard and you rebuild the entire index on the new model — an expensive, hard-to-reverse migration — only to discover on production traffic that the domain-blurred jargon tanked precision@3. Run the eval first and you spend a day measuring before a decision you can't easily walk back.",
      principle:
        "The MTEB leaderboard is a prior, not an oracle. It scores benchmark data; your eval set scores your data, and the delta between them is often larger and in a different direction. Embedding choice is the most load-bearing component in the pipeline — decide it on your corpus, not a rank.",
      keep:
        'MTEB tells you which model wins on benchmark data. Your eval set tells you which wins on your data. Run both; trust yours more. Never swap the embedding model on a leaderboard rank alone.',
    },
  },

  // ── Lesson 9 · "Index freshness and the stale knowledge problem." ──
  // Prediction — predict how many monitoring signals fire on a stale-policy answer.
  'lesson-9': {
    type: 'Prediction',
    kind: 'predict-number',
    dimensions: ['technical-foundation', 'product-craft'],
    stake:
      "Acme updated its refund policy three months ago, but the article's old chunks are still in Helix's index — the re-ingestion silently failed. A customer asks about refunds; Helix confidently cites the OLD policy. Your dashboard has the usual checks running: uptime, retrieval-rate, confidence score, and an LLM-as-judge faithfulness check on the answer.",
    commitPrompt:
      'Of those four standard monitoring signals, how many will flag this stale-policy answer as a problem?',
    min: 0,
    max: 4,
    step: 1,
    unit: ' of 4',
    actual: 0,
    band: [0, 1],
    result:
      "Zero fire. The pipeline ran (uptime green). A chunk was retrieved above threshold (retrieval-rate green). The model grounded its answer faithfully in the retrieved chunk — the stale one — so faithfulness scores HIGH, not low. And confidence is high precisely because the chunk matched cleanly. Every signal says healthy. The answer is wrong.",
    reveal: {
      consequence:
        "If you predicted 2+, you assumed faithfulness would catch it — but faithfulness checks grounding, not freshness, and the answer IS faithfully grounded in a stale document. No alert fires, users follow outdated guidance, and you find out from an escalation, not a dashboard. Stale retrieval is invisible to every signal you were watching.",
      principle:
        'Stale retrieval flips from enhancer to liability silently because nothing in the standard pipeline looks broken — confidence is high, faithfulness is high, retrieval succeeds. The only thing that catches it is a freshness signal you have to add deliberately: log each chunk\'s last-ingested timestamp and alert when too many retrieved chunks exceed your staleness threshold.',
      keep:
        'Faithfulness checks grounding, not truth — a confidently-cited stale chunk scores perfectly. Log last-ingested timestamps and alert on staleness, or this failure mode never trips a single alarm.',
    },
  },

  // ── Lesson 10 · "Query drift: when users ask what your index wasn't built for." ──
  // Diagnosis — good-in-test/bad-in-prod looks like a retrieval-quality bug; it's coverage drift.
  'lesson-10': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['product-craft', 'execution'],
    stake:
      "Helix scored great on your eval set but support satisfaction is sliding in production. You dig in: the zero-hit rate (queries returning no chunk above threshold) has climbed from 3% to 19% over six weeks. Clustering the production queries shows a fast-growing new cluster — customers asking about 'Acme Connect,' an integration product that launched last month. Your eval set, written before launch, contains zero Connect queries.",
    commitPrompt:
      'Engineering can spend the sprint on ONE thing. Which is the actual fix here?',
    options: [
      {
        id: 'content',
        label: 'Add Connect documentation to the index — this is coverage drift, not a retrieval bug',
        verdict: 'on-it',
        feedback:
          "Right read. A 3%→19% zero-hit climb plus a growing new-topic cluster is the signature of coverage drift: users are asking about content your index simply doesn't contain. No retrieval tuning surfaces a chunk that isn't there. The fix is new documents, then new eval queries so you can see it next time.",
      },
      {
        id: 'rerank',
        label: 'Tune retrieval — better embeddings or a reranker to lift the failing queries',
        verdict: 'miss',
        feedback:
          "The classic misdiagnosis. 'Good in test, bad in prod' feels like a retrieval-quality problem, so you reach for the retrieval knobs. But the zero-hit rate is the tell: there's no chunk to rank or re-embed because Connect was never ingested. You'd spend the sprint sharpening retrieval over a topic that has zero coverage.",
      },
      {
        id: 'expand',
        label: 'Add query expansion — generate paraphrases so more queries find a match',
        verdict: 'directional',
        feedback:
          "Query expansion is a real tool — for the OTHER kind of drift (phrasing mismatch), where the content exists but is worded differently. Here the content doesn't exist at all, so expanding 'Acme Connect setup' into three phrasings still hits an index with zero Connect chunks. Right tool, wrong drift.",
      },
    ],
    rationale: {
      prompt: 'One sentence: which single metric told you this was coverage drift and not phrasing drift?',
      tell: "If they cite the satisfaction drop, that's the symptom, not the diagnostic. The discriminating signal is the rising zero-hit rate plus a new query cluster — phrasing drift would show low relevance scores on chunks that DO get retrieved, not zero hits.",
    },
    reveal: {
      consequence:
        "Tune retrieval and you'll watch the zero-hit rate stay at 19% while the sprint evaporates — the index still has no Connect content to find. Add the docs and the cluster's queries start resolving immediately; add Connect queries to the eval set and you've also closed the gap between your curated test distribution and the discovered production one.",
      principle:
        'Good in testing + poor in production almost always means your test queries don\'t match real ones. Coverage drift (new topics absent from the index) shows as a rising zero-hit rate and new query clusters — and the fix is new documents, not better retrieval. Test distributions are curated; production distributions are discovered.',
      keep:
        'A rising zero-hit rate means users want content your index doesn\'t have — buy documents, not retrieval tuning. Cluster production queries on a cadence so you discover the gap before satisfaction tells you.',
    },
  },

  // ── Lesson 11 · "The RAG monitoring stack every PM should know exists." ──
  // Ranking — order the four signals by how early they'd catch a silent degradation.
  'lesson-11': {
    type: 'Ranking',
    kind: 'rank',
    dimensions: ['product-craft', 'strategic-thinking'],
    stake:
      "Helix ships Monday with zero production monitoring and you can instrument the four signals only one at a time over the first four weeks. The failure you most fear: retrieval degrades SILENTLY — the right chunks still appear, but lower in the ranking with weaker scores, so answers slowly get worse without anything 'breaking.' You want the signals ordered so the earliest-instrumented one is the most likely to catch that specific creeping failure first.",
    commitPrompt:
      'Order the four signals top-to-bottom by how early each catches a SILENT retrieval degradation (instrument the top one first).',
    items: [
      { id: 'relevance', label: 'Retrieval relevance score (avg similarity of top-k chunks)' },
      { id: 'faithfulness', label: 'Faithfulness score (claims grounded in retrieved context)' },
      { id: 'rate', label: 'Retrieval rate (fraction of queries with a chunk above threshold)' },
      { id: 'calibration', label: 'Confidence calibration (stated confidence vs actual faithfulness)' },
    ],
    correctOrder: ['relevance', 'rate', 'faithfulness', 'calibration'],
    rationale:
      "For a SILENT degradation, relevance score moves first: the chunks are still above threshold (so retrieval rate looks fine) but their average similarity is sliding — that's the literal definition of silent decay, and only the relevance signal sees it. Retrieval rate catches the same problem later, once degradation is bad enough to push chunks below threshold. Faithfulness catches it later still, only once weak retrieval reaches generation and the model starts ungrounding. Confidence calibration is last — it's a second-order check that only flickers once the damage is already showing up downstream. Invert relevance and rate and you'd ship blind to exactly the creeping failure you said you feared most.",
    reveal: {
      consequence:
        "If you instrumented retrieval rate first, you'd have felt safe for weeks — rate stays green while chunks are still clearing threshold — and only noticed once degradation got bad enough to drop hits, by which point answers were already visibly worse. Leading with relevance score means you see the average sliding before any chunk falls off the cliff.",
      principle:
        'The four signals catch overlapping failures at different lead times. For silent degradation specifically, retrieval relevance score is the earliest tripwire — a falling average WITHOUT a falling retrieval rate is the definition of silent decay. Rate, faithfulness, and calibration each catch it later and more bluntly.',
      keep:
        'A falling relevance score with a steady retrieval rate is silent degradation in progress. Relevance score is your earliest tripwire; retrieval rate only fires once chunks drop below threshold — too late.',
    },
  },

  // ── Lesson 12 · "When to move beyond RAG: fine-tuning, hybrid, or long context." ──
  // Prediction (predict-choice) — which approach wins for a specific corpus profile.
  'lesson-12': {
    type: 'Prediction',
    kind: 'predict-choice',
    dimensions: ['strategic-thinking', 'product-taste'],
    stake:
      "A sister team at Acme is building a copilot over the company's employee handbook: ~80 pages, revised maybe twice a year, and the most valuable answers require reasoning across several sections at once ('given the parental-leave policy AND the remote-work policy, what applies to me?'). They've defaulted to a full RAG stack — chunking, embeddings, vector DB — because that's what Helix uses. They ask you to predict which approach actually wins before they build.",
    commitPrompt:
      'For THIS corpus — small, stable, cross-section reasoning — which approach wins?',
    options: [
      {
        id: 'longcontext',
        label: 'Long context — put the whole handbook in the prompt, no retrieval',
        verdict: 'on-it',
        feedback:
          "Correct. Small (80 pages fits easily), stable (twice-yearly changes), and cross-section reasoning is the exact long-context profile: the model reasons over the ENTIRE corpus at once instead of a few retrieved chunks, which is what 'what applies to me given two policies' demands. Cost per query is higher; engineering cost and infra complexity are near zero. RAG would chunk away the very cross-section context they need.",
      },
      {
        id: 'rag',
        label: 'RAG — it works for Helix, and retrieval is the safe default',
        verdict: 'miss',
        feedback:
          "The 'works for Helix' reasoning is the trap. Helix uses RAG because of SPECIFIC corpus traits — 40k articles, updated continuously — none of which this handbook shares. For 80 stable pages needing cross-section reasoning, RAG adds infra complexity AND chunks apart the multi-policy context the answers depend on. Right tool for Helix, wrong tool here.",
      },
      {
        id: 'finetune',
        label: 'Fine-tuning — train the model on the handbook so it just knows the policies',
        verdict: 'miss',
        feedback:
          "Fine-tuning teaches style and format, not facts — and definitely not facts that get revised twice a year. You'd bake in policies that go stale at the next revision, with no citation trail for an HR-sensitive domain. Fine-tuning answers a different question entirely: how the model should sound, not what it should know.",
      },
    ],
    reveal: {
      consequence:
        "Default to RAG out of habit and the team spends weeks building a chunking-plus-vector pipeline for 80 pages — then discovers the cross-section questions retrieve fragments that lose the cross-section context, the one thing they needed. Long context would have shipped in days and reasoned over the whole handbook natively.",
      principle:
        "Knowing RAG's ceiling is its own skill. The decision rides on corpus size and change frequency: large + frequently-changing → RAG; small + stable → long context; need consistent style/format (not facts) → fine-tuning. Cross-corpus reasoning over a small stable set is long context's home turf, not RAG's.",
      keep:
        'RAG is not the default — it\'s the answer for large, frequently-changing corpora. Small + stable + needs whole-corpus reasoning → long context. Fine-tuning teaches style, never changing facts.',
    },
  },

  // ── Lesson 13 · "Retrieval is now a decision the system makes, not you." ──
  // Showdown — eng lead wants to force retrieval on every query "for safety."
  'lesson-13': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'technical-foundation'],
    stake:
      "You're moving Helix to an agentic setup where the agent decides its own retrieval per query. Your eng lead pushes back hard: \"Letting the agent skip retrieval is reckless. Force retrieval on every single query — it's the only way to guarantee grounded, citation-backed answers. Conditional retrieval is just a cost optimization that risks hallucination.\" It sounds like the safe, conservative choice.",
    commitPrompt:
      'Back the always-retrieve mandate, or push back? Pick your position and rebuttal.',
    options: [
      {
        id: 'pushback',
        label: 'Push back — forcing retrieval on every query injects noise and degrades easy answers',
        verdict: 'on-it',
        feedback:
          "Right. Retrieval isn't free safety — for a query the model already answers well ('what does RAG stand for?'), forced retrieval adds latency AND drops possibly-irrelevant chunks into context that can pull the answer off course. The agentic move is conditional retrieval: classify whether retrieval would improve the answer, then invoke it. Always-on isn't conservative; it's noisy.",
      },
      {
        id: 'amend',
        label: 'Amend — let the agent choose the strategy, but always retrieve something',
        verdict: 'directional',
        feedback:
          "You've accepted the agentic premise (good) but conceded the wrong half. Letting the agent pick retriever and top-k while mandating at-least-some retrieval still forces noise onto queries that need none, and still burns latency on simple factual lookups. The decision to retrieve AT ALL is itself part of the policy the agent should own.",
      },
      {
        id: 'back',
        label: 'Back the mandate — always retrieving is the conservative, hallucination-proof choice',
        verdict: 'miss',
        feedback:
          "This feels safe and is the most common wrong instinct. Retrieval can CAUSE the failure it's meant to prevent: irrelevant retrieved chunks become context the model may dutifully (and wrongly) ground on. 'Always retrieve' trades a hypothetical hallucination for guaranteed latency and a real noise-injection risk on every easy query.",
      },
    ],
    rationale: {
      prompt: 'One sentence: name one query class where forced retrieval makes the answer WORSE, not safer.',
      tell: "If they can't name a general-knowledge query the model already knows, they haven't internalized that retrieval has a cost and a downside — it's not a free safety blanket, it's a decision with a noise budget.",
    },
    reveal: {
      consequence:
        "Mandate always-retrieve and every trivial query eats a retrieval round-trip plus whatever marginally-related chunks come back — slower answers, and a new failure mode where the agent grounds a simple answer in an off-topic chunk. Conditional retrieval lets the agent skip retrieval when it wouldn't help, spending the latency and the context budget only where they earn their keep.",
      principle:
        'In agentic RAG, the first decision is whether to retrieve at all — that decision belongs to the policy, not to a blanket mandate. Forced retrieval wastes latency and injects noise on queries that don\'t need it. Conditional retrieval (classify, then retrieve) is the upgrade, not the risk.',
      keep:
        'Always-retrieve isn\'t conservative — it\'s noise plus latency on every easy query. Let the agent decide IF retrieval helps before deciding how. Retrieval has a downside, not just a benefit.',
    },
  },

  // ── Lesson 14 · "The retrieval-strategy decision: vector is no longer the default." ──
  // Showdown — exec assumes "knowledge base" = vector DB.
  'lesson-14': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'product-taste'],
    stake:
      "New scope for Helix: answer questions over Acme's usage data — 'how many seats are on the Enterprise plan in EMEA?', 'which accounts churned last quarter?'. This data lives in a Postgres warehouse with a known schema. An exec, fresh off a RAG conference, says: \"Great, embed it all into the vector DB and let Helix retrieve over it like everything else — one unified retrieval layer.\" The room is ready to greenlight the embedding job.",
    commitPrompt:
      'Greenlight the vector approach, or redirect? Pick your position and one-sentence reason.',
    options: [
      {
        id: 'sql',
        label: 'Redirect — this is structured data; use a SQL/structured-query tool, not vectors',
        verdict: 'on-it',
        feedback:
          "Right. When the 'knowledge base' is actually a database with a known schema, structured query is the answer — vector search can't do filtered lookups, aggregations, or 'count seats where plan=Enterprise and region=EMEA' reliably. Embedding rows turns precise numerical questions into fuzzy similarity matches. Vector is no longer the default; the query shape picks the retriever.",
      },
      {
        id: 'hybrid',
        label: 'Amend — embed it into the vector DB but add a SQL fallback for number questions',
        verdict: 'directional',
        feedback:
          "You correctly sense SQL belongs here, but you've kept the wrong primary. Embedding structured numerical data as a default with SQL as 'fallback' inverts it: nearly every question over this warehouse is an aggregation or filtered lookup that SQL should OWN, not backstop. The vector index for raw usage rows mostly produces confident-but-wrong counts.",
      },
      {
        id: 'vector',
        label: 'Greenlight — one unified vector layer keeps the architecture simple',
        verdict: 'miss',
        feedback:
          "The 'one retrieval layer' simplicity is exactly the reflex the lesson kills. Cosine similarity over embedded rows can't aggregate or filter numerically — ask 'how many seats in EMEA?' and you'll get the rows that sound most similar, not the correct count. Defaulting to vectors without thinking is how teams ship a knowledge base that can't answer its core questions.",
      },
    ],
    rationale: {
      prompt: 'One sentence: what can SQL do for these queries that vector retrieval structurally cannot?',
      tell: "If they don't mention aggregation/filtering on a known schema, they're treating SQL as just another retriever rather than the right structural tool — vector search has no COUNT, no GROUP BY, no exact WHERE.",
    },
    reveal: {
      consequence:
        "Greenlight the embedding job and you'll spend the budget vectorizing a warehouse, then watch Helix answer 'how many EMEA seats?' with a plausible number that's simply wrong — because it retrieved similar-looking rows instead of computing a count. A SQL tool answers it exactly, in one query, with no index to maintain.",
      principle:
        'Vector is no longer the default; "retrieval" now spans vector, sparse/grep, structured queries, and long context. If your knowledge base is a database with a schema, structured query is probably the right answer — not vector search. The retrieval-strategy decision matrix maps query types to strategies.',
      keep:
        'When the "knowledge base" is a database with a schema, reach for SQL, not embeddings. Vector search can\'t aggregate or filter numerically — it returns similar, never exact.',
    },
  },

  // ── Lesson 15 · "Evaluating systems that retrieve more than once." ──
  // Prediction — the fabricated-fact-#7 problem; predict what a one-shot eval misses.
  'lesson-15': {
    type: 'Prediction',
    kind: 'predict-number',
    dimensions: ['technical-foundation', 'execution'],
    stake:
      "Helix's agentic version does multi-hop retrieval. On a comparative question it generates an 8-claim answer across 3 retrieval hops. Seven claims are grounded in retrieved chunks; one — the single most decision-relevant claim — was fabricated from the model's prior because the chunk it needed was never retrieved in any hop. Your eval is a standard end-of-pipeline faithfulness check on the final answer.",
    commitPrompt:
      'Out of 100 production responses with this exact 1-in-8-fabricated pattern, how many will your end-of-pipeline faithfulness check flag as faithfulness failures?',
    min: 0,
    max: 100,
    step: 5,
    unit: ' / 100',
    actual: 0,
    band: [0, 15],
    result:
      "Effectively zero get flagged as failures. A 7/8 faithfulness score is 0.875 — comfortably above most faithfulness thresholds (the Helix target band sits around 0.92, and a single response of 0.875 reads as 'mostly fine' in aggregate). The one fabricated claim is averaged into a passing score, and the end-of-pipeline check has no way to point at WHICH hop failed to retrieve. The most important claim is the one that slipped.",
    reveal: {
      consequence:
        "If you predicted a high flag rate, you trusted aggregate faithfulness to surface a single fabricated claim — but averaging is exactly how it hides. The fabricated fact #7 ships, looks well-grounded, and may be the claim the user acts on. You only catch it with per-span checks and trace-level logging that show what each hop retrieved and why.",
      principle:
        'A one-shot, end-of-pipeline eval never catches the agent that fabricates fact #7 — the bad claim is averaged into a passing score and the score can\'t name which hop failed. Multi-hop systems need trace-level logging and per-span faithfulness: evaluate the decisions at each hop, not just the final outcome.',
      keep:
        'Aggregate faithfulness hides the one fabricated claim by averaging it away — and 7/8 looks fine. For multi-hop, log every hop and check faithfulness per span, or the most important wrong fact ships clean.',
    },
  },

  // ── Lesson 16 · "The new cost levers: caching and adaptive routing." ──
  // Ranking — order cost levers by impact for a help-center traffic profile.
  'lesson-16': {
    type: 'Ranking',
    dimensions: ['strategic-thinking', 'execution'],
    kind: 'rank',
    stake:
      "Helix's bill is spiking and you can roll out cost levers one at a time. The traffic profile (week-4 production): ~34% of queries are near-duplicates of high-frequency questions, ~12% are general-knowledge questions needing no Acme data at all, and the standard pipeline runs hybrid-retrieve + rerank on a long, stable system prompt for every query. Finance wants the biggest cost cut first.",
    commitPrompt:
      'Order these four levers top-to-bottom by cost impact for THIS traffic profile (roll out the top one first).',
    items: [
      { id: 'routing', label: 'Adaptive routing — classify queries; send model-only ones around retrieval entirely' },
      { id: 'semcache', label: 'Semantic cache — return cached results for queries similar to prior ones' },
      { id: 'promptcache', label: 'Prompt cache — cache the stable system-prompt prefix via the LLM provider' },
      { id: 'topk', label: 'Lower top-k — retrieve fewer candidates per query to cut retrieval/rerank cost' },
    ],
    correctOrder: ['routing', 'semcache', 'promptcache', 'topk'],
    rationale:
      "Adaptive routing is the biggest lever here because it eliminates whole pipeline stages: 12% of queries skip retrieval entirely (model-only) and the 34% near-duplicates route to cache — together that's nearly half of traffic taken off the expensive standard path, which is why routing drives the headline ~50% cut. Semantic cache is next: it captures that 34% recurring-question mass (and paraphrases of it), the single largest cacheable segment. Prompt cache is real but bounded — it only discounts the stable prefix tokens on the LLM call, a per-call savings, not a stage-elimination. Lowering top-k is last and riskiest: it trims marginal retrieval/rerank cost but directly threatens recall, so it can buy a small saving at the cost of answer quality — the one lever that can make the product worse. Promote top-k above routing and you'd squeeze pennies while degrading quality and leaving half your traffic on the full pipeline.",
    reveal: {
      consequence:
        "Lead with lowering top-k and you'd shave a little retrieval cost, risk recall on every query, and still route 100% of traffic through the full pipeline — the big spend untouched. Lead with adaptive routing and you pull ~46% of queries (model-only + cacheable) off the expensive path before touching anything else; that's where the ~50% reduction comes from.",
      principle:
        'The new cost levers are caching and adaptive routing — and routing is the heavyweight because it eliminates pipeline stages (some queries bypass retrieval entirely) rather than discounting tokens. Cache the stable tokens, route easy queries away from retrieval, and treat top-k cuts as a last resort that trades quality for cents.',
      keep:
        'Biggest cost cut = route easy queries off the pipeline entirely, then cache the recurring mass. Prompt cache is a token discount; lowering top-k is a quality risk dressed as a saving — do it last.',
    },
  },
}
