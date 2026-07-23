// Lesson body components for the Harness Engineering course (HE).
// Lessons 3, 4, and 8 are "full" lessons with rich content; the rest use the
// framework pattern (intro → body → core bullets → closing → exercise).

import type { ReactNode } from 'react'
import {
  BlockQuote,
  CodeBlock,
  ExerciseLeadIn,
  ExerciseSoon,
  P,
  Section,
  SubHead,
} from '@/components/courses/lesson-helpers'
import { Exercise } from '@/components/courses/exercise'
import { HARNESS_EXERCISES } from '@/lib/courses/exercises/harness-engineering'
import { ReliabilityCeilingExplainer } from '@/components/courses/explainers/reliability-ceiling'
import { RulesBloatExplainer } from '@/components/courses/explainers/rules-bloat'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Lead({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-10"
      style={{
        fontSize: '17px',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.65',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {children}
    </p>
  )
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '15px',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.65',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      <span style={{ color: 'var(--accent)', opacity: 0.6, flexShrink: 0, marginTop: '3px' }}>·</span>
      <span>{children}</span>
    </li>
  )
}

function BulletList({ children }: { children: ReactNode }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        paddingLeft: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        margin: '8px 0 16px',
      }}
    >
      {children}
    </ul>
  )
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        background: 'rgba(255,255,255,0.06)',
        padding: '1px 5px',
        borderRadius: '3px',
        color: 'rgba(255,255,255,0.8)',
      }}
    >
      {children}
    </code>
  )
}

// ── Forge context box ─────────────────────────────────────────

function ForgeBox() {
  return (
    <div
      className="rounded-lg p-5 my-8"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      <p
        className="font-mono uppercase mb-2"
        style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text3)' }}
      >
        Throughout this course
      </p>
      <p className="font-display font-medium text-text mb-2" style={{ fontSize: '16px', fontStyle: 'italic' }}>
        Forge — Acme Analytics autonomous coding agent
      </p>
      <p
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: '1.6',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        An autonomous coding agent that takes an engineering ticket and ships a reviewed pull
        request. It runs long and mostly unattended — which means its prompt is the smallest
        part of why it works or fails. Every lesson in this course modifies one part of Forge&apos;s
        harness.
      </p>
      <div className="mt-4 space-y-1">
        {[
          'Takes an engineering ticket from the queue',
          'Plans, implements, and opens a PR with tests passing',
          'Runs long and unattended — harness decides reliability',
        ].map((task, i) => (
          <div key={i} className="flex items-start gap-2">
            <span style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '2px', opacity: 0.7 }}>·</span>
            <p className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
              {task}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── HE Lesson 1 ───────────────────────────────────────────────────────────────

export function HELesson1Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        Something in your AI product is failing — the output is inconsistent, or wrong, or unsafe. For
        almost every team, the reflex is to open the prompt and start editing. That reflex is wrong more
        often than it&apos;s right, and learning why is the foundation of everything that follows.
      </Lead>

      <P>
        There are three layers to any system built on a model, and they answer three different questions.
        The <em>prompt</em> decides what the model should do. The <em>context</em> decides what the model
        knows. The <em>harness</em> — the layer almost nobody names — decides how the whole system actually
        runs: how tools get orchestrated, how state persists, what happens on failure, what gets verified,
        what&apos;s simply not allowed. Most &ldquo;the model is dumb&rdquo; bugs live in that third layer.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Three concentric layers: prompt (what to do), context (what it knows), harness (how it runs —
            tool orchestration, state, retries, verification, safety, lifecycle). The taxonomy that
            organizes everything that follows.
          </Bullet>
          <Bullet>
            The misdiagnosis pattern, stated plainly: teams blame the prompt when the real problem is stale
            context, and blame the model when the real problem is a weak harness with no retries, no
            approvals, no eval loop.
          </Bullet>
          <Bullet>
            The term has an origin and a proof. Mitchell Hashimoto coined &ldquo;engineer the
            harness&rdquo;; OpenAI&apos;s Codex team shipped roughly a million lines of production code
            across ~1,500 merged PRs in five months with essentially no hand-written code — harness as an
            operating model, not a tactic.
          </Bullet>
          <Bullet>
            The instinct to install: when something breaks, ask which layer before you reach for the
            prompt. Diagnosing the layer is the whole skill.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Meet Forge, the test bed for this course: an autonomous coding agent at Acme Analytics that takes
        an engineering ticket and ships a reviewed pull request. It runs long and mostly unattended —
        which means its prompt is the smallest part of why it works or fails. The principles transfer to
        any long-running agent; we&apos;ll stay concrete with Forge.
      </Lead>

      <Exercise spec={HARNESS_EXERCISES['lesson-1']} />
    </div>
  )
}

