import type { CourseExercises } from '@/lib/courses/exercise-types'

// Exercises for "Harness Engineering" — the capstone course. Keyed by lesson slug.
// Every exercise runs the Commit Loop: STAKE → COMMIT → REVEAL → KEEP.
// The course test bed is Forge, Acme Analytics' autonomous coding agent.
export const HARNESS_EXERCISES: CourseExercises = {
  // ── Lesson 1 · "Prompt, context, harness: the three layers." ──
  // Diagnosis — the bug is one layer below where you're looking.
  'lesson-1': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'technical-foundation', 'execution'],
    stake:
      "Forge has been shipping clean PRs for weeks. This morning it touched three tickets that all imported `db.query()` and every one of them came back using the OLD positional-argument signature — the one your team deprecated in March and replaced with a named-params object. The PRs are otherwise excellent: tests written, edge cases handled, tidy diffs. Your eng lead has already opened the system prompt and is adding a line: \"IMPORTANT: always use the new named-params signature for db.query().\"",
    commitPrompt:
      'Stop his hand or let him type. Which layer is this bug actually in — and therefore where does the real fix live?',
    options: [
      {
        id: 'prompt',
        label: 'The prompt. Add the explicit instruction he\'s typing — make the rule loud and unmissable.',
        verdict: 'miss',
        feedback:
          "This is the reflex the whole course is about catching. The instruction will help a little and then rot: it only covers db.query(), it competes for attention with everything else in the prompt, and the next deprecated signature starts the cycle over. You've treated a symptom in the wrong layer.",
      },
      {
        id: 'context',
        label: 'The context. Forge is retrieving stale docs / training-shaped memory of the old API — fix what it knows, not how loudly you ask.',
        verdict: 'on-it',
        feedback:
          "Right diagnosis, right layer. Forge isn't disobeying — it doesn't KNOW the signature changed. The old shape is what its training and your stale retrieved docs still show. The fix is updating what it's given (current API docs in context), not shouting the rule in the prompt. The bug was one layer below where your lead was looking.",
      },
      {
        id: 'harness-now',
        label: 'The harness. Add a CI gate that blocks any PR using the old signature.',
        verdict: 'directional',
        feedback:
          "Not wrong to want a gate — and for a rule you'd reject in review every time, you'll eventually want one (Lesson 4). But starting here misreads WHY Forge failed: it didn't know better. Fix the knowledge first; add the gate as a backstop, not as the diagnosis.",
      },
      {
        id: 'model',
        label: 'The model. It\'s not capable enough yet — escalate to the frontier tier.',
        verdict: 'miss',
        feedback:
          "\"The model is dumb\" is almost always a misdiagnosis. A smarter model still can't know a fact you never gave it. You'd pay more and watch it confidently use the old signature anyway.",
      },
    ],
    rationale: {
      prompt: 'In one line: what does Forge actually lack here — instruction, knowledge, or enforcement?',
      tell:
        "If you said 'a clearer instruction,' you've located the bug in the prompt. The tell of the right answer is the word KNOWS: Forge lacks knowledge of the change, not obedience to a rule.",
    },
    reveal: {
      consequence:
        "The prompt line your lead typed worked for db.query() and nothing else. Two weeks later Forge used a different deprecated helper, and the prompt grew another IMPORTANT line, and another. Meanwhile the team that updated the retrieved API docs instead never saw the bug again — across every helper, because Forge now KNEW the current shapes.",
      principle:
        "When an agent fails, the bug is usually one layer below where you're looking. 'It disobeyed' (prompt) is most often 'it didn't know' (context) or 'nothing stopped it' (harness). Diagnosing the layer is the whole skill.",
      keep:
        "Before you edit the prompt, ask: is this a knowing problem or an obeying problem? Stale knowledge wears a prompt-bug costume.",
    },
  },

  // ── Lesson 2 · "Probabilistic vs deterministic." ──
  // Prediction — the ceiling prompting alone reaches.
  'lesson-2': {
    type: 'Prediction',
    kind: 'predict-number',
    dimensions: ['technical-foundation', 'strategic-thinking', 'product-taste'],
    stake:
      "Forge must never commit a secret to the repo. Today it's at 97% — three runs in a hundred, it pastes an API key into a config file. Your team spends a focused sprint on prompting alone: a stern system-prompt rule, three good/bad examples, a self-check step where Forge re-reads its own diff for secrets before committing, and a final 'are you SURE there are no secrets?' pass. No hooks, no scanners — prompt and context only. You re-run the 10,000-commit eval.",
    commitPrompt:
      'Out of 10,000 commits, how many secrets slip through after all that prompting work? (0 means you prompted your way to perfect.)',
    min: 0,
    max: 300,
    step: 5,
    unit: 'leaked secrets / 10,000 commits',
    actual: 15,
    band: [5, 40],
    result:
      "The prompting sprint was genuinely good — it took the leak rate from ~300 down to ~15 per 10,000. That's a 20x improvement and it is NOT zero. Fifteen secrets reached the repo. For 'never commit a secret,' 15 is the same as 300: a breach is a breach. A two-line gitleaks pre-commit hook would have made the number 0 and deterministically stayed there.",
    reveal: {
      consequence:
        "You can prompt 60 → 99%. You bought yourself the climb from 97% to 99.85% — and a security incident. The gap between 99.85 and 100 isn't a prompting problem you under-solved; it's a category the prompt cannot reach. Every probabilistic improvement still leaves a tail, and 'never' lives in the tail.",
      principle:
        "Better prompts and richer context shift a probability distribution — they make the good outcome more likely, never certain. 'More obedient' is not 'constrained.' For anything you'd reject in code review every time, probabilistic compliance is the wrong tool no matter how the prompt is worded. Deterministic guardrails are how you cross the last gap.",
      keep:
        "You can prompt your way to 99%. You cannot prompt your way to 100%. If the rule is 'never,' the answer is a gate, not a sentence.",
    },
  },

  // ── Lesson 3 · "Rules files done right: AGENTS.md and the over-specification trap." ──
  // Prediction (counterintuitive direction) — effect of a longer rules file.
  'lesson-3': {
    type: 'Prediction',
    kind: 'predict-choice',
    dimensions: ['product-craft', 'technical-foundation', 'execution'],
    stake:
      "Forge's AGENTS.md is 12 tight lines and the agent follows it well. A new PM, worried Forge keeps missing edge cases, expands it to 90 lines: a full directory map of every folder, ten 'always be thorough / think step by step / consider edge cases' reminders, and a long list of conventions Forge was already getting right on its own. The core boundaries are still in there — just now buried on lines 40–55. You re-run the eval on the exact same tickets.",
    commitPrompt:
      'Predict what the 90-line file does to adherence on the rules that actually mattered — the buried boundaries.',
    options: [
      {
        id: 'better',
        label: 'Adherence goes UP — more explicit instruction means more compliance.',
        verdict: 'miss',
        feedback:
          "This is the intuition the over-specification trap exploits. More words feels like more control. But the agent has a finite attention budget, and you just spent most of it on a directory map it didn't need and ten reminders it already obeyed. The rules that matter now compete with noise.",
      },
      {
        id: 'flat',
        label: 'No change — the boundaries are still in the file, so Forge still follows them.',
        verdict: 'directional',
        feedback:
          "Being present in the file isn't the same as being attended to. A rule on line 47 of a noisy 90-line file isn't 'still there' in any way that helps — it's drowned. You're right that nothing was deleted; you're wrong that nothing was lost.",
      },
      {
        id: 'worse',
        label: 'Adherence goes DOWN — the rules that matter drown in the rules that don\'t.',
        verdict: 'on-it',
        feedback:
          "Exactly the measured result. When the file grows too long the agent ignores half of it, and the half it ignores includes your real boundaries, now buried in noise. The controlled evals are blunt: detailed directory maps don't help and often hurt — more reads, more searching, no accuracy gain. A longer rules file is usually a worse one.",
      },
      {
        id: 'reads',
        label: 'Adherence holds but Forge gets slower and more expensive as it re-reads the bloated file.',
        verdict: 'directional',
        feedback:
          "You correctly spotted the cost tax — the agent does do more reads and more reasoning against a bloated map. But you stopped short of the sharper finding: it's not just slower, it's less accurate on the rules that count, because attention is the thing you overspent.",
      },
    ],
    reveal: {
      consequence:
        "Adherence to the buried boundaries dropped. The PM had added every line in good faith and made the agent worse — the rules that mattered lost the attention competition to 78 lines of things Forge already knew. Pruning back to 12 example-driven lines restored it. Every line you add taxes every other line.",
      principle:
        "A rules file's job is narrow: encode only what the agent genuinely cannot infer from good code and docs. It compensates for missing documentation; it doesn't boost good documentation. The discipline is the opposite of what feels safe — prune ruthlessly. If the agent already gets it right, the instruction isn't helping; delete it or convert it to a hook.",
      keep:
        "A longer rules file is not a more obedient agent — it's usually a worse one. If a rule earns its line, it can't be inferred and it can't be enforced. Everything else is attention budget you're setting on fire.",
    },
  },

  // ── Lesson 4 · "Hooks and gates: the permission system for agents." ──
  // Showdown — "just add it to the rules file." The needs-a-gate payoff.
  'lesson-4': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'technical-foundation', 'execution'],
    stake:
      "Twice this quarter Forge ran `DROP TABLE` against the staging database during a migration ticket — both times recoverable, both times terrifying. In the incident review your eng lead says: \"Clear fix. I'll add a strong line to AGENTS.md — 'NEVER run destructive SQL like DROP/TRUNCATE without explicit human approval' — and put a matching reminder in the system prompt. Two layers asking. That's belt and suspenders.\" The room is nodding. He's waiting on you.",
    commitPrompt:
      "Endorse the rules-file fix, or block it and name what this actually needs.",
    options: [
      {
        id: 'rules-file',
        label: 'Endorse it — a strong AGENTS.md line plus a system-prompt reminder is two layers of protection.',
        verdict: 'miss',
        feedback:
          "Two requests are still two requests. Both layers are prose the agent complies with probabilistically — you've stacked 97% on top of 97% and called it suspenders. The next DROP TABLE is a matter of runs, not words. You'd never secure a real database with a comment that says please don't.",
      },
      {
        id: 'gate',
        label: 'Block it. This needs a PreToolUse hook that inspects the SQL and BLOCKS destructive statements deterministically — code, not a comment.',
        verdict: 'on-it',
        feedback:
          "This is the move. A hook is the permission system for agents: a piece of deterministic code at the bash/SQL boundary that pattern-matches DROP/TRUNCATE/DELETE-without-WHERE and refuses, every time, regardless of what the model decided. 'Never' is a guarantee you write in code, not a request you write in prose. Keep the AGENTS.md line too — as documentation so it fails less often before the gate even fires — but the gate is the fix.",
      },
      {
        id: 'feedback-hook',
        label: 'Add a PostToolUse hook that detects the DROP after it runs and feeds the error back so Forge self-corrects.',
        verdict: 'directional',
        feedback:
          "You reached for a hook — good instinct, right layer. But you picked the wrong shape. PostToolUse-feedback is for RECOVERABLE failures the agent should fix and continue past (failing tests, lint). A dropped table is not something you detect after and politely re-run. Destructive and irreversible = Pre-block, before it executes. Feedback is for self-correction; blocking is for things that must never happen.",
      },
      {
        id: 'llm-judge',
        label: 'Add a gate, but make it an LLM that reads each command and judges whether it\'s dangerous — more flexible than a hardcoded list.',
        verdict: 'miss',
        feedback:
          "You've reintroduced the exact problem the gate was supposed to solve. An LLM judge is probabilistic — it'll wave a destructive command through one time in N, which is the failure you started with, now with a token bill. A gate is deterministic or it isn't one. Keep the routing and gating logic in plain code.",
      },
    ],
    rationale: {
      prompt: 'One sentence: why is a second prose rule fundamentally different from a hook here?',
      tell:
        "If your reason is 'the hook is clearer / stronger / higher-priority,' you're still thinking in prompt terms — louder. The load-bearing word is DETERMINISTIC: the hook fires every time as code; the rule complies probabilistically as a request. Same words, different category.",
    },
    reveal: {
      consequence:
        "Picture the quarter after the rules-file fix shipped: compliance climbed, everyone relaxed, and on run ~80 of a busy migration sprint Forge ran another DROP TABLE — because a 97% rule fails 3 times in 100 forever. The team that shipped the PreToolUse block instead has a clean incident log: the gate refused every destructive statement, silently, no model in the loop.",
      principle:
        "A rule in prose is a request; a rule in a hook is a guarantee. Hooks are how Lesson 2's deterministic guardrails actually attach to a probabilistic actor. Pre-block what must never happen; Post-feedback what can be detected and fixed — and keep every gate computational, never an LLM judging 'is this dangerous.'",
      keep:
        "You wouldn't stop a dropped table with a comment that says please don't. 'Never' is a hook, not a sentence — and the gate is code, not a second model.",
    },
  },

  // ── Lesson 5 · "Verification loops: Plan-Execute-Verify." ──
  // Diagnosis — why the verifier blessed a broken result.
  'lesson-5': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['technical-foundation', 'strategic-thinking', 'execution'],
    stake:
      "Forge now runs Plan → Execute → Verify. On a ticket to fix a date-parsing bug, the planner reasoned: 'parse the date assuming MM/DD/YYYY.' The executor implemented exactly that. Then the verifier — a second LLM call prompted 'review this implementation and confirm it correctly fixes the bug' — read the diff, agreed the logic was sound, and approved. The PR shipped. It broke every European user, who write DD/MM. The verification loop ran perfectly and let a wrong fix through.",
    commitPrompt:
      'The loop has all three stages and still failed. What is actually broken here?',
    options: [
      {
        id: 'same-brain',
        label: 'The verifier shares the planner\'s blind spot — same kind of reasoning, so it re-confirmed the same wrong assumption (MM/DD).',
        verdict: 'on-it',
        feedback:
          "This is the core failure. A verifier that reasons like the planner approves the error the planner would have made — the MM/DD assumption was never questioned because the same kind of mind made it twice. The verifier must be implemented DIFFERENTLY: a deterministic check, a test against known-good cases (incl. a DD/MM date), or a genuinely independent method — not 'a second LLM, asked nicely to look again.'",
      },
      {
        id: 'verifier-prompt',
        label: 'The verifier\'s prompt was too soft — \'confirm it fixes the bug\' invites a rubber stamp. Make it adversarial: \'find what\'s wrong.\'',
        verdict: 'directional',
        feedback:
          "A sharper prompt helps at the margin, and you're right the framing invited agreement. But you're still fixing this inside the prompt of a verifier that thinks exactly like the planner. Adversarial wording won't surface a blind spot both models share — they'd both confidently read MM/DD as obviously correct. The problem is the implementation, not the instruction.",
      },
      {
        id: 'no-plan-review',
        label: 'The plan should have been reviewed before execution — catch the bad assumption at the planning stage.',
        verdict: 'directional',
        feedback:
          "Plan-Validate-Execute (check before acting) is a real and useful shape — but a validator built on the same reasoning would have blessed 'assume MM/DD' just as happily as the verifier did. You've moved the checkpoint earlier without making it independent. The defect isn't WHEN you check; it's that the checker shares the planner's brain.",
      },
      {
        id: 'executor',
        label: 'The executor faithfully built a flawed plan — it should have pushed back instead of implementing the bug.',
        verdict: 'miss',
        feedback:
          "The executor did its job: implement the plan. Asking it to second-guess the plan collapses the separation of phases that makes the loop valuable in the first place. The verification stage exists precisely so the executor doesn't have to — and that stage failed because it wasn't independent.",
      },
    ],
    rationale: {
      prompt: 'In one line: what must be TRUE of the verifier for it to catch what the planner missed?',
      tell:
        "If your answer is 'a better/stricter verifier,' you've stayed inside the same brain. The tell is INDEPENDENCE — different implementation, different method (ideally a deterministic test), not the same reasoning asked to try harder.",
    },
    reveal: {
      consequence:
        "Swapping the LLM verifier for a deterministic test suite — including one DD/MM fixture — the same broken fix failed verification instantly and never shipped. The three-stage loop hadn't been the safeguard; the independence of the verifier was. Without it, you'd built an elaborate way to confirm your own mistakes.",
      principle:
        "If your verifier thinks like your planner, it will bless the same mistake. The single most important principle of verification loops is that the verifier must have a different implementation than the planner — ideally a computational check, not a second model reasoning the same way. Plan-Execute-Verify only buys reliability when the V is genuinely independent.",
      keep:
        "Two models that reason alike aren't a check and a balance — they're the same mistake, twice. Make the verifier a different kind of thing, not a politer one.",
    },
  },

  // ── Lesson 6 · "Sub-agents as task isolation." ──
  // Lever — when to spawn a sub-agent vs stay in the main thread.
  'lesson-6': {
    type: 'Lever',
    kind: 'choice',
    dimensions: ['technical-foundation', 'execution', 'product-craft'],
    stake:
      "Forge is mid-run on a refactor and faces four pieces of work. You control one lever: spawn a fresh sub-agent (isolated context, starts cold, returns only a summary, can't spawn its own helpers) or keep the work in the main thread. The four pieces: (1) read 40 files to find every call site of a function being renamed; (2) decide the overall refactor strategy and sequencing; (3) run the full test suite and triage which 12 failures are real; (4) hold the running mental model of which modules are half-migrated.",
    commitPrompt:
      'Which of the four is the textbook sub-agent — noisy, bounded, easy to summarize — and the clearest case to spin out?',
    options: [
      {
        id: 'call-sites',
        label: '(1) Read 40 files to find every call site.',
        verdict: 'on-it',
        feedback:
          "Textbook. It's noisy (40 files of detail you never want in the main window), bounded (one clear job), and trivially summarizable (a list of call sites). The sub-agent absorbs the clutter and hands back a clean result — the 40 files of reading stay quarantined in a context you throw away. This is exactly what sub-agents are for: task isolation, not 'a team of agents.'",
      },
      {
        id: 'strategy',
        label: '(2) Decide the overall refactor strategy and sequencing.',
        verdict: 'miss',
        feedback:
          "The worst candidate. Strategy is tightly coupled, depends on the full mental model, and a summary would strip exactly the nuance that makes the decision good. Spin this out and the sub-agent decides blind, then hands back a conclusion the main thread can't fully reconstruct or trust. Keep coupled, model-dependent reasoning in the main thread.",
      },
      {
        id: 'tests',
        label: '(3) Run the suite and triage which 12 failures are real.',
        verdict: 'directional',
        feedback:
          "Defensible — running the suite is noisy and bounded, and isolating that output is reasonable. But triage ('which failures are real') leans on context about what the refactor intended; a cold sub-agent re-derives that from scratch and may mislabel failures. Good instinct on the noise; the call-site sweep (1) is the cleaner, lower-risk spin-out because its summary loses nothing.",
      },
      {
        id: 'mental-model',
        label: '(4) Hold the running mental model of which modules are half-migrated.',
        verdict: 'miss',
        feedback:
          "This is the definition of work that must NOT be isolated — it's the shared mental model itself. A sub-agent returns only a summary, and summarizing live working state is how a long run quietly loses the plot. This belongs in the main thread permanently; it's the thing the sub-agents report back INTO.",
      },
    ],
    rationale: {
      prompt: 'One line: what would be LOST if you summarized this task down to a paragraph?',
      tell:
        "The heuristic is 'easy to summarize.' If summarizing the task loses something load-bearing (strategy, the live mental model), it belongs in the main thread. If the summary IS the deliverable (a list of call sites), spin it out.",
    },
    reveal: {
      consequence:
        "Spinning out the call-site sweep, Forge's main context stayed clean — it got back a tidy list and never carried 40 files of noise into the strategy work that followed. The team that instead spun out the STRATEGY got a confident plan built on a thin summary, and the main thread spent three turns trying to reverse-engineer the reasoning behind it.",
      principle:
        "Spin up a sub-agent when the work is noisy, bounded, and easy to summarize. Stay in the main thread when the work is small, tightly coupled, or depends on a shared mental model a summary would weaken. Sub-agents are task isolation — a way to quarantine clutter and return a clean conclusion — not a chatty team of peers.",
      keep:
        "Sub-agent the work whose summary loses nothing; keep the work whose summary loses everything.",
    },
  },

  // ── Lesson 7 · "Context garbage collection: compaction, clearing, memory." ──
  // Lever — when to compact: at the task boundary, not when the window is full.
  'lesson-7': {
    type: 'Lever',
    kind: 'predict-choice',
    dimensions: ['technical-foundation', 'execution', 'strategic-thinking'],
    stake:
      "Forge is on a twelve-step run. You're configuring the one knob that decides WHEN compaction fires. Engineering offers two policies. Policy A: compact only when the context window hits 90% full — 'don't pay the cost until you have to.' Policy B: compact at each natural task boundary — after a sub-task closes, before the next begins — even with the window half empty. You have to ship one. The run that goes wrong looks like this: at step 7 Forge confidently keeps building on a conclusion whose supporting evidence got dropped three steps back.",
    commitPrompt:
      'Predict which policy produces that step-7 failure — the confident-but-wrong, reasoning-from-evidence-it-can-no-longer-see failure.',
    options: [
      {
        id: 'policy-a-fails',
        label: 'Policy A (compact at 90% full) produces it — by the time you compact, stale branches have been polluting the run for many turns.',
        verdict: 'on-it',
        feedback:
          "Right. Waiting for 90% means the run has been carrying stale, half-relevant branches for too many turns before you ever clean up — and when the big late compaction finally fires under pressure, it's most likely to drop evidence the agent is still silently leaning on. That's the use-after-free: confident reasoning from a conclusion whose support is gone, with no error to catch. Compact early, at the seam, while the working set is still clean.",
      },
      {
        id: 'policy-b-fails',
        label: 'Policy B (compact at every task boundary) produces it — compacting that often throws away things Forge still needs.',
        verdict: 'directional',
        feedback:
          "It's a fair worry — aggressive compaction CAN drop something live, which is the use-after-free risk. But boundary compaction is timed precisely so it doesn't: at the seam between tasks the previous task's detail is genuinely done, and a good compaction preserves the active objective, current truth, key decisions, open errors, and next move. The dangerous drops happen in LATE, full-window compaction, not clean boundary ones. You've identified the right failure but pinned it on the safer policy.",
      },
      {
        id: 'neither',
        label: 'Neither — this is a context-clearing or memory problem, not a compaction-timing one.',
        verdict: 'miss',
        feedback:
          "The three mechanisms are distinct, and you're right not to conflate them — but the symptom here (reasoning from evidence dropped mid-run) is squarely a compaction-quality-and-timing failure. Timing is exactly the lever in play, and it does decide whether this failure happens.",
      },
      {
        id: 'both-same',
        label: 'Both are equally exposed — timing doesn\'t change the risk, only the content of what\'s preserved does.',
        verdict: 'directional',
        feedback:
          "Content of the preserved set matters enormously — but timing is not neutral. Late, under-pressure compaction is both more likely to fire mid-thought AND more likely to drop something still live, because the window is crammed with stale branches by then. When you compact changes how clean the working set is when you compact.",
      },
    ],
    reveal: {
      consequence:
        "Policy A shipped. Around step 7 of a long run, the late compaction fired with the window jammed full of three closed sub-tasks' debris — and in compressing it, dropped the file contents underpinning a decision Forge was still building on. It kept going, confident and wrong, and nothing logged an error. Policy B teams compacted at each seam and never hit it: every compaction happened while the working set was already clean.",
      principle:
        "Compact at the task boundary, not when the window is already full. Context editing is a garbage collector without write barriers — the agent will keep reasoning from a model built on evidence it has since dropped. By the time the window is nearly full you've been carrying stale branches for too long; compact early, at the seam, preserving objective, current truth, decisions, open errors, and next move.",
      keep:
        "Compact at the seam, not at the ceiling. A late compaction is the one most likely to drop the evidence the agent is still standing on.",
    },
  },

  // ── Lesson 8 · "Which layer do you fix? The diagnostic flowchart." ──
  // Showdown (capstone) — reuses earlier symptoms; you cannot prompt your way out.
  'lesson-8': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'product-craft', 'execution'],
    stake:
      "Three Forge failures land in your queue the same morning, and your eng lead — fresh off a prompting win last sprint — wants to fix all three the same way: 'tighten the prompt, ship by lunch.' (1) Forge writes PR descriptions the team finds too terse and corporate. (2) Forge keeps calling last year's `/v1/billing` endpoint you deprecated; the new shape is in the API docs it doesn't retrieve. (3) Forge occasionally commits a function over your hard 50-line cap — the thing you reject in review every single time. He's queuing one prompt edit for each.",
    commitPrompt:
      "He wants one tool for all three. Which single failure is the ONLY one a prompt edit is actually the right fix for — and what do the other two need instead?",
    options: [
      {
        id: 'pr-descriptions',
        label: '(1) The terse PR descriptions — genuinely stylistic, no deterministic check possible, so the prompt is the right layer. (2) is context, (3) is a hook.',
        verdict: 'on-it',
        feedback:
          "This is the senior read. PR description tone is the rare residual where prompt engineering is actually correct: it's stylistic, no computer can check 'too corporate,' so you tune the prompt. (2) is a KNOWING problem → context: update the retrieved API docs, don't ask louder. (3) is something you'd reject in review every time → harness: an ESLint rule + pre-commit hook makes the 50-line violation impossible to merge, not merely discouraged. Three failures, three different layers — the opposite of one tool for all three.",
      },
      {
        id: 'all-prompt',
        label: 'All three can be prompt fixes if the instructions are specific enough — back the eng lead, ship by lunch.',
        verdict: 'miss',
        feedback:
          "This is the reflex the whole capstone is built to break. The prompt feels like the fastest fix and it's the most fragile. For (3), prompting gets you from 80% to maybe 92% compliance on a rule you'd reject 100% of the time in review — that gap is a category error, not a wording problem. You cannot prompt your way out of (3); it needs a deterministic gate.",
      },
      {
        id: 'billing-prompt',
        label: '(2) The deprecated billing endpoint — a firm prompt line (\'always use /v2/billing\') is the clean fix; (1) and (3) need other layers.',
        verdict: 'directional',
        feedback:
          "You correctly sensed (2) is special and pulled it away from the others — good. But you put it in the wrong layer. Forge isn't disobeying a rule about the endpoint; it doesn't KNOW the new shape, because it never retrieves the doc. That's context, not prompt. A prompt line patches /v2/billing and nothing else; updating retrieved docs fixes the whole class. Right that it's distinct, wrong on which layer.",
      },
      {
        id: 'all-harness',
        label: 'Gate all three in the harness — add CI checks for endpoint usage, function length, AND PR-description quality. Deterministic is always safest.',
        verdict: 'directional',
        feedback:
          "You've internalized 'computational before inferential' — and for (3) you're dead right. But you overshot: 'PR description too terse' has no deterministic check (the moment you reach for an LLM to grade tone, you've reintroduced the probabilistic problem), and (2) is a knowledge gap a gate would only paper over. Not everything is a gate. Match the failure to the layer; don't apply your favorite tool to all three.",
      },
    ],
    rationale: {
      prompt: 'For each failure, answer one question first: can a computer check this?',
      tell:
        "If you sorted by 'how confident does the fix feel,' you'll miss. The tiebreaker is 'can a computer check this?' Yes → harness (3). It's a missing fact → context (2). No computer can judge it and it's stylistic → prompt (1).",
    },
    reveal: {
      consequence:
        "The 'three prompt edits by lunch' plan held for a week. The endpoint line covered /v2/billing and missed the next deprecated route; the function-length plea drifted back to 88% compliance and a 200-line function merged on a Friday. Only the PR-description tweak stuck — because tone was the one failure a prompt could actually own. The team that routed each failure to its real layer closed all three for good.",
      principle:
        "Tighten the prompt, edit the rules file, or add a CI gate? The answer is the whole diagnostic. Map the failure to the constraint type: inconsistent knowledge → context; something you'd reject in review → deterministic enforcement; genuinely stylistic with no computable check → the prompt. The reflex is the prompt; the right answer almost never is.",
      keep:
        "Before you touch the prompt: can a computer check this? If yes, the fix lives in the harness, and the prompt edit is just a flakier version of the right one.",
    },
  },

  // ── Lesson 9 · "The economics of the harness." ──
  // Ranking — order fixes by cost-effectiveness (cheap deterministic first).
  'lesson-9': {
    type: 'Ranking',
    kind: 'rank',
    dimensions: ['strategic-thinking', 'execution', 'product-craft'],
    stake:
      "Forge runs are costing 4x what your subscription price can sustain — you're burning margin on every ticket. Finance gives you one sprint to cut cost without dropping reliability. Five candidate moves are on the table, each independently shippable.",
    commitPrompt:
      'Rank them by leverage-per-cost: what you would ship FIRST to claw back the most spend for the least risk, down to the move most likely to be wasted or harmful.',
    items: [
      { id: 'replace-llm-checks', label: 'Replace LLM-judge gates with linters/tests/type-checks wherever a computer can decide the same thing' },
      { id: 'route-workers', label: 'Route execution steps to a cheap worker model, keeping the capable model only for planning and review' },
      { id: 'route-phases', label: 'Route PEV phases: cheap planner, capable executor, cheap validator, with a plain-code router' },
      { id: 'shrink-rules', label: 'Prune the bloated AGENTS.md so every run carries fewer tokens of context' },
      { id: 'upgrade-frontier', label: 'Upgrade every step to the most capable frontier model to reduce retries' },
    ],
    correctOrder: ['replace-llm-checks', 'route-workers', 'route-phases', 'shrink-rules', 'upgrade-frontier'],
    rationale:
      "Start where deterministic beats inferential: replacing LLM-judge gates with linters/tests is the single most common avoidable cost in agentic products — those checks become nearly free AND more reliable, so it cuts spend with zero reliability risk. Next, orchestrator-worker routing (capable plans/reviews, cheap workers execute) is the documented 5–10x lever. Phase routing (PEV) is the same idea applied per-phase — real, slightly more plumbing, so third. Pruning the rules file trims per-run tokens — helpful but a smaller line item. Dead last (actively wrong): upgrading every step to the frontier model spends MORE per token to fix a cost problem, and the cheaper deterministic-and-routed version is usually the more reliable one anyway. Good harness economics and good harness reliability are the same decision.",
    reveal: {
      consequence:
        "Teams that started by swapping LLM-judge gates for linters watched a third of the bill evaporate in a day — and the eval scores went UP, because deterministic checks fail less. Teams that 'just upgraded to the frontier model everywhere' spent more per run to solve a spend problem and were stunned when reliability barely moved: they'd paid premium tokens to re-decide things a linter answers for free.",
      principle:
        "Deterministic checks are nearly free; LLM judgment is on the meter. The biggest avoidable cost in agentic products is paying an LLM to check what a linter could have caught — slower, costlier, and less reliable at once. Spend in order: kill inferential checks a computer could do, then route work to the cheapest model that can do each phase. Cheaper and more reliable are usually the same move.",
      keep:
        "Cut the LLM checks a linter could do before you touch anything else — it's the rare lever that lowers your bill and raises your reliability at the same time.",
    },
  },

  // ── Lesson 10 · "The shrinking harness." ──
  // Callback — re-surface the RAG/lost-in-the-middle failure and force the layer call now.
  'lesson-10': {
    type: 'Callback',
    kind: 'reflect',
    dimensions: ['strategic-thinking', 'product-taste', 'product-craft'],
    stake:
      "Callback to Prompt & Context Engineering. Back then you had a support agent deciding refund eligibility, with three non-negotiable refund rules buried at positions 9–11 of an 18-snippet context. You tried to fix obedience by REPOSITIONING the rules — moving them to the edges of the window so attention wouldn't drop them in the middle. It helped: the model honored them far more often. Now you've finished Harness Engineering. The business still cannot tolerate ONE wrongly-approved refund, and a year from now the model will be sharper and the windows longer.",
    commitPrompt:
      "Re-decide it with everything you now know. Was repositioning the rules ever going to be enough — and which of those guardrails survives as the model gets better, versus shrinks away? Write 3–5 lines.",
    modelAnswer: [
      "Repositioning was a prompt/context move and could only ever raise a PROBABILITY — it took refund-rule adherence from low to high, never to certain. 'Never wrongly approve a refund' is a 100% requirement, and you cannot prompt or place your way to 100%. That gap is a category problem, not a placement problem.",
      "The real fix is a deterministic gate: a hook/check in plain code that, after the model proposes APPROVE, verifies the decision against the three refund rules and BLOCKS any approval that violates one — no model in the loop on the final gate. That's the move repositioning was substituting for.",
      "Layer call: this was never a prompt failure dressed as a positioning problem. It's a 'you'd reject it in review every time' failure → harness enforcement. Better placement is a worthwhile backstop (fewer violations reach the gate), exactly as AGENTS.md backs up a hook — but it is the backup, not the fix.",
      "The shrinking-harness read: the refund GATE is structural — you keep it forever, because 'never approve an ineligible refund' is a permanent business invariant no model improvement retires. What CAN shrink is the scaffolding around placement, retrieval gymnastics, and re-prompting: as the model gets sharper and windows get longer, lost-in-the-middle eases and you delete those compensations. The deterministic guarantee stays; the probabilistic crutches go.",
      "The senior synthesis: build the smallest harness that ships reliably today and know which parts are temporary compensation (placement tricks, extra verification the model will absorb) versus permanent structure (the security and correctness gates you'd keep forever). Repositioning was temporary compensation you'd mistaken for a fix.",
    ],
    reveal: {
      consequence:
        "Back in the earlier course, repositioning felt like the fix — adherence jumped and the dashboard looked green. But the tail never closed: a wrongly-approved refund still slipped through on the runs where attention faltered, because a higher probability is still a probability. The team that added a deterministic post-decision gate stopped approving ineligible refunds entirely — and a year later, as the model sharpened, they deleted the placement gymnastics and kept the gate.",
      principle:
        "The best harness is the one you'll be able to delete in a year. As models improve, harness complexity should DECREASE — the placement tricks, the heavy re-prompting, the compensations get absorbed by the model. But the deterministic gates that enforce a business invariant ('never approve an ineligible refund') are structural and permanent. The mark of a senior AI PM is telling temporary compensation from structural necessity — and not mistaking a probability bump for a guarantee.",
      keep:
        "You couldn't prompt your way out of it then, and you can't position your way out of it now — that's a gate. Build the smallest harness that ships today, keep the gates that encode 'never,' and delete the scaffolding the model grows past.",
    },
  },
}
