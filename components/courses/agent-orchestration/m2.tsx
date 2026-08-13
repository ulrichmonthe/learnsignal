// Agent Orchestration — Module 2 lesson bodies (Track 02).
// AOLesson3Body: Module 2 intro + 2.1 Fan-out + 2.2 Pipeline.
// AOLesson4Body: 2.3 Debate, 2.4 Supervisor, 2.5 Swarm, 2.6 table, 2.7 composition, 2.8 exercise.
// Server components — no 'use client'.

import {
  Divider,
  Section,
  SubHead,
  P,
  CodeBlock,
  ExerciseLeadIn,
} from '@/components/courses/lesson-helpers'
import { TopologyExplorer } from '@/components/courses/explainers/topology-explorer'

// ── Lesson 3 — Fan-out and pipeline ──────────────────────────────────────────

export function AOLesson3Body() {
  return (
    <div>
      <p
        className="mb-10"
        style={{
          fontSize: '17px',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '1.65',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        Five patterns dominate production systems. That is not a stylistic claim — they are
        operationally distinct, with different cost structures, different failure surfaces, and
        different framework support. Learn them as a set, because most real systems are two of them
        composed, and a composed system inherits both failure modes.
      </p>

      <P>
        The centrepiece of this module is below. Cycle through all five shapes, watch how the request
        moves, and notice that each one answers the three orchestration questions — which call happens
        next, with what context, on what failure — in a different way. Then we go deep on the two you
        will build first: fan-out and pipeline.
      </P>

      <div className="my-10">
        <TopologyExplorer />
      </div>

      <Divider />

      <Section label="2.1 · Fan-out — parallel scatter–gather">
        <P>
          One request splits into N independent branches that run at the same time. A reconciler merges
          the results.
        </P>

        <CodeBlock>{`              ┌─ B1 ─┐
   request ───┼─ B2 ─┼──> reconciler ──> output
              ├─ B3 ─┤
              └─ B4 ─┘`}</CodeBlock>

        <SubHead>Mechanics</SubHead>
        <P>
          One request fans out to N branches that run concurrently. A reconciler — sometimes a model
          call, sometimes just code, sometimes nothing at all, which is the problem — merges what comes
          back.
        </P>

        <SubHead>Cost and latency</SubHead>
        <P>
          Cost is <strong>Σ branch_cost + reconciler_cost</strong>: multiplicative in N. This is the
          most expensive pattern per request after debate, and the one where cost most often surprises
          the team — because latency stays flat while spend scales linearly, and the dashboard everyone
          watches is latency.
        </P>
        <P>
          Latency is <strong>max(branch p95) + reconciler</strong>. Your system is as slow as its
          slowest branch, always. Adding a sixth fast branch costs money and saves nothing.
        </P>

        <SubHead>Reliability</SubHead>
        <P>
          It depends entirely on the reconciler. If branches conflict and nothing resolves them, the
          &quot;winner&quot; is decided by output ordering or by whichever branch the merge prompt
          happened to read first. That is not a decision. It is a coin flip with a paper trail.
        </P>

        <SubHead>How it fails in production</SubHead>
        <P>
          <strong>Cost explosion:</strong> usage triples, spend triples, exactly linear — the signature
          of no caching. <strong>Abandonment waste:</strong> you pay for all N branches on requests the
          user abandons; at an 80% completion rate you are burning 20% of your entire spend on outputs
          nobody reads. <strong>Silent conflict:</strong> two branches disagree, nobody reconciles, and
          the confidently inconsistent output passes review because it reads well. <strong>Straggler
          tail:</strong> one branch times out, and you either wait or return partial results and pretend
          that was intentional.
        </P>

        <SubHead>When it is right — and when it is not</SubHead>
        <P>
          Right when the subtasks are genuinely independent, latency matters more than spend, and you
          have a real reconciliation rule. Not right when branches need each other&apos;s results, or
          your reconciler is a model call with no tie-break rule, or you have not costed it at 3×
          current volume.
        </P>

        <SubHead>Diagnostic questions</SubHead>
        <P>
          What resolves a conflict between branches? What fraction of requests are abandoned before the
          output is used? What is the cache hit rate on the shared context? If we deleted branch 4, what
          measurably gets worse?
        </P>
      </Section>

      <Divider />

      <Section label="2.2 · Pipeline — sequential chain">
        <P>
          Each stage consumes the previous stage&apos;s output and produces the next stage&apos;s input.
          The most common production topology by a distance — and the one most likely to have been built
          by accident.
        </P>

        <CodeBlock>{`   request ──> S1 ──> S2 ──> S3 ──> S4 ──> S5 ──> output`}</CodeBlock>

        <SubHead>Cost and latency</SubHead>
        <P>
          Cost is <strong>Σ stage_cost</strong>: additive and predictable, the cheapest of the five per
          request. Latency is <strong>Σ stage p95</strong> — a conservative ceiling, since stages rarely
          hit p95 together, but the right number for planning. Latency is the pipeline&apos;s real tax.
        </P>

        <SubHead>Reliability — the hinge of the whole course</SubHead>
        <P>
          Reliability is <strong>Π stage_accuracy</strong> — the product of the per-stage accuracies,
          not the average. This is the single most important formula you will meet.{' '}
          <strong>Five stages at 95% is a 77% system.</strong> Nearly one run in four is wrong
          end-to-end, and every stage individually looked fine in review. Sit with that number now;
          Lesson 5 is devoted entirely to it — error budgets, per-stage targets, and the validation
          gates that keep a chain honest.
        </P>

        <SubHead>How it fails in production</SubHead>
        <P>
          <strong>Error compounding:</strong> stage 2 confidently builds on stage 1&apos;s mistake, and
          every downstream stage adds fluency to the error, which makes it harder to spot, not easier.{' '}
          <strong>Silent structural validity:</strong> the wrong answer is well-formed, so your
          monitoring says every step succeeded — because every step did succeed at producing an output.{' '}
          <strong>No doubt propagation:</strong> stage 1 was 60% sure, stage 2 has no way to know that
          and treats it as fact; confidence is manufactured out of nothing between stages.{' '}
          <strong>Latency accretion:</strong> each stage looks fine at 3 seconds, and five of them is a
          user leaving.
        </P>

        <SubHead>When it is right — and when it is not</SubHead>
        <P>
          Right when each stage&apos;s output is cheaply verifiable before the next stage consumes it,
          and the stages genuinely depend on each other in order. Not right when you cannot validate
          between stages, or the stages are not truly ordered and you chained them out of habit.
        </P>

        <SubHead>Diagnostic questions</SubHead>
        <P>
          What is the measured accuracy of each stage? What validates stage N&apos;s output before stage
          N+1 runs? Can a stage express uncertainty, and does anything downstream read it? What is our
          end-to-end accuracy on a golden set?
        </P>
      </Section>
    </div>
  )
}

// ── Lesson 4 — Debate, supervisor, swarm, composition ────────────────────────

export function AOLesson4Body() {
  return (
    <div>
      <p
        className="mb-10"
        style={{
          fontSize: '17px',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '1.65',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        Three more patterns, each buying you something specific and charging for it in a specific way —
        debate for contested judgement, supervisor for hierarchical routing, swarm for open-ended
        exploration. Then the comparison table that puts all five side by side, and the part where teams
        actually get hurt: composition.
      </p>

      <Section label="2.3 · Debate — multi-perspective critique">
        <CodeBlock>{`   request ──> A1 ┐
               A2 ├── round 1 ── round 2 ── judge ──> output
               A3 ┘`}</CodeBlock>

        <SubHead>Mechanics and cost</SubHead>
        <P>
          Several agents produce and critique positions over one or more rounds; a judge, or a consensus
          rule, picks the answer. Cost is <strong>rounds × Σ agent_cost + judge_cost</strong> — the most
          expensive pattern in the set by a wide margin. Three agents over two rounds with a judge is
          seven calls to answer one question. Latency is{' '}
          <strong>rounds × max(agent p95) + judge</strong>: rounds are serial even when the agents
          inside a round are parallel.
        </P>

        <SubHead>How it fails</SubHead>
        <P>
          <strong>Consensus theatre:</strong> same model, same context, N instances — they agree because
          they share priors, not because the answer is right, and the team reads the low disagreement
          rate as a health metric when it is the opposite. <strong>Convergence on the confident wrong
          answer:</strong> in critique rounds fluency and certainty win, and confidence is not correlated
          with correctness. <strong>Cost with no measured benefit:</strong> very few teams have run the
          ablation — same task, one call, same rubric — so run it before you keep the pattern.
        </P>

        <SubHead>When it is right</SubHead>
        <P>
          Genuinely contested judgement, an external arbiter or ground truth exists, the agents differ in
          model or context or retrieval, and you have measured the lift against a single call. For
          anything with a verifiable right answer, use a verifier, not a debate — verification against
          sources beats consensus among peers, at a fraction of the cost.
        </P>
      </Section>

      <Divider />

      <Section label="2.4 · Supervisor — hierarchical delegation">
        <CodeBlock>{`                 ┌──> W1
   request ──> SUP ──> W2 ──> SUP ──> output
                 └──> W3`}</CodeBlock>

        <SubHead>Mechanics and cost</SubHead>
        <P>
          A supervisor agent receives the request, delegates to specialist workers, and assembles the
          result. Workers do not talk to each other. Cost is{' '}
          <strong>supervisor_cost × (delegations + 1) + Σ worker_cost</strong>: the supervisor is called
          repeatedly and its context grows with every worker result it absorbs. Coordination overhead is
          typically 10–25% of spend and rises with team size. Latency is{' '}
          <strong>supervisor p95 × (delegations + 1) + worst worker path</strong> — every delegation is a
          round trip through the top.
        </P>

        <SubHead>How it fails</SubHead>
        <P>
          <strong>Bottleneck:</strong> all traffic routes through one call — throughput ceiling, latency
          floor. <strong>Context bloat:</strong> the supervisor accumulates every worker&apos;s output,
          so by delegation five it is reasoning over a wall of text and its routing degrades exactly when
          the task is hardest. <strong>Timeout fallthrough:</strong> it times out on long, complex
          requests, and some implementations then proceed unsupervised — failing to supervise precisely
          the cases that most needed it. <strong>Permission concentration:</strong> the supervisor often
          ends up holding the union of every worker&apos;s credentials, a serious security posture
          problem.
        </P>

        <SubHead>When it is right</SubHead>
        <P>
          Clear routing between specialists with distinct permission boundaries, where the supervisor
          needs only a summary — not the full context — to decide. Not right when it needs the complete
          context of every worker to make its call: at that point you have one agent with extra steps and
          extra cost.
        </P>
      </Section>

      <Divider />

      <Section label="2.5 · Swarm — dynamic peer agents">
        <CodeBlock>{`   A1 <──> A2
    ↕   ✕   ↕      agents hand off to each other dynamically,
   A3 <──> A4      no fixed route, termination decided by the agents`}</CodeBlock>

        <SubHead>Mechanics and cost</SubHead>
        <P>
          Peer agents hand control to each other based on their own judgement. No predetermined route;
          the system decides when it is finished. Cost is{' '}
          <strong>expected_steps × avg_step_cost</strong>, and expected_steps is{' '}
          <strong>unbounded unless you cap it</strong>. There is no natural stopping condition in a peer
          network — only the one you impose. Latency is unbounded for the same reason. The reliability
          ceiling is the highest of the five on genuinely open-ended exploratory work, and the floor is
          the lowest on everything else.
        </P>

        <SubHead>How it fails</SubHead>
        <P>
          <strong>Unbounded loops:</strong> two agents hand back and forth, each convinced the other
          should finish, and your bill finds out before you do. <strong>Unexplainability:</strong>{' '}
          without per-step provenance you cannot reconstruct why the system said what it said, which
          makes the output indefensible to a client, an auditor or a regulator. <strong>Emergent
          behaviour you did not specify:</strong> sometimes good, never predictable, never something to
          put in front of a customer without a cap and a trace.
        </P>

        <SubHead>When it is right</SubHead>
        <P>
          Exploratory research, internal tooling, a hard budget ceiling, full tracing, and a human
          reading the output before anyone acts on it. Not right for anything customer-facing, regulated,
          deadline-bound, or where you will need to explain a specific output six weeks later. The
          non-negotiable prerequisites — if you cannot fund all four, you cannot afford the pattern — are
          a step cap, a total budget cap, a full trace with per-claim provenance, and a named human who
          can reconstruct any run.
        </P>
      </Section>

      <Divider />

      <Section label="2.6 · The comparison table">
        <P>All five, side by side. This is the reference you take into a review.</P>

        <CodeBlock>{`                    | Fan-out          | Pipeline         | Debate           | Supervisor          | Swarm
--------------------+------------------+------------------+------------------+---------------------+------------------
 Cost per request   | N × branch       | Σ stages         | rounds × agents  | workers + overhead  | unbounded
 Latency            | max branch       | Σ stages         | rounds × agent   | delegations × sup   | unbounded
 Reliability driver | the reconciler   | Π accuracy       | independence     | supervisor quality  | the cap
 Fails by           | cost explosion,  | error            | consensus        | bottleneck,         | loops,
                    | unreconciled     | compounding      | theatre          | context bloat       | unexplainability
                    | conflict         |                  |                  |                     |
 Debuggability      | medium           | high             | low              | medium              | very low
 Best framework fit | any              | any              | AutoGen lineage  | LangGraph, Google   | LangGraph w/ caps,
                    |                  |                  |                  | ADK                 | custom
 Safe default?      | with caching     | YES              | no               | sometimes           | no`}</CodeBlock>

        <P>
          Read the bottom row. Pipeline is the only unqualified safe default; fan-out is safe only with
          caching; the rest earn their place case by case, or not at all.
        </P>
      </Section>

      <Divider />

      <Section label="2.7 · Composition — where teams actually get hurt">
        <P>
          Real systems compose. A supervisor that delegates to a pipeline, which fans out at stage 3.
          Composed topologies inherit every failure mode of their parts — and add one of their own:{' '}
          <strong>nobody owns the end-to-end number.</strong>
        </P>
        <P>
          The pipeline team measures pipeline accuracy. The fan-out team measures branch latency. No one
          measures what the user experiences, because it does not belong to anyone. The failure hides in
          the seam between two teams who are each, correctly, watching their own component.
        </P>
        <P>
          The rule that fixes it is one line: <strong>for every composed system, one person owns one
          end-to-end metric.</strong> If that person does not exist, the composition is not ready for
          production regardless of how good the individual components are.
        </P>
      </Section>

      <ExerciseLeadIn>
        <p style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '10px' }}>
          Name your topology.
        </p>
        <p style={{ marginBottom: '10px' }}>
          Draw your system. For each pattern present in it, write four things: the cost formula, the
          latency formula, the named failure mode, and the one metric that would tell you it is
          happening.
        </p>
        <p>
          Where you cannot fill in a number, write <strong>UNMEASURED</strong> in capitals. The count of
          UNMEASUREDs is your real result — it is the map of what you are flying blind on.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}