// ── HE Lesson 2 ───────────────────────────────────────────────────────────────

export function HELesson2Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        Here is the sentence that reorganizes how you think about reliability: you can move a model&apos;s
        success rate from sixty percent to ninety-nine, but you can never prompt it to one hundred. The
        gap between 99 and 100 isn&apos;t a prompting problem. It&apos;s a category problem — and the
        harness is how you cross it.
      </Lead>

      <P>
        Better prompts and richer context shift a probability distribution. They make the good outcome
        more likely. What they never do is make it <em>certain</em>, and &ldquo;more obedient&rdquo; is
        not the same as &ldquo;constrained.&rdquo; A system that complies 99% of the time fails one
        request in a hundred, forever, no matter how the prompt is worded. For anything you&apos;d reject
        in code review, that isn&apos;t good enough — and no amount of instruction closes the gap.
        Deterministic guardrails do.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The climb framing: you can reach 60 → 80 → 92 → ~99%, but the system stays probabilistic.
            People get stuck thinking a more obedient model means a constrained system. It doesn&apos;t.
          </Bullet>
          <Bullet>
            The conclusion that follows directly: probabilistic LLM compliance must be paired with
            deterministic outer-harness constraints — linters, type checks, CI gates — to be reliable at
            scale.
          </Bullet>
          <Bullet>
            The trap to name: &ldquo;just have another LLM check it&rdquo; is weak validation. You
            can&apos;t close probabilistic output with probabilistic judgment. A gate is deterministic or
            it isn&apos;t.
          </Bullet>
          <Bullet>
            The decision axis for the whole course: computational sensors (linters, tests, type checks)
            are cheap, deterministic, reliable; inferential sensors (LLM-as-judge, semantic checks) are
            expensive, non-deterministic, and belong only where a computer genuinely can&apos;t decide.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Hold this axis — computational versus inferential — for the rest of the course. Nearly every
        harness decision reduces to one question: can a computer check this, or do I need a model to?
        When a computer can, reaching for the model is the mistake.
      </Lead>

      <ReliabilityCeilingExplainer />

      <Exercise spec={HARNESS_EXERCISES['lesson-2']} />
    </div>
  )
}

// ── HE Lesson 3 (full) ────────────────────────────────────────────────────────

