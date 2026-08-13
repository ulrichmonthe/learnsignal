import type { CourseExercises } from '@/lib/courses/exercise-types'

// Exercises for "Agent Orchestration", keyed by lesson slug.
// Scenarios 1–5 from Modules 3–7, authored as Commit-Loop choice exercises.
export const AO_EXERCISES: CourseExercises = {
  // ── Lesson 5 · Scenario 1 — "The demo works, the pipeline doesn't" ──
  // Diagnosis — the fix that's right depends on four numbers nobody measured.
  'lesson-5': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'technical-foundation'],
    stake:
      "You're three weeks from a renewal decision with your largest customer. Your team built an invoice-reconciliation agent — five steps: extract line items, match to purchase orders, resolve the customer account, flag discrepancies, draft the resolution email. It demoed beautifully: four clean runs in front of the customer's finance lead, who signed off to pilot on the spot. This morning, a support ticket. A resolution email went to the wrong customer, quoting a different customer's invoice totals. Your engineer traced it in twenty minutes: step 3 resolved the customer ID incorrectly, and steps 4 and 5 did exactly what they were built to do — took step 3's output as fact and produced a confident, correctly formatted, completely wrong email. Every step in the trace is green. Every step reported success. It has happened once in roughly forty runs since the pilot started. In Slack your engineer writes: \"Honestly it's a 2.5% error rate on one step. That's within tolerance for an LLM.\" That statement is true. It is also the wrong frame, and you have until Friday to work out why.",
    commitPrompt:
      "Pick one, then commit to the two sentences of reasoning you'd defend — it's the reasoning that gets compared later, not the choice.",
    options: [
      {
        id: 'a',
        label:
          'Add validation between stages — a deterministic check that the resolved customer ID exists and matches the invoice header before step 4 runs. Ships this week.',
        verdict: 'directional',
        feedback:
          "Ships Thursday and the wrong-customer failure stops dead. But six weeks later a different failure surfaces — step 2 mismatches a PO line, step 4 flags a discrepancy that doesn't exist — and the finance team, burned twice, starts hand-checking every flag. You patched one hole without knowing whether the other four stages were solid, and automated nothing.",
      },
      {
        id: 'b',
        label:
          'Collapse to one agent with five tools — remove the handoff surface entirely, one context, one place to reason. Two weeks.',
        verdict: 'directional',
        feedback:
          'Two weeks of work buys a genuine end-to-end accuracy gain. It also roughly doubles latency and adds about 40% per-run cost, because one agent now resends the full context on every tool call. More reliable, slower, pricier — an honest trade, but you made it before knowing whether the chain even needed it.',
      },
      {
        id: 'c',
        label:
          'Add a supervisor to oversee the chain — an overseer catches the inconsistency that steps 4 and 5 missed.',
        verdict: 'miss',
        feedback:
          'The supervisor catches around 60% of the bad IDs and adds four seconds — then times out most often on the long, complex invoices, exactly the ones most likely to be wrong, and the chain proceeds unsupervised. You added a component that works best when you need it least, plus a new cost centre and single point of failure, to solve what a database lookup solves for free.',
      },
      {
        id: 'd',
        label:
          'Instrument first — you know one stage’s error rate and are guessing at four. You cannot choose without the other four numbers. Costs you Friday.',
        verdict: 'on-it',
        feedback:
          "You miss Friday and tell the customer you're measuring before patching — which the finance lead calls the first sensible thing anyone's said about the system. A week later you have per-stage numbers and the right fix is obvious, cheap, and different from what you'd have picked on Monday. You refused to commit to a fix while blind to four of five error rates.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: what single number would change which fix is right — and do you have it?',
      tell: "If your two sentences name a fix but never a measurement, you committed while blind. The scenario turns on four stage-accuracies nobody has measured yet — and they decide whether A or B is even the right shape of answer.",
    },
    reveal: {
      consequence:
        "The correct fix changed depending on a number nobody had. If stages 1, 2, 4 and 5 run at 99.5% and only step 3 is weak, end-to-end is 95.6% and gating step 3 lifts it to 97.8% — option A wins. If all five stages are mediocre, gating step 3 moves end-to-end two points and option B wins. Same symptom, opposite fixes, separated only by a week of measurement. The cohort split A 41% · B 16% · C 31% · D 12% — C is the popular wrong answer, adding a supervisor and a new single point of failure to solve a data-validation problem a lookup handles for free.",
      principle:
        "In a sequential chain, end-to-end accuracy is the product of per-stage accuracy, not the average. Five stages at 95% is a 77% system, and at the 97.5% implied by “once in forty” a five-stage chain fails one run in eight — while every stage individually looks fine in review. The demo's four clean runs had a 60% chance of happening by luck.",
      keep:
        "A chain's reliability multiplies, it doesn't average — and you can't pick the fix until you've measured every stage. The demo wasn't evidence, it was a coin flip that landed your way.",
    },
  },

  // ── Lesson 6 · Scenario 2 — "The $19,000 week" ──
  // Diagnosis — the best answer isn't a pick, it's a sequence ordered by cost of change.
  'lesson-6': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'execution'],
    stake:
      "Your document-intelligence feature fans out: every user request triggers seven parallel calls — classify, extract entities, check policy, retrieve precedent, assess risk, draft, format. It's fast, users like it, and usage tripled in a fortnight. Finance flagged it on Monday. Last week's model spend was $18,900. The week before: $6,300. Usage up 3×, cost up 3×, precisely linear. The feature is not yet priced. Revenue attributable to it this week: zero. Two numbers nobody has connected to the invoice yet — 82% of requests reach a completed output, and of the ~9,000 input tokens per call, roughly 6,000 are an identical system prompt and policy document sent seven times per request. Runway is fourteen months.",
    commitPrompt:
      "Pick the one change you'd run first, then commit to why you'd defend it — and answer the question underneath: what is your cost per completed task, and what does it need to be?",
    options: [
      {
        id: 'a',
        label:
          'Model tiering — cheap model for classify, extract, format, dedupe; frontier model for policy, risk, draft. Two days.',
        verdict: 'directional',
        feedback:
          "Spend drops to $10,980 — a 42% cut in two days, an excellent return. Then completion falls from 82% to 74% as the cheap model's extraction misses edge cases, so cost per completed task only improves from $0.384 to $0.247. A real win, but a third of the headline saving evaporated into a number nobody was watching.",
      },
      {
        id: 'b',
        label:
          'Prompt caching — the 6k of shared context per call is a stable prefix. One day.',
        verdict: 'on-it',
        feedback:
          "One day of work, roughly $3,900 saved, zero quality change — the shared prefix is exactly stable, and fan-out is the best case for caching in the whole field: the same prefix, seven times, in the same second. The uncomfortable part isn't the saving, it's that this should have been done before launch. Cheapest change, no downside, so it goes first.",
      },
      {
        id: 'c',
        label:
          'Topology change — a cheap router decides which of the seven branches a request actually needs. Three weeks.',
        verdict: 'directional',
        feedback:
          'Three weeks cuts average branches from 7 to 3.2 and lands spend near $3,450 — the biggest win, arriving a quarter after it was needed. Two removed branches turn out to have carried quality nobody measured, and one comes back in month two. Right lever, wrong time to pull it first: instrument before you delete.',
      },
      {
        id: 'd',
        label:
          'Price it or gate it — the only option that touches the revenue side of the ratio. One week.',
        verdict: 'directional',
        feedback:
          "Usage drops 60%, spend drops 60% — you solved the cost problem by making the product smaller. Sometimes that's exactly right, but look at the retention graph before you decide it was, and note this is the only lever that touches revenue rather than cost.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: what is your cost per completed task right now, and what does it need to be?',
      tell: "If you picked a lever without those two numbers, you optimised toward a target you never set. It's $0.384 today, and your affordable ceiling falls out of price and tasks-per-user — which is how your power users quietly became your worst-margin users.",
    },
    reveal: {
      consequence:
        "None of these is exclusive, and the highest-scoring answer isn't a selection — it's a sequence ordered by cost of change: caching today, tiering this week, topology next month, pricing when there's data to price against. Cost per completed task is $0.384 here, and abandonment waste — the seven branches you pay for on requests nobody reads — is $3,402 a week, 18% of the bill and on no invoice. The cohort split A 44% · B 22% · C 21% · D 13%.",
      principle:
        "Cost per token is the vendor's unit; cost per completed task is yours — total spend divided by tasks that reached a useful output. Judge every optimisation against it, because a 42% token cut that costs eight points of completion is a far smaller win than the dashboard shows. Then pull the levers cheapest-first: caching, tiering, topology, pricing.",
      keep:
        "Optimise cost per completed task, not cost per token — and pull the levers in order of cost-of-change: caching first, pricing last.",
    },
  },

  // ── Lesson 7 · Scenario 3 — "Two engineers, two frameworks" ──
  // Diagnosis — the framework is reversible in days only if you own the state boundary.
  'lesson-7': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'execution'],
    stake:
      "Three weeks to a board demo. Two engineers, both good, both certain. Priya wants LangGraph — explicit graphs, durable state, checkpoints, the thing you can actually debug at 2am. She's shipped it before and estimates a week of setup before anything works end-to-end. Marcus wants CrewAI — he has a working three-agent prototype already, built on Saturday afternoon, and he's running it live in the meeting, and it works. Neither is wrong: Priya is optimising for the system in six months, Marcus for the demo in three weeks. Both have stopped working while they wait for you — which means the cost of not deciding is now higher than the cost of deciding badly.",
    commitPrompt:
      "Make the call, then commit to the second paragraph that separates PMs: what would make you reverse it.",
    options: [
      {
        id: 'a',
        label: 'LangGraph, eat the setup week.',
        verdict: 'directional',
        feedback:
          "Setup takes nine days, not five — it always does. The demo happens with two of four agents working, the board is unimpressed and asks a timelines question you answer badly. Six months later the system is genuinely solid and nobody remembers the demo — whether that was the right call depends entirely on whether there was still a company in six months.",
      },
      {
        id: 'b',
        label: 'CrewAI now, migrate later.',
        verdict: 'miss',
        feedback:
          'Great demo. Month four, a run fails halfway through customer onboarding with no checkpoint to resume from, restarts from the beginning and double-charges the customer. The two-week migration becomes seven, because six months of assumptions about state are now baked into the framework’s abstractions. You let the framework own the thing that makes migration a rewrite.',
      },
      {
        id: 'c',
        label:
          'Custom orchestration — roughly 28% of production multi-agent deployments run no framework at all.',
        verdict: 'directional',
        feedback:
          'Week one goes on message passing, retries and checkpointing — solved problems you’ve now solved again, slightly worse. It pays off in month eight when an audit requirement lands that no framework supports and you already have the hooks. Right call, wrong reason: you bought insurance before you knew you needed it.',
      },
      {
        id: 'd',
        label:
          'CrewAI for the demo, but the state boundary stays yours — the framework does orchestration; your own Postgres owns run state, step outputs and the audit trail.',
        verdict: 'on-it',
        feedback:
          'The demo ships on CrewAI, and in month five you swap to LangGraph in eleven days because the only thing that moved was orchestration — run state, traces and the audit log never lived in the framework. Migration cost is proportional to how much of your state the framework owns, and you kept the parts that make the product yours. Marcus and Priya each believe they won the argument.',
      },
    ],
    rationale: {
      prompt: 'In one sentence: which of your six kinds of state does the framework get to own, and which stay in your database?',
      tell: "If your reasoning is about which framework is better rather than where the state boundary sits, you're expressing a preference, not making a decision. Framework choice is reversible in days only when you own run state, step outputs, memory, artefacts and the audit log.",
    },
    reveal: {
      consequence:
        "Migration cost is proportional to how much of your state the framework owns. Keep run state, step outputs, long-term memory, artefacts and the audit log in your own database and a framework swap is eleven days — let the framework own them and it's a rewrite measured in quarters. The 28% running no framework are mostly teams that hit a state, observability or compliance wall, not ideologues, and their situation is your future one. The cohort split A 27% · B 24% · C 9% · D 40%.",
      principle:
        "A framework decision is only as reversible as your state boundary. An orchestrator must do four things a prototype doesn't — durable state, human-in-the-loop checkpointing, observability, and defined failure semantics — but the decision that binds you isn't which framework, it's who owns the six kinds of state.",
      keep:
        "Own your run state, memory and audit log; rent orchestration. Then the framework choice costs days to reverse, not quarters.",
    },
  },

  // ── Lesson 8 · Scenario 4 — "The swarm that agreed with itself" ──
  // Diagnosis — five agents agreed because they were never independent to begin with.
  'lesson-8': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'product-taste'],
    stake:
      "Your regulatory-summarisation product uses five peer agents that critique each other's drafts before output. Your engineer built it after reading a paper. Internal quality ratings rose 14% when it shipped and everyone was pleased. Last Tuesday it stated, in a client-facing summary, that a filing deadline had moved. It had not. The client rescheduled a team's work around it. You pull the trace: all five agents agreed, three explicitly endorsed the claim during critique, and the disagreement rate across 2,000 runs is 6% — which the team has been reading as evidence that the system works. There is no record of why the claim was made. The transcript shows agreement, not reasoning. Nobody can tell you which agent originated it.",
    commitPrompt:
      "Pick one, then commit to why you'd defend it — and answer the question the trace won't: why did five agents agree on something false?",
    options: [
      {
        id: 'a',
        label: 'Cap rounds and add a step budget.',
        verdict: 'miss',
        feedback:
          'Costs drop 30%. Six weeks later a similar false claim appears — reached faster, for less money. Capping rounds tunes the price of the failure, not its cause: the agents still share the same context and still agree on the same wrong thing.',
      },
      {
        id: 'b',
        label: 'Add an independent verifier that checks claims against source documents.',
        verdict: 'directional',
        feedback:
          "Ten days of work, and claims now carry a source or get dropped. Output volume falls 8% because some claims can't be sourced — which is the system finally working correctly, and takes a week to convince the team of. A real fix, but you changed the system before diagnosing why it failed.",
      },
      {
        id: 'c',
        label: 'Collapse to one agent plus retrieval plus a citation requirement.',
        verdict: 'directional',
        feedback:
          'Quality ratings fall 9% and complaints rise, because your raters had been rewarding fluent consensus prose. Two months later the factual error rate is a third of what it was — but you have to survive an interim where every metric says you were wrong. A strong end state, reached by changing everything before you knew the cause.',
      },
      {
        id: 'd',
        label: 'Instrument for provenance before changing anything.',
        verdict: 'on-it',
        feedback:
          "You find it in a day: agent 2 originated the claim from a stale document in the retrieval index, and the other four agreed because they'd all been given the same document. There was never any independence in the system at all. The fix costs an afternoon — and you'd never have known which fix without the trace.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: why did five agents agree on something false — what were they actually independent on?',
      tell: "If your answer treats the agreement as five opinions converging, you've bought the illusion the system sells. Five instances of one model on one context is one opinion sampled five times, and their agreement measures shared priors, not truth.",
    },
    reveal: {
      consequence:
        "Instrumenting first reveals there was no independence to begin with: one stale document, five agents reading it, one confident wrong claim endorsed five times. Consensus was measuring shared priors, not truth — which is why the 6% disagreement rate was a warning sign, not a health metric, and why the 14% quality lift measured polish, not correctness. The cohort split A 12% · B 38% · C 19% · D 31%.",
      principle:
        "Consensus is not evidence. Five instances of the same model on the same context are one opinion sampled five times, and their agreement measures shared priors, not correctness — so for anything with a checkable answer, a verifier against sources beats a debate among peers on both accuracy and cost.",
      keep:
        "A low disagreement rate in a homogeneous ensemble is a warning, not a win. Verification against sources beats consensus among clones.",
    },
  },

  // ── Lesson 9 · Scenario 5 — "How much rope" ──
  // Showdown — the autonomy grant turns on blast radius, not median refund size.
  'lesson-9': {
    type: 'Showdown',
    kind: 'choice',
    dimensions: ['strategic-thinking', 'execution'],
    stake:
      "Your support agent has been live four months. It handles refunds — not issues them, recommends them, and a human clicks approve. Approval rate is 96%. Median human review time is eleven seconds. Your ops lead has started calling it \"the click tax,\" and she has a proposal: let the agent issue refunds directly under £50, removing roughly 70% of the queue. The agent has access to the payments API, order history, the customer record and the ticket thread. Median refund is £23. Two facts you should probably sit with — of the 4% humans reject, most are not wrong refunds, they are correct refunds to customers already flagged for abuse, and the agent cannot see the abuse flag. And eleven seconds is not review. Eleven seconds is clicking.",
    commitPrompt:
      "Take a position, then commit to what you'd defend — and answer the question that ends careers: what is the maximum this agent can move in 24 hours if something goes wrong at 2am on a Sunday?",
    options: [
      {
        id: 'a',
        label: 'Full autonomy under £50.',
        verdict: 'miss',
        feedback:
          "Works for five weeks. Then a promotional email spikes similar tickets, the agent processes 340 refunds in an hour, around 90 of them duplicates of refunds already issued through a channel it can't see — £2,070, recoverable. The board asks the question you can't answer: what else can it do at 2am? You jumped from rung 3 to full autonomy in one release.",
      },
      {
        id: 'b',
        label: 'Keep approval on everything.',
        verdict: 'directional',
        feedback:
          "Nothing goes wrong for seven months. Then something does, and the review finds a human approved it in nine seconds. The approval log makes it worse, not better — it establishes that a named person was accountable and didn't look. An eleven-second checkpoint isn't a control; it's a liability generator that manufactures evidence of review without the review.",
      },
      {
        id: 'c',
        label:
          'Tiered thresholds plus post-hoc audit — auto under £20 for accounts over 90 days with no flags, approval above, daily sampled audit.',
        verdict: 'on-it',
        feedback:
          "The queue drops 55%, not the promised 70%, and six weeks in the sampled audit catches a pattern the daily aggregates hid — the part that felt like overhead in planning is the part that pays. This is a conditional rung 5: caps, fast detection, and a human where their judgement changes the outcome. Note the audit is a function you now staff forever; an autonomy decision without an ongoing operational commitment hasn't actually been made.",
      },
      {
        id: 'd',
        label: 'Agent proposes and drafts; a human executes. The agent cannot call the payments API at all.',
        verdict: 'directional',
        feedback:
          "The queue drops 40% and the ops lead is disappointed, and nothing bad ever happens. Twelve months later a regulator asks whether the automated system can move customer funds and the answer is a clean no — turning a three-week response into a one-line one. Safe and defensible, but you left value on the table that a capped, audited grant could have captured.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: what is the maximum this agent can move in 24 hours if it goes wrong at 2am on a Sunday — and who notices before Monday?',
      tell: "If you granted autonomy without computing blast radius — max value per action × max actions per detection window — you sized the median refund and ignored the tail. £23 median is not the number that ends careers; the 55-hour unattended weekend is.",
    },
    reveal: {
      consequence:
        "Blast radius is max value per action × max actions per detection window — £50 times however many tickets clear before anyone looks, which over a weekend is 55 hours of unattended refunds. Reversibility justifies more autonomy than accuracy does, and these refunds are cheap-reversal, so the strong answer is a conditional rung 5 with caps, fast detection and a sampled audit — not a jump straight to full autonomy, and not an eleven-second click that provides zero safety and enormous false comfort. The cohort split A 9% · B 14% · C 52% · D 25% — C is popular and correct, but it costs three weeks and an audit function staffed forever.",
      principle:
        "Least agency: grant only the minimum autonomy required for a safe, bounded task, and bound it by blast radius, reversibility and detection latency. Put the human where their judgement changes the outcome, not where it produces a log line — because review time should scale with consequence, not with volume.",
      keep:
        "Compute the 24-hour blast radius before you grant the rope. A checkpoint a human clears in eleven seconds isn't a control — it's a liability generator.",
    },
  },
}
