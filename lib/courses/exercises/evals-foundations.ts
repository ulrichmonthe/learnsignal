import type { CourseExercises } from '@/lib/courses/exercise-types'

// Exercises for "Evals: From Vibe Checks to Production Quality", keyed by lesson slug.
// Every exercise runs the Commit Loop: STAKE → COMMIT → REVEAL → KEEP.
export const EVALS_EXERCISES: CourseExercises = {
  // ── Lesson 1 · "Your AI shipped. Now what?" ──────────────────────────────
  // Prediction — the vibe-check coverage gap. Sets the measurement reflex.
  'lesson-1': {
    type: 'Prediction',
    kind: 'predict-number',
    dimensions: ['product-taste', 'strategic-thinking'],
    stake:
      "The Triage Agent ships Friday. Before you sign off, you do what every PM does: a vibe check. You pull 10 real tickets, run them through the agent, and read the outputs. They look good — categories sensible, sentiment plausible, nothing screams broken. You ship. What you don't know yet is that this agent has roughly a 15% true failure rate spread across short-input hallucinations, missed sarcasm, and dropped multi-issue tickets — failures that don't look like failures unless you check the ticket against the output line by line.",
    commitPrompt:
      'Of the real failures hiding in production, how many will a 10-output eyeball pass like this one actually catch?',
    min: 0,
    max: 10,
    step: 1,
    unit: '/10 failures caught',
    actual: 1,
    band: [0, 2],
    result:
      "A 10-sample read catches maybe one of them — and only if a failure happens to be glaring. Three failure modes were live in production. The vibe check flagged none of the subtle ones, because a plausible-looking output IS the failure mode. Reading outputs tells you they read well. It does not tell you they're right.",
    reveal: {
      consequence:
        "Six weeks later a specialist reports the agent is 'getting worse.' You spot-check 20 outputs — they seem fine. You have no baseline distribution, so you genuinely cannot tell who's right. The vibe check that felt like diligence on Friday is the reason you're flying blind today.",
      principle:
        "A vibe check measures readability, not correctness. With no rubric and no labeled set, 'looks good' is a feeling about the outputs you happened to see — not a claim about the ones you didn't. Evals are the discipline of being able to answer 'is it working?' with a number instead of a shrug.",
      keep:
        "'Looks fine' is not a measurement. The moment you ship, the only honest answers to 'is it working?' come from a labeled set — everything else is a vibe.",
    },
  },

  // ── Lesson 2 · "Why your QA instincts will fail you" ─────────────────────
  // Diagnosis — the QA-shaped bug report that doesn't survive AI's stochasticity.
  'lesson-2': {
    type: 'Diagnosis',
    kind: 'choice',
    dimensions: ['technical-foundation', 'product-taste'],
    stake:
      "Your strongest QA engineer files a bug against the Triage Agent, exactly the way she'd file one for the old deterministic billing flow: 'REPRO: ticket #8841 gets classified Technical, should be Billing. Steps: paste the ticket, run, observe wrong category. Severity: high — blocking.' She wants engineering to fix it and add a regression test that asserts ticket #8841 → Billing. It's a clean, professional bug report. It's also built on an assumption that no longer holds.",
    commitPrompt:
      'What is actually wrong with treating this as a normal reproducible bug?',
    options: [
      {
        id: 'a',
        label: "The category really is wrong — engineering should just fix the prompt so #8841 routes to Billing.",
        verdict: 'miss',
        feedback:
          "This is the QA instinct talking. You can tune the prompt until #8841 lands on Billing, ship it, and feel done — but you've fixed one point on a distribution, not a bug. Re-run #8841 three times and you may get Billing twice and Technical once. There was never a single broken fact to fix.",
      },
      {
        id: 'b',
        label: "The output is stochastic — '#8841 → Technical' isn't a reproducible fact, so a single-case repro and a pinned assert are the wrong unit of work.",
        verdict: 'on-it',
        feedback:
          "Exactly. The model returns a distribution of behaviors, not one answer. The right question isn't 'does this case pass?' but 'across 100 billing-shaped tickets, what percent land in the acceptable zone, and did this change move that number?' A pinned per-case assert will flake and teach the team to ignore it.",
      },
      {
        id: 'c',
        label: "The severity is wrong — one misroute isn't 'high', so the bug should be downgraded and backlogged.",
        verdict: 'directional',
        feedback:
          "You're right that one anecdote shouldn't drive a fire drill, but you've diagnosed the triage process, not the real problem. Even at 'low', this bug is mis-shaped: it asserts a deterministic fact about a stochastic system. Downgrading it leaves the bad mental model intact.",
      },
      {
        id: 'd',
        label: "The repro is incomplete — she should attach the model version and prompt version so engineering can reproduce it exactly.",
        verdict: 'directional',
        feedback:
          "Capturing model and prompt version is genuinely good hygiene and worth doing. But it won't make the output reproducible — pin every version and #8841 still wanders across runs. You've improved the metadata on a bug that shouldn't be a single-case bug at all.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: what should replace the single-case assertion?',
      tell: "A strong answer names a distributional check — e.g. 'measure accuracy across a set of billing-shaped tickets and watch that percentage', not 'just re-run #8841 a few more times.' Re-running the same case more is still case-thinking.",
    },
    reveal: {
      consequence:
        "Engineering 'fixes' #8841, adds the assert, and closes the ticket. Two weeks later the assert flakes red on an unrelated prompt tweak, someone marks it skip, and the test is dead. Meanwhile the actual question — did billing accuracy go up or down? — was never asked, because nobody had a set to measure it against.",
      principle:
        "Traditional QA's deal — same input, same output, reproduce-and-fix — is exactly the deal AI breaks. 'Correct' goes from binary to graded; a bug goes from a fact to a shift in a distribution. Your sharpest deterministic-QA instincts are precisely the ones that mislead you here.",
      keep:
        "In AI, a bug isn't a broken case — it's a shifted distribution. If your fix is a single-case assert, you're testing yesterday's coin flip.",
    },
  },

  // ── Lesson 3 · "Generating diverse test inputs" ──────────────────────────
  // Diagnosis — the eval set that looks comprehensive but is production-shaped only.
  'lesson-3': {
    type: 'Diagnosis',
    dimensions: ['product-taste', 'execution'],
    kind: 'choice',
    stake:
      "A teammate proudly hands you a 100-input eval set for the Triage Agent. Her method: she exported the last 100 production tickets, scrubbed the PII, and called it done. 'It's all real user data,' she says, 'no synthetic junk, no made-up edge cases — this is exactly what our users actually send.' The set is clean, real, and representative of last month's traffic. She wants to lock it as the golden set and start measuring against it.",
    commitPrompt:
      'You can lock it, or push back. What is the load-bearing problem with this eval set?',
    options: [
      {
        id: 'a',
        label: "Nothing major — real production data is the gold standard. Lock it; it beats anything hand-written or synthetic.",
        verdict: 'miss',
        feedback:
          "Real data is valuable, but 'representative of last month' is the trap. The inputs you happen to have are biased toward cases you've already seen. This set will make the agent look great on the past and tell you nothing about the prompt-injection, the sarcasm, or the first non-English wave that hasn't spiked yet.",
      },
      {
        id: 'b',
        label: "It samples only the production distribution — it has no deliberate edge and stress cases, so it can't catch the failure modes you already know about.",
        verdict: 'on-it',
        feedback:
          "Right. A pure production sample is ~all 'typical traffic' and almost no multi-issue, sarcasm, prompt-injection, ultra-short, or mixed-language inputs — the exact patterns you know break this agent. Mature sets run roughly 60% production / 25% edge / 15% stress on purpose, so the eval probes the failures, not just the average.",
      },
      {
        id: 'c',
        label: "100 inputs is too small for statistical significance — she needs at least 1,000 before locking anything.",
        verdict: 'directional',
        feedback:
          "Bigger isn't the fix here, and 100 is a reasonable starting golden set. Ten thousand production-sampled tickets would have the same blind spot as 100: scale up a biased distribution and you get a bigger, more confident blind spot. Composition is the problem, not count.",
      },
      {
        id: 'd',
        label: "Real tickets are messy and inconsistently labeled — she should replace them with clean synthetic inputs an LLM generates from your personas.",
        verdict: 'miss',
        feedback:
          "This overcorrects into the opposite ditch. Synthetic inputs are plausible-sounding but don't quite match real user weirdness; they're best for filling persona gaps, not as the foundation. Throwing out the real production sample to go all-synthetic trades one bias for a worse one.",
      },
    ],
    rationale: {
      prompt: 'Name one specific input category this set almost certainly lacks, and why it matters.',
      tell: "A strong answer points at a known failure mode the agent has — sarcasm, multi-issue, ultra-short, prompt-injection, or non-English — not a generic 'more variety.' If the answer is just 'more edge cases,' they haven't connected the gap to a failure this agent actually exhibits.",
    },
    reveal: {
      consequence:
        "You lock it. For two months it reports 94% and everyone relaxes. Then a product launch shifts the input mix overnight — sarcasm spikes, multi-issue tickets double — and CSAT drops while your eval still says 94%. The set was honest about a world that no longer exists.",
      principle:
        "An eval set is only as honest as the inputs you put into it. Sampling what you already have makes the AI good at the past. Persona-stress-edge composition forces the set to look like the full space of inputs — including the ones that haven't happened yet.",
      keep:
        "A production-only eval set grades your AI on the past. Deliberately stock edge and stress cases, or your number will stay green while reality goes red.",
    },
  },

  // ── Lesson 4 · "Labeling outputs and writing your first rubric" ──────────
  // Showdown — the eng lead who wants the rubric written before any labeling.
  'lesson-4': {
    type: 'Showdown',
    dimensions: ['product-taste', 'strategic-thinking'],
    kind: 'choice',
    stake:
      "Kickoff for the Triage Agent eval. The eng lead wants to move fast: 'Let's not waste a week labeling by gut. I'll draft a clean rubric this afternoon from the spec — category accuracy, sentiment, hallucination, the obvious dimensions. We get sign-off tomorrow, then everyone labels against an agreed standard. Writing the rubric first is just being organized.' It sounds disciplined. Half the room is nodding. You've seen this movie before.",
    commitPrompt:
      'Do you let him write the rubric first, or do you push back — and what exactly do you propose instead?',
    options: [
      {
        id: 'a',
        label: "Let him draft it first. An agreed standard before labeling prevents everyone from labeling to their own private taste.",
        verdict: 'miss',
        feedback:
          "This is the wrong turn every team takes once. A rubric imagined from the spec captures the ~20% of rules you're consciously aware of and misses the 80% your gut applies without naming. Within 50 cases the labelers hit failures the rubric never anticipated and start improvising anyway — now with false confidence.",
      },
      {
        id: 'b',
        label: "Push back: label ~20 outputs cold first, annotate every reject with a one-line reason, then extract the rubric from the clusters that emerge.",
        verdict: 'on-it',
        feedback:
          "This is the move. Your gut already encodes a thousand rules about good vs. bad triage; labeling first reverse-engineers them. The reject reasons cluster — 'hallucinated a ticket ID', 'missed sarcasm', 'dropped the second issue' — and those clusters ARE your rubric dimensions. Discovered, not imagined.",
      },
      {
        id: 'c',
        label: "Compromise: let him draft v1 from the spec, then revise it after the team labels a batch against it.",
        verdict: 'directional',
        feedback:
          "You'll get to a working rubric eventually, and at least labeling happens. But the spec-first draft anchors everyone — people label to defend the existing dimensions instead of noticing the ones that are missing. Discovery is cheaper before the anchor exists than after you fight it.",
      },
      {
        id: 'd',
        label: "Push back, but propose you write the rubric solo — you know the product best, so your judgment is the standard.",
        verdict: 'directional',
        feedback:
          "You're right to resist the spec-first draft, but a solo rubric — written OR labeled — just encodes one person's pattern-matching. The rules that matter most are often the unshared ones, and you only surface those when two people label and compare disagreements. Don't make yourself the single point of taste.",
      },
    ],
    rationale: {
      prompt: 'In one sentence: why does labeling first produce a better rubric than writing first?',
      tell: "A strong answer says the rubric is extracted from real decisions your gut already makes (the 80% you can't pre-articulate). If the answer is just 'real examples are more concrete,' they've missed that the point is surfacing tacit rules, not illustrating known ones.",
    },
    reveal: {
      consequence:
        "On the teams that write first, the rubric looks great on paper and falls apart in practice — labelers keep making judgment calls it doesn't cover, agreement sits at 60%, and every disagreement becomes a meta-argument about taste. The teams that label first ship a messier-looking rubric where two labelers agree 90% of the time.",
      principle:
        "Your rubric isn't a document you write — it's a pattern you discover by labeling. Label cold, annotate the rejects, cluster the reasons, name the clusters. The order is the whole skill.",
      keep:
        "Label first, rubric second. A rubric written before any labeling captures the 20% you can articulate and misses the 80% your gut already knows.",
    },
  },

  // ── Lesson 5 · "Finding failure patterns" ────────────────────────────────
  // Lever — the three-of-a-kind discipline. One knob: act now vs. wait for the pattern.
  'lesson-5': {
    type: 'Lever',
    dimensions: ['product-taste', 'execution'],
    kind: 'choice',
    stake:
      "You're 40 labels into a fresh batch of Triage Agent outputs. One reject jumps out: on a 6-word ticket ('app keeps crashing help'), the agent confidently invented an error code — 'ERR_AUTH_440' — that appears nowhere in the ticket and doesn't exist in your system. It's vivid, it's clearly wrong, and you can already picture the prompt tweak that would fix it. It's the only instance of its kind in the batch so far. Your hand is hovering over the 'file a fix' button.",
    commitPrompt:
      'What do you do with this single vivid failure right now?',
    options: [
      {
        id: 'a',
        label: "File the prompt fix now — it's an obvious, clear-cut hallucination and you can see exactly how to stop it.",
        verdict: 'miss',
        feedback:
          "Vividness is not frequency. Fix this one-off and you've spent attention patching a system in one more place for something that may never recur — and you still don't know if it's a real pattern or a single bad coin flip. New AI PMs lose months to exactly this whack-a-mole reflex.",
      },
      {
        id: 'b',
        label: "Log it with a precise reject reason ('short input → fabricated error code') and keep labeling until you've seen the third instance before acting.",
        verdict: 'on-it',
        feedback:
          "This is the discipline. Two instances can share surface features but different root causes; by the third you can name the input shape ('tickets under ~20 words') and the breakdown ('fills ambiguity with plausible noise') with confidence. Then one fix kills the whole cluster instead of one anecdote.",
      },
      {
        id: 'c',
        label: "Ignore it as noise and move on — a single failure in 40 isn't worth recording.",
        verdict: 'directional',
        feedback:
          "You're right not to fix it yet, but throwing the reason away is the opposite error. The whole method depends on a precise one-line reject reason you can later sort and cluster. Drop it and when instances two and three arrive, you'll have no way to see they're the same pattern.",
      },
      {
        id: 'd',
        label: "Write three new short-input tickets right now to see if you can reproduce the fabrication, then decide.",
        verdict: 'directional',
        feedback:
          "Genuinely useful instinct — 'can I generate a new failure from the pattern?' is a real signal test. But do it as a deliberate check after you suspect a pattern, not as a reflex on instance one. And you still want it logged with a sharp reason either way so the cluster can form across the whole batch.",
      },
    ],
    rationale: {
      prompt: 'Why does waiting for the third instance produce a better fix than acting on the first?',
      tell: "A strong answer says three instances let you name the input shape and a root-cause hypothesis that covers all of them — so one fix clears the cluster. If the answer is 'to be sure it's not a fluke,' that's partly right but misses that the payoff is leverage, not just confidence.",
    },
    reveal: {
      consequence:
        "You wait. By label 90, short-input hallucinations show up 14 times — it's the single largest reject cluster. One prompt change ('if the ticket lacks information to classify confidently, mark needs_clarification instead of guessing') clears the entire cluster at once. The PM who fixed instance one on day one would still be filing instances 2 through 14 by hand.",
      principle:
        "Three of the same failure is a pattern worth fixing; one is just a Tuesday. The leverage isn't in fixing failures — it's in fixing the pattern producing 80% of them, and you can't see the pattern until you let three instances accumulate against a precise reason.",
      keep:
        "Log the one-off, fix the pattern. Three instances of the same failure earns a fix; the first vivid instance earns a sticky note.",
    },
  },

  // ── Lesson 6 · "From rubric to deterministic checks" ─────────────────────
  // Lever — deterministic vs. model-graded. Every dimension costs something.
  'lesson-6': {
    type: 'Lever',
    dimensions: ['technical-foundation', 'execution'],
    kind: 'choice',
    stake:
      "You're architecting the evaluator from your five-dimension Triage rubric. Your eng lead, eager to use the shiny new judge pipeline, proposes the simplest thing: 'Let's just send all five dimensions to the LLM judge. One prompt, one call, scores everything — category, sentiment, hallucination, urgency, multi-issue. Uniform, clean, done.' It would work. It would also run on every one of the 100,000 outputs you process daily, and one of those five dimensions is 'does this ticket ID exist in our database?'",
    commitPrompt:
      'Where do you draw the line between code and judge — and which dimension is the tell?',
    options: [
      {
        id: 'a',
        label: "Send all five to the judge. It's uniform and simpler than maintaining two systems, and the judge is smart enough to handle the easy ones too.",
        verdict: 'miss',
        feedback:
          "Simpler to build, ruinous to run. You'd be paying an LLM call to answer 'does this ID exist in our DB?' — a question code answers for free, deterministically, in microseconds. One audited team found 40% of judge calls were checking things code could do, and halved eval cost with no signal loss.",
      },
      {
        id: 'b',
        label: "Route hallucination (ID exists?) and schema/latency to deterministic code as a fast layer; reserve the judge for category, sentiment, and multi-issue.",
        verdict: 'on-it',
        feedback:
          "This is the deterministic-first split. 'Does this ID exist?' is a database query: free, instant, never disagrees with itself, gateable on every commit. Sentiment-sarcasm and 'is this the right category?' genuinely need judgment. You spend judge money only where interpretation is actually required.",
      },
      {
        id: 'c',
        label: "Send nothing to the judge — write deterministic code for all five so the whole evaluator stays free and reproducible.",
        verdict: 'miss',
        feedback:
          "You can't code your way to 'did it catch the sarcasm in a frustrated customer?' — that's interpretive, and reasonable humans disagree. Force it into a regex and you'll ship a check that's confidently wrong. Some dimensions earn the judge's cost; the skill is knowing which.",
      },
      {
        id: 'd',
        label: "Have the judge score all five but only sample 5% of outputs to keep the cost down.",
        verdict: 'directional',
        feedback:
          "Sampling the judge layer is correct — you don't run judges on every output. But sampling the hallucination check means 95% of outputs ship with a fabricated ticket ID unchecked, when a free deterministic check could verify 100% of them on every commit. Right instinct, wrong dimension to sample.",
      },
    ],
    rationale: {
      prompt: 'What is the test that decides a dimension goes to code vs. the judge?',
      tell: "A strong answer: code it when the verdict is expressible as a rule and two reasonable humans always agree; judge it when context/interpretation decides and they might disagree. If the answer is 'code the easy ones, judge the hard ones,' push for the actual line — agreement-among-humans is the real test.",
    },
    reveal: {
      consequence:
        "You split it. The fast deterministic layer — schema, ID-exists, no-PII, latency — runs on 100% of outputs on every commit for fractions of a cent, catching every fabricated ID instantly. The judge runs on sampled outputs on a schedule for the three interpretive dimensions. The all-judge architecture would have cost thousands a month to confirm JSON was valid.",
      principle:
        "Half your rubric doesn't need AI to check it. Deterministic checks are free, instant, and reproducible — the same input always yields the same verdict. Before reaching for a judge, ask whether code would always agree with a human. If yes, it's code.",
      keep:
        "Don't pay a model to do what a database query can. Deterministic-first: if two humans always agree on the verdict, it's code, not a judge.",
    },
  },

  // ── Lesson 7 · "LLM-as-judge done right" ─────────────────────────────────
  // Prediction — judge–human agreement on an uncalibrated sentiment judge.
  'lesson-7': {
    type: 'Prediction',
    dimensions: ['technical-foundation', 'product-taste'],
    kind: 'predict-number',
    stake:
      "You stand up an LLM-as-judge for the Triage Agent. The category and hallucination dimensions calibrate beautifully against your 50 human-labeled cases — 88% and 94% agreement. Encouraged, you point the same rubric-based judge at the sentiment dimension without re-checking, because it's 'the same judge, same prompt structure.' But sentiment is where this agent's sarcasm failures live: 'Cool, ANOTHER charge I didn't authorise' is Frustrated to any human, and the judge has no examples of sarcasm in its prompt.",
    commitPrompt:
      'When you finally run the uncalibrated sentiment judge against the 50 human labels — what agreement rate does it hit?',
    min: 40,
    max: 100,
    step: 1,
    unit: '% agreement with humans',
    actual: 62,
    band: [55, 70],
    result:
      "62%. The judge that nailed category and hallucination falls apart on sentiment — it reads sarcasm's surface-positive words ('Cool', 'GREAT', 'Wonderful') as positive sentiment and disagrees with humans on more than a third of cases. Same judge, same prompt structure, useless on this dimension.",
    reveal: {
      consequence:
        "Had you trusted it, you'd have shipped a sentiment metric charting confidently around 'looking good' while the agent quietly mislabeled angry customers as neutral and failed to escalate them. The fix isn't a smarter model — it's three lines of sarcasm examples in the prompt, re-validated until agreement clears 80%. But you only know to add them because you measured the gap.",
      principle:
        "Agreement is per-dimension, not per-judge. A judge that's trustworthy on one dimension can be 62% — barely better than a coin weighted by leniency — on the next. An uncalibrated judge is worse than no judge: it produces confident numbers that correlate with nothing real.",
      keep:
        "Calibrate every dimension against human labels before you trust its number. Below ~80% agreement, the judge isn't measuring quality — it's manufacturing false confidence.",
    },
  },

  // ── Lesson 8 · "Pairwise vs absolute scoring" ────────────────────────────
  // Prediction — the prompt change that wins pairwise but is invisible to absolute scoring.
  'lesson-8': {
    type: 'Prediction',
    dimensions: ['product-taste', 'execution'],
    kind: 'predict-choice',
    stake:
      "You wrote a new Triage Agent prompt (v2) you believe writes warmer, more helpful response messages than v1. You evaluate it two ways on the same 100 inputs. Way one: an absolute LLM judge rates each output's message helpfulness 1–5; v1 averages 4.1, v2 averages 4.1 — dead flat, no movement. Way two: a pairwise judge sees v1 and v2 side by side in random order and picks the better message; v2 wins 68% of head-to-heads. Same outputs, same judge model, two scoring methods. Your exec wants one read: did v2 actually improve the message?",
    commitPrompt:
      'Which signal do you believe, and what do you tell the exec?',
    options: [
      {
        id: 'a',
        label: "Believe pairwise: v2 is genuinely better. Absolute scoring is too noisy on a subjective quality like helpfulness to see a real-but-modest gain.",
        verdict: 'on-it',
        feedback:
          "Right. On subjective dimensions, absolute scores drown real differences in center bias (everyone clusters at 3–4) and anchor drift. Pairwise forces a direct comparison with no center to hide in — and 68% wins over 100 pairs clears the >55% bar. v2 improved; the flat 4.1→4.1 was the scale failing to resolve it, not the absence of a gain.",
      },
      {
        id: 'b',
        label: "Believe absolute: it's flat, so v2 didn't really change anything. The pairwise win is just the judge being forced to pick when there's no real difference.",
        verdict: 'miss',
        feedback:
          "This is the trap most teams take a year to escape — chasing 4.1 to 4.3 to 4.2 while none of it tracks reality. A forced choice doesn't manufacture a 68/32 split out of noise; a true coin flip lands near 50/50. The flat absolute score is the unreliable read here, not the pairwise one.",
      },
      {
        id: 'c',
        label: "Believe neither yet — the methods disagree, so the result is inconclusive and you should run more samples.",
        verdict: 'directional',
        feedback:
          "Healthy skepticism, but the disagreement isn't a contradiction to resolve — it's the lesson. The two methods measure different things: absolute (with all its biases) failed to resolve a difference that pairwise (built for exactly this) cleanly detected. More absolute samples won't fix center bias. You already have your answer.",
      },
    ],
    reveal: {
      consequence:
        "You ship v2 on the strength of the pairwise win, and message-helpfulness thumbs-up ticks up over the next month — the gain was real, just invisible to a 1–5 scale. The team that had trusted the flat absolute score would have killed v2 as 'no improvement' and never found the win.",
      principle:
        "When you can't tell if something's a 3 or a 4, ask which of two is better instead. Absolute scoring suffers anchor bias, center bias, and definition drift; pairwise has no center to cluster in and no anchor to drift from. For subjective dimensions and prompt A/Bs, pairwise resolves differences absolute scoring buries.",
      keep:
        "For subjective quality, pairwise beats 1–5. A flat absolute score doesn't mean no change — it often means the scale couldn't see the change.",
    },
  },

  // ── Lesson 9 · "Online monitoring and drift detection" ───────────────────
  // Ranking — which signal tells you first that production quality is slipping.
  'lesson-9': {
    type: 'Ranking',
    dimensions: ['strategic-thinking', 'execution'],
    kind: 'rank',
    stake:
      "Triage Agent, week 6. Your frozen 100-case offline eval still reads a healthy 94% category accuracy and is trending UP. But something is wrong in production, and four different signals are available to you, each catching the problem at a different distance from the damage. You want to be the team that catches degradation weeks early — not the one that learns about it from the CEO asking why CSAT dropped 4 points.",
    commitPrompt:
      'Rank these four signals from earliest warning (catches the problem first) to latest (you already lost the user).',
    items: [
      { id: 'drift', label: 'Input drift: non-English tickets jumped 4% → 23%; avg input length and category mix shifting week over week' },
      { id: 'implicit', label: 'Implicit signal: specialist override rate (humans re-classifying the AI) rising 11% → 18%' },
      { id: 'explicit', label: "Explicit signal: thumbs-down rate on outputs rising 5% → 12%" },
      { id: 'lagging', label: 'Lagging business metric: quarterly support CSAT down 4 points; the CEO is asking why' },
    ],
    correctOrder: ['drift', 'implicit', 'explicit', 'lagging'],
    rationale:
      "Drift comes first: the inputs change before behavior on them does. Non-English tickets hitting 23% against a 100%-English eval set means the agent is being tested on inputs you never evaluated — and the offline score can't see it because the set is frozen. Next, implicit signals (specialist overrides) move as humans quietly correct the AI in their workflow — high volume, accurate, weeks ahead of complaints. Then explicit signals (thumbs-down) move only for the sliver of users motivated to react. Last, the lagging business metric (CSAT, churn, the CEO's question) — by the time it moves, the damage is done and weeks old. The offline eval, notably, never moves at all: it's a snapshot of a world that's already changed.",
    reveal: {
      consequence:
        "The team watching drift caught the non-English surge in week 2, sampled 50 of those tickets into the eval set, and fixed routing before overrides ever spiked. The team that watched only thumbs-down noticed in week 5. The team that waited for CSAT explained a 4-point drop to the CEO in week 12 — with an offline dashboard still proudly reading 94%.",
      principle:
        "Your eval set is a snapshot of what you knew to test for. Production monitoring catches what you didn't anticipate, and the signals form a timeline: drift leads, implicit behavior follows, explicit feedback trails, business metrics arrive last. Watch the leading signals or you'll always be explaining the lagging ones.",
      keep:
        "Drift first, CSAT last. A green offline eval next to rising overrides means your test set is measuring a world your users already left.",
    },
  },

  // ── Lesson 10 · "Tracing failures to root cause" ─────────────────────────
  // Callback — design the eval that would have caught the misroute, reaching back to RAG (PCE lesson 7).
  'lesson-10': {
    type: 'Callback',
    dimensions: ['technical-foundation', 'product-taste', 'strategic-thinking'],
    kind: 'reflect',
    stake:
      "The Triage Agent misrouted a clear billing ticket ('I keep getting charged twice for my subscription — make it stop') to Technical. You walk the failure funnel backwards. Postprocessing: clean. Model inference: reasonable given its context. Prompt construction: it included 5 retrieved similar tickets. Retrieval: 4 were correctly-classified billing tickets — but the 5th was a 2-year-old ticket about 'double-billing from a software bug,' classified Technical (correct then, poison now). Root cause: the retrieval layer fed the model a misleading example. The model did exactly what you'd expect given what it saw. This should feel familiar — back in the RAG lesson, you learned that what lands in the context window decides the answer, and that retrieval quietly poisons outputs without ever flagging it.",
    commitPrompt:
      "Design the eval that would have caught this BEFORE a customer did. Write 2–4 bullets: what you'd measure, where in the funnel you'd measure it, and what test case you'd add so this exact regression can never ship silently again.",
    reveal: {
      consequence:
        "Teams that only eval the final category never catch this class of bug — the output looks like a defensible model mistake, so they 'fix' it with a better prompt or a stricter judge, and the poisoned-retrieval pattern recurs on the next stale example. The fix lives one layer upstream of where the symptom appears, and only a retrieval-level eval sees it.",
      principle:
        "AI failures are rarely 'the model was wrong' — they're chains where one bad upstream decision (here, retrieval) cascades into a visible downstream symptom (wrong category). This is the same lesson as the RAG decision earlier in your path: the context window decides the answer, and retrieval poisons it silently. Evals that only check the final output can't tell you which layer to fix. You eval the funnel, not just the endpoint.",
      keep:
        "Eval the funnel, not just the output. When the model is 'wrong,' check retrieval and context first — the symptom is almost never where the bug lives.",
    },
    modelAnswer: [
      "Eval the retrieval layer directly, not just the final category: for a labeled set of tickets, measure whether the retrieved examples are correctly-labeled AND topically matched — a 'double-billing from a software bug' example surfacing for a billing-error ticket is a retrieval miss even when the final category happens to be right.",
      "Add recency/relevance checks to retrieval: flag when a retrieved example is older than N months or when the retrieved set's labels disagree with each other (4 Billing + 1 Technical is a contradiction signal worth catching before inference).",
      "Add this exact case to the golden eval set as a regression test: the 'charged twice → should be Billing' ticket, asserting both the correct final category AND that no stale/contradictory example dominates retrieval — so any future change that re-poisons retrieval fails the eval, not the customer.",
      "Instrument the trace in production: capture retrieved examples + their labels per output, so when a misroute appears you can walk the funnel from logs instead of re-deriving it — turning a two-day model-blaming investigation into a one-glance retrieval check.",
      "Callback to the RAG decision: this is lost-in-the-context made measurable — the eval that would've flagged it is the same instinct that says 'what landed in the window?' before 'was the model wrong?'",
    ],
  },
}