export function HELesson3Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        A rules file&apos;s job is narrow: encode the things the agent genuinely cannot infer from the
        code and good documentation — your house conventions, your hard boundaries, the handful of project
        facts that aren&apos;t discoverable. It is the system prompt of your harness. Everything in it
        competes for the same finite attention as the actual task, which means every line you add taxes
        every other line.
      </Lead>

      <Section label="What a rules file is for">
        <P>
          A rules file&apos;s job is narrow: encode the things the agent genuinely cannot infer from the
          code and good documentation — your house conventions, your hard boundaries, the handful of
          project facts that aren&apos;t discoverable. It is the system prompt of your harness. Everything
          in it competes for the same finite attention as the actual task, which means every line you add
          taxes every other line.
        </P>
      </Section>

      <Section label="The over-specification trap">
        <P>
          Anthropic names the most common failure mode directly: the over-specified file. When the file
          grows too long, the agent ignores half of it, because the rules that matter drown in the noise
          of rules that don&apos;t. The discipline is the opposite of what feels safe —{' '}
          <strong>prune ruthlessly</strong>. If the agent already does something correctly without an
          instruction, the instruction isn&apos;t helping; delete it, or convert it into a hook (Lesson 4).
        </P>
      </Section>

      <Section label="What the evidence says">
        <P>
          This isn&apos;t a style opinion — it&apos;s measured. A controlled evaluation found that
          detailed directory maps in agent files don&apos;t help and often hurt: the agent does more
          reads, more searches, more reasoning, with no meaningful accuracy gain. The conclusion is the
          part to internalize: rules files are a <em>compensation mechanism for missing documentation,
          not a performance booster on top of good documentation.</em>
        </P>
        <P>
          The largest practical analysis — across thousands of repositories — found that the files which{' '}
          <em>do</em> work share three traits: specific roles, real code examples, and clear boundaries.
          The failures are vague. And a separate eval found something sharper still: static, always-present
          rules outperformed an arrangement where the agent had to <em>decide</em> to fetch context —
          because agents fail roughly half the time at the &ldquo;decide to retrieve&rdquo; step. The
          lesson: the rules that always matter go in statically. Don&apos;t make the agent choose to load
          them.
        </P>
      </Section>

      <BlockQuote attribution="Paraphrasing the ETH Zurich / LogicStar evaluation">
        Context files compensate for missing documentation. They don&apos;t boost good documentation.
      </BlockQuote>

      <Section label="How to actually write one">
        <BulletList>
          <Bullet>
            <strong>Write good docs and good code first.</strong> The rules file fills gaps; it
            can&apos;t paper over a codebase the agent can&apos;t read.
          </Bullet>
          <Bullet>
            <strong>Keep only what can&apos;t be inferred</strong> — conventions, boundaries, project
            facts. Cut anything the agent already gets right on its own.
          </Bullet>
          <Bullet>
            <strong>Show, don&apos;t tell</strong> — a two-line good/bad code example beats a paragraph
            of description, every time.
          </Bullet>
          <Bullet>
            <strong>Move enforceable rules out to hooks.</strong> &ldquo;Functions under 50 lines&rdquo;
            is not a rule you ask for — it&apos;s a rule you enforce. That&apos;s the next lesson.
          </Bullet>
        </BulletList>
      </Section>

      <Section label="Forge — worked example">
        <P>
          Two versions of the same file: BEFORE at 40 lines of mostly noise, and AFTER — specific,
          example-driven, short.
        </P>

        <SubHead>Before</SubHead>
        <CodeBlock>{`# AGENTS.md  — BEFORE (40 lines, mostly noise)

You are an expert senior software engineer with 10+ years of
experience. Always write clean, maintainable, well-documented
code. Be careful and thorough. Think step by step. Follow best
practices. Always consider edge cases. Write good tests.

## Directory map
/src              source code
/src/api          api routes
/src/lib          shared utilities
/src/components   react components
  ...28 more lines mapping every folder...

Please always make sure your code is correct and don't add bugs.`}</CodeBlock>

        <SubHead>After</SubHead>
        <CodeBlock>{`# AGENTS.md  — AFTER (specific, example-driven, short)

## What this repo is
Acme Analytics dashboard. Next.js App Router + Supabase + TS.

## Non-negotiables (enforced by hooks — see /.hooks)
- Functions ≤ 50 lines.        eslint max-lines-per-function
- No secrets in code.          gitleaks (pre-commit)
- PRs run the suite green.     CI gate

## House style — by example
GOOD:  const user = await getUser(id);
BAD:   let u = getUser(id).then(x => x)

## Boundaries
- Never edit /src/generated/**  (codegen output).
- Touching /src/api/billing/**  requires a human reviewer.`}</CodeBlock>
      </Section>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '10px' }}>
          You&apos;ll be handed a bloated 40-line <InlineCode>CLAUDE.md</InlineCode> for a different
          product. Prune it to only the rules that earn their place — the things the agent can&apos;t
          infer from good code and docs. Then identify the two rules that shouldn&apos;t be in the file
          at all because they&apos;re deterministically enforceable, and note which hook each becomes.
        </p>
        <p>
          After you submit, you&apos;ll see a senior PM&apos;s pruned version, with a line-by-line note
          on why each cut was made — and which of your kept rules were doing real work versus spending
          attention budget.
        </p>
      </ExerciseLeadIn>
      <RulesBloatExplainer />

      <Exercise spec={HARNESS_EXERCISES['lesson-3']} />
    </div>
  )
}

// ── HE Lesson 4 (full) ────────────────────────────────────────────────────────

export function HELesson4Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        In Lesson 3 you pruned rules out of the file and kept promising to &ldquo;enforce them with
        hooks.&rdquo; This is where that promise gets paid. A rule you write in prose is a{' '}
        <em>request</em> — the agent complies probabilistically. A rule you encode in a hook is a{' '}
        <em>guarantee</em> — it fires every time, deterministically, regardless of what the model decided
        to do. The analogy worth carrying: you would never secure a database by leaving a comment that
        says &ldquo;please don&apos;t drop tables.&rdquo; You&apos;d write a permission system. Hooks are
        the permission system for agents. They&apos;re how Lesson 2&apos;s deterministic guardrails
        actually attach to a probabilistic actor.
      </Lead>

      <Section label="What a hook is">
        <P>
          A hook is a piece of deterministic code that runs at a defined point in the agent&apos;s
          lifecycle — before it uses a tool, after it writes a file, before it commits, when it tries to
          stop. It inspects what just happened (or is about to) and either allows it, blocks it, or feeds
          information back. No model in the loop. Plain code, plain logic, every time.
        </P>
      </Section>

      <Section label="Pre vs Post — and why feedback beats blocking">
        <P>
          Hooks come in two shapes. <strong>PreToolUse</strong> hooks run before an action and can block
          it — the guardrail. <strong>PostToolUse</strong> hooks run after, as middleware. The skill
          upgrade most teams miss: a PostToolUse hook that <em>injects feedback into the agent&apos;s
          context</em> is dramatically more valuable than one that merely blocks. A blocked agent stops.
          An agent handed &ldquo;your change failed these two tests&rdquo; fixes itself and continues.
          Feedback loops make agents better; gates just make them stop. Use both — but reach for feedback
          wherever the failure is recoverable.
        </P>
      </Section>

      <Section label="Gates must be computational, not inferential">
        <P>
          Lesson 2&apos;s axis decides what belongs in a hook. A gate is a linter, a type check, a test
          run, a secret scanner, a CI step — something with a deterministic answer. The moment you find
          yourself wanting to put an LLM in the gate to judge whether the output is &ldquo;good,&rdquo;
          stop: you&apos;ve reintroduced the probabilistic problem the hook was supposed to solve. Keep
          the routing and gating logic in plain code.
        </P>
      </Section>

      <BlockQuote attribution="Paraphrasing Cobus Greyling">
        A comment asking the code not to drop tables is not security. The hook is.
      </BlockQuote>

      <Section label="How to design your hooks">
        <BulletList>
          <Bullet>
            <strong>Start from your failure log,</strong> not from the hook events. List what Forge
            actually gets wrong, then ask which failures are deterministically detectable.
          </Bullet>
          <Bullet>
            <strong>For each, choose the shape:</strong> Pre-block for things that must never happen
            (secrets, destructive commands); Post-feedback for things that can be detected and fixed
            (failing tests, lint errors).
          </Bullet>
          <Bullet>
            <strong>Keep every check computational.</strong> If you can&apos;t write the check without an
            LLM, it&apos;s a prompt or context problem, not a hook.
          </Bullet>
        </BulletList>
      </Section>

      <Section label="Forge — worked example">
        <CodeBlock>{`EVENT              CHECK (deterministic)      ACTION
PreToolUse:write    gitleaks scan on diff      BLOCK if secret found
PreToolUse:bash     command in allowlist?      BLOCK if not (no rm -rf)
PostToolUse:write   eslint + tsc on the file   FEEDBACK: inject errors
PostToolUse:test    test runner exit code      FEEDBACK: inject failures
PreCommit           max-lines-per-function     BLOCK: return the fn
Stop                all CI gates green?        BLOCK stop until green`}</CodeBlock>
        <P>
          The two FEEDBACK rows are what make Forge self-correcting: a failed test isn&apos;t a dead end,
          it&apos;s a note the agent reads and acts on. The four BLOCK rows are the things you&apos;d
          never accept no matter how confident the model sounded.
        </P>
      </Section>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '10px' }}>
          You&apos;ll be given four real Forge failure modes — one security risk, one recoverable error,
          one style violation, and one that turns out <em>not</em> to be hookable at all. For each, design
          the response: Pre or Post, block or feedback — or flag it as a prompt/context problem in
          disguise.
        </p>
        <p>
          Submit and you&apos;ll see a senior PM&apos;s hook design, with the reasoning for each shape
          and a note on the one failure that should never have been a hook.
        </p>
      </ExerciseLeadIn>
      <Exercise spec={HARNESS_EXERCISES['lesson-4']} />
    </div>
  )
}

// ── HE Lesson 5 ───────────────────────────────────────────────────────────────

export function HELesson5Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        Hooks catch the failures you can name in advance. Verification loops catch the ones you
        can&apos;t — by structurally separating the act of doing the work from the act of checking it.
        The shift is from one model improvising its way through a task to a pipeline that plans, executes,
        and verifies as distinct steps.
      </Lead>

      <P>
        The naive agent loop interleaves reasoning and action, deciding the next move as it goes.
        Separating planning from execution buys you better security and cost properties — you can review
        the plan before anything runs, and route each phase to the cheapest model that can do it. But the
        move that actually makes verification work is counterintuitive, and most teams get it wrong:{' '}
        <strong>the verifier must be implemented differently from the planner</strong>, or it simply
        re-confirms the planner&apos;s own mistakes.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Plan-then-Execute beats the interleaved ReAct loop for reliability: separating planning from
            acting makes the plan reviewable and the system cheaper and safer.
          </Bullet>
          <Bullet>
            Two shapes, two uses: Plan-Validate-Execute checks the plan before acting; Plan-Execute-Verify
            checks the result after. Validate before when actions are costly or irreversible; verify after
            when the result is cheaply checkable.
          </Bullet>
          <Bullet>
            The single most important principle: the verifier must have a different implementation than
            the planner. A verifier that reasons like the planner will approve the same error it would
            have made.
          </Bullet>
          <Bullet>
            Route the phases: a cheap planner, a capable executor, a cheap validator — with the router
            itself written in plain Python, no LLM making the routing call.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        This is the artifact for the lesson: Forge&apos;s PEV loop, written out as plan → execute →
        verify, with the verifier deliberately built on a different check than the one that produced the
        plan. When you brief engineering, this is the diagram you hand them.
      </Lead>

      <Exercise spec={HARNESS_EXERCISES['lesson-5']} />
    </div>
  )
}

// ── HE Lesson 6 ───────────────────────────────────────────────────────────────

export function HELesson6Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        Long agent runs accumulate clutter. By the time Forge has read thirty files to find the right
        call sites, its context is full of detail it no longer needs — and that noise degrades everything
        that comes after. Sub-agents are the primitive that solves this: a sub-agent is less a
        &ldquo;team of agents&rdquo; idea than a way to quarantine a noisy task and return only its
        conclusion.
      </Lead>

      <P>
        A sub-agent runs in its own fresh context, does a bounded piece of work, and hands back a clean
        result — the noise stays behind. That&apos;s the first benefit, context management;
        parallelization is the second. But sub-agents aren&apos;t free: they start cold, so they need
        time to gather their own context, they can&apos;t spawn further sub-agents, and they return only
        a final result. The decision of when to use one is a judgment call with a sharp heuristic.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Two benefits, clear boundaries: context management and parallelization; but sub-agents start
            fresh, can&apos;t spawn their own sub-agents, and return only a final summary.
          </Bullet>
          <Bullet>
            The heuristic to memorize: use a sub-agent when the work is noisy, bounded, and easy to
            summarize. Stay in the main thread when the work is small, tightly coupled, or depends on a
            shared mental model a summary would weaken.
          </Bullet>
          <Bullet>
            The economics: a capable orchestrator that plans and reviews, directing cheap workers that
            execute, can cut token cost 5–10x with little quality loss.
          </Bullet>
          <Bullet>
            This is also the resolution to the multi-agent debate: orchestrator-and-workers with isolated
            context — not a chatty mesh of peers — is the pattern that survives production.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Map it onto Forge: the &ldquo;read thirty files to find every call site&rdquo; job is noisy,
        bounded, and summarizable — a textbook sub-agent. The &ldquo;decide the overall refactor
        strategy&rdquo; job is tightly coupled and needs the full mental model — keep it in the main
        thread. Getting that split right is most of the skill.
      </Lead>

      <Exercise spec={HARNESS_EXERCISES['lesson-6']} />
    </div>
  )
}

// ── HE Lesson 7 ───────────────────────────────────────────────────────────────

export function HELesson7Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        A long-running agent has a memory-management problem that looks exactly like the one programming
        languages spent decades solving. Context accumulates, goes stale, and eventually crowds out the
        live working set. Handling it well is its own discipline — and handling it badly produces a
        failure so quiet you won&apos;t see it in any log.
      </Lead>

      <P>
        The mistake is treating this as one problem with one fix. There are three distinct problems with
        three distinct mechanisms, and conflating them is where teams go wrong. And underneath all three
        sits a failure mode borrowed straight from memory management: the agent continuing to reason from
        a conclusion built on evidence it can no longer see — a use-after-free, in everything but name.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The taxonomy: compaction compresses the whole window when it grows too large; clearing drops
            stale, re-fetchable data inside the window; memory moves information out of the window so it
            survives across sessions. Three problems, three mechanisms.
          </Bullet>
          <Bullet>
            The invisible failure: context editing is a garbage collector without write barriers. The
            agent keeps reasoning from a model built on evidence it has since dropped — confident, and
            wrong, with no error to catch.
          </Bullet>
          <Bullet>
            The operational rule: compaction should preserve the active objective, current truth, key
            decisions, unresolved errors, and next move — and it should happen at natural task boundaries,
            not when the window is nearly full.
          </Bullet>
          <Bullet>
            Why the boundary matters: by the time the window is almost full, the run has already been
            carrying stale branches for too many turns. Compact early, at the seam between tasks, while
            the working set is still clean.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        The artifact: Forge&apos;s garbage-collection policy across a long run — what gets compacted,
        what gets cleared, what gets written to durable memory, and at which boundaries each fires. This
        is the document that keeps a twelve-step agent run from quietly losing the plot at step seven.
      </Lead>

      <Exercise spec={HARNESS_EXERCISES['lesson-7']} />
    </div>
  )
}

// ── HE Lesson 8 (full) ────────────────────────────────────────────────────────

export function HELesson8Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        Everything so far has been building toward one skill: when something goes wrong, knowing{' '}
        <em>which layer to fix</em>. This is the capstone, because it&apos;s the decision a senior AI PM
        makes dozens of times and a junior one makes wrong by reflex. And it&apos;s the purest expression
        of harness thinking, because the right answer is almost never &ldquo;the prompt&rdquo; — even
        though the prompt is what everyone reaches for first.
      </Lead>

      <Section label="The canonical decision">
        <P>
          Here&apos;s the situation — Forge keeps writing 200-line functions, even though your style
          guide caps them at 50. Four options:
        </P>
        <BulletList>
          <Bullet>
            <strong>(a)</strong> Tighten the prompt to emphasize the rule.
          </Bullet>
          <Bullet>
            <strong>(b)</strong> Add the rule to the system prompt.
          </Bullet>
          <Bullet>
            <strong>(c)</strong> Put it in AGENTS.md.
          </Bullet>
          <Bullet>
            <strong>(d)</strong> Add an ESLint rule and a pre-commit hook.
          </Bullet>
        </BulletList>
        <P>
          (a) and (b) are prompt-engineering mode — you&apos;re asking more loudly and hoping compliance
          climbs from 80% to maybe 92%. (c) is context-engineering mode — better, but still a request
          the agent can ignore. (d) is harness engineering: a deterministic gate that makes the violation{' '}
          <em>impossible to merge</em>, not merely discouraged. The function-length rule is something
          you&apos;d reject in code review every single time — which means probabilistic compliance is the
          wrong tool. The great answer is <strong>(d), with (c) as backup</strong>: enforce it
          deterministically, and document it so the agent gets it right more often before the gate even
          fires.
        </P>
      </Section>

      <Section label="The diagnostic flowchart">
        <P>
          The general move is to map the failure to the constraint type:
        </P>
        <BulletList>
          <Bullet>
            <strong>Inconsistent output across sessions</strong> → a rules file. The agent doesn&apos;t
            reliably <em>know</em> the convention.
          </Bullet>
          <Bullet>
            <strong>Security or correctness gaps you&apos;d reject in review</strong> → deterministic
            enforcement at the hook or CI layer. Never a request.
          </Bullet>
          <Bullet>
            <strong>The agent doesn&apos;t know a fact about your system</strong> → context. Update what
            it&apos;s given, not how loudly you ask.
          </Bullet>
          <Bullet>
            <strong>Genuinely stylistic, no deterministic check possible</strong> → the prompt. This is
            the small residual where prompt engineering is actually the right answer.
          </Bullet>
        </BulletList>
      </Section>

      <Section label="Computational before inferential, always">
        <P>
          The axis from Lesson 2 is the tiebreaker. Before you touch the prompt, ask: can a computer
          check this? If yes, the answer lives in the harness, and a prompt edit is a worse, flakier
          version of the right fix. The discipline that separates senior from junior here is resisting the
          reflex — the prompt feels like the fastest fix, and it&apos;s usually the most fragile.
        </P>
      </Section>

      <BlockQuote attribution="Paraphrasing Augment Code">
        Probabilistic compliance only becomes reliable when you pair it with deterministic constraints.
      </BlockQuote>

      <Section label="Forge — worked example">
        <CodeBlock>{`FAILURE                          LAYER            WHY
200-line functions despite       HARNESS          computational rule;
  the 50-line style guide        (+ context)      you'd reject it in review
                                                  → eslint + pre-commit hook

Uses last year's API shape       CONTEXT          it doesn't *know* the
  that we deprecated                              new API → update the
                                                  retrieved docs, not prompt

PR descriptions too terse        PROMPT           genuinely stylistic,
  for the team's taste                            no deterministic check
                                                  → the rare prompt fix`}</CodeBlock>
      </Section>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '10px' }}>
          You&apos;ll inhabit the decision before you learn the framework. A fresh Forge failure lands in
          your queue — you pick the layer you&apos;d fix, and only then see how each option plays out:
          which ones quietly fail again next week, which one holds, and what each costs.
        </p>
        <p>
          Make the call first; the reasoning comes after. This is the lesson that behaves most like a
          LearnSignal scenario — and it&apos;s the seed of one. Make your choice, live with the
          consequence, then read why.
        </p>
      </ExerciseLeadIn>
      <Exercise spec={HARNESS_EXERCISES['lesson-8']} />
    </div>
  )
}

// ── HE Lesson 9 ───────────────────────────────────────────────────────────────

export function HELesson9Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        The harness isn&apos;t only where your reliability lives — it&apos;s where your unit economics
        live. The same architectural choices that make Forge safe also decide whether a single agent run
        costs you cents or dollars, and for a product priced at a monthly subscription, that math is the
        difference between a margin and a liability.
      </Lead>

      <P>
        Two levers move the cost more than anything else, and both are harness decisions, not prompt
        decisions. The first is <strong>routing</strong>: not every step needs your most capable model.
        The second is the <strong>computational-vs-inferential split</strong> from Lesson 2, now read as
        a budget — deterministic checks are essentially free to run, while every inferential check spends
        tokens and latency.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Orchestrator-worker routing: a capable orchestrator that plans and reviews, directing cheap
            workers that execute, cuts token cost 5–10x with little quality loss.
          </Bullet>
          <Bullet>
            Phase routing (the PEV pattern): a cheap planner, a capable executor, a cheap validator —
            route each phase to the cheapest model that can do it, with a plain-code router.
          </Bullet>
          <Bullet>
            The spend rule: computational gates (linters, tests, type checks) are nearly free;
            inferential checks (LLM-as-judge) are metered. Use inferential only where a computer
            genuinely can&apos;t decide.
          </Bullet>
          <Bullet>
            The trap: paying for an LLM to check something a linter could have caught is the most common
            avoidable cost in agentic products — and it&apos;s slower and less reliable too.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Model it on Forge: the same run, costed with and without harness routing, often shows a 5–10x
        gap — and the cheaper version is usually the more reliable one, because deterministic checks
        don&apos;t just cost less, they fail less. Good harness economics and good harness reliability are
        the same decision.
      </Lead>

      <Exercise spec={HARNESS_EXERCISES['lesson-9']} />
    </div>
  )
}

// ── HE Lesson 10 ──────────────────────────────────────────────────────────────

export function HELesson10Body() {
  return (
    <div>
      <ForgeBox />

      <Lead>
        A warning to close on, because it&apos;s the mistake sophisticated teams make rather than naive
        ones: it&apos;s possible to over-build the harness. The harness is scaffolding around a model
        that keeps getting more capable — and scaffolding is supposed to come down. The goal was never the
        most elaborate harness. It&apos;s the smallest one that ships reliably today.
      </Lead>

      <P>
        As models improve, harness complexity should <em>decrease</em>, not grow. Capabilities you
        scaffold around today — careful step decomposition, heavy verification, elaborate context
        management — get absorbed into the model tomorrow, and the scaffolding you built becomes dead
        weight you have to maintain. The discipline is to build for the model you have, and to know which
        parts of your harness are temporary compensation versus permanent structure.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The scaffolding principle: as models improve, harness complexity should go down. Build the
            minimum that makes today&apos;s model reliable, and plan to remove pieces as the model climbs.
          </Bullet>
          <Bullet>
            The debate worth holding both sides of: harness engineering as a subset of context engineering
            (it all resolves to context-window management at runtime) versus a superset that contains it
            (Hashimoto, OpenAI, Anthropic, Fowler). The superset view is winning by mid-2026, but the
            subset framing is serious and clarifying.
          </Bullet>
          <Bullet>
            The practical filter: don&apos;t engineer harness for a capability the next model release will
            have natively. Distinguish temporary compensation from structural necessity.
          </Bullet>
          <Bullet>
            The synthesis: prompts say what to do, context says what it knows, the harness decides how it
            runs — and the mark of a great AI PM is the smallest harness that ships reliably, shrinking as
            the models grow.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Run it on Forge one last time: which of the guardrails you built across this course are
        structural — the security blocks, the CI gates you&apos;d keep forever — and which are temporary
        scaffolding that a more capable model will let you delete in twelve months? Knowing the difference
        is the most senior judgment in the discipline, and it&apos;s where this course ends and the real
        work begins.
      </Lead>

      <Exercise spec={HARNESS_EXERCISES['lesson-10']} />
    </div>
  )
}
