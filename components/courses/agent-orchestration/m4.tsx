// Lesson bodies for the Agent Orchestration course, Module block 4.
// AOLesson7Body  ← source Module 5 (State, checkpoints and frameworks · Scenario 3)
// AOLesson8Body  ← source Module 6 (Independence and observability · Scenario 4)
// AOLesson9Body  ← source Module 7 (Autonomy and least agency · Scenario 5)
// AOLesson10Body ← source Module 8 (The security frame · no exercise)
// Server components — no 'use client'.

import {
  Section,
  P,
  SubHead,
  Divider,
  BlockQuote,
  CodeBlock,
  DataTable,
  ExerciseLeadIn,
} from '@/components/courses/lesson-helpers'
import { Exercise } from '@/components/courses/exercise'
import { AO_EXERCISES } from '@/lib/courses/exercises/agent-orchestration'
import { BlastRadiusExplainer } from '@/components/courses/explainers/blast-radius'

// ── Lesson 7 ─────────────────────────────────────────────────────────────────

export function AOLesson7Body() {
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
        Three weeks to a board demo. Two engineers, both good, both certain. Priya wants LangGraph —
        explicit graphs, durable state, checkpoints, the thing you can actually debug at 2am. She has
        shipped it before and estimates a week of setup before anything works end-to-end. Marcus wants
        CrewAI, and he has a working three-agent prototype already, built on a Saturday afternoon. He
        is running it live in the meeting, and it works.
      </p>

      <P>
        Neither is wrong. Priya is optimising for the system in six months. Marcus is optimising for
        the demo in three weeks. Both have stopped working while they wait for you — which means the
        cost of not deciding is now higher than the cost of deciding badly. This is the moment the
        exercise drops you into. You will make the call, and then write the paragraph that separates
        PMs: not the decision, but the conditions under which you would reverse it.
      </P>

      <Exercise spec={AO_EXERCISES['lesson-7']} />

      <Divider />

      <Section label="The four things an orchestrator must do that a prototype does not">
        <P>
          Marcus&apos;s prototype works in the room and will still work next week. That is not the
          question. The question is what production demands that a Saturday afternoon does not. There
          are exactly four things.
        </P>
        <CodeBlock>{`1. DURABLE STATE
   A run interrupted at step 4 resumes at step 4, not step 1.
   Without it, every long task is a coin flip against your uptime.

2. CHECKPOINTING WITH HUMAN-IN-THE-LOOP
   A run pauses for approval and resumes later with the human's
   answer folded into state. This is the precondition for
   everything in the autonomy lesson.

3. OBSERVABILITY
   You can reconstruct what happened, in order, with inputs and
   outputs, six weeks later, without a debugger.

4. FAILURE SEMANTICS
   Retries, timeouts and partial failure are defined behaviours
   rather than surprises.`}</CodeBlock>
        <P>
          Anything that cannot do all four is a prototyping tool. That is not an insult — prototyping
          tools are how you find out whether a thing is worth building. It becomes a problem only when
          a prototyping tool is in production and nobody has said so out loud.
        </P>
      </Section>

      <Divider />

      <Section label="Idempotency — the failure nobody warns you about">
        <P>
          The moment you add retries to a system that takes real-world actions, you have created a
          duplicate-action bug. Retry a step that charges a card and you have charged the card twice.
          This is exactly what happened on path B of the scenario: a run failed halfway through a
          customer onboarding, there was no checkpoint to resume from, it restarted from the
          beginning, and it double-charged the customer.
        </P>
        <P>
          Every action-taking step needs an <strong>idempotency key</strong> — a stable identifier
          such that repeating the same operation produces the same result rather than a second effect.
          This is ordinary distributed-systems hygiene, and it is skipped in agent systems constantly,
          because the demo never retried.
        </P>
        <BlockQuote>
          What happens if step 4 runs twice? If the answer is a shrug, that is your next ticket —
          ahead of anything on the roadmap.
        </BlockQuote>
      </Section>

      <Divider />

      <Section label="The state boundary — the actual decision">
        <P>
          Here is the reframe the whole lesson turns on. You are not really choosing a framework. You
          are choosing how much of your state the framework owns — because{' '}
          <strong>migration cost is proportional to how much of your state the framework owns.</strong>
        </P>
        <P>
          There are six kinds of state in an agent system. Decide, explicitly, who owns each. The
          right-hand column is not a preference; it is the difference between a framework switch that
          costs eleven days and one that costs a quarter.
        </P>
        <DataTable
          rows={[
            { label: 'Run state', value: 'Where this execution is, what is pending', note: 'YOU — in your database' },
            { label: 'Step outputs', value: 'What each step produced', note: 'YOU' },
            { label: 'Conversation', value: 'Messages in the current interaction', note: 'Framework is fine' },
            { label: 'Long-term memory', value: 'What persists across sessions', note: 'YOU — this is a product asset' },
            { label: 'Artefacts', value: 'Files, documents, generated outputs', note: 'YOU — in your storage' },
            { label: 'Audit log', value: 'Who did what, when, with what permission', note: 'YOU — always, no exceptions' },
          ]}
        />
        <P>
          Own rows one, two, four, five and six, and framework choice becomes a reversible decision
          measured in days. Let the framework own them and it becomes a rewrite measured in quarters.
        </P>
        <P>
          Roughly 28% of production multi-agent deployments run no framework at all. The actionable
          reading of that statistic: the teams running custom orchestration are overwhelmingly teams
          that hit a state, observability or compliance wall — not teams that started out ideological
          about frameworks. <strong>Their situation is your future situation</strong> if you let the
          abstraction own the things that make your product yours.
        </P>
      </Section>

      <Divider />

      <Section label="The framework landscape, mid-2026">
        <P>
          Dated deliberately. Re-verify before you cite it — this table has a shelf life of about two
          quarters, and the point of the course is the reasoning, not the row you happen to read
          today.
        </P>
        <CodeBlock>{`FRAMEWORK      MODEL / STATE                 WINS ON                    HURTS ON
LangGraph      Directed graph; built-in      Largest production         Steepest concept load —
               checkpointing, durable        footprint; HITL            you are learning a state
               execution, time travel        checkpoints; audit +       machine, not a wrapper
                                             rollback

CrewAI         Role-based crews; task        Fastest idea → working     Production observability
               outputs passed sequentially   prototype; lowest barrier  and error recovery; teams
                                                                        outgrow it

AutoGen →      Conversational group chat;    Research adoption;         In flux — AutoGen + Semantic
Microsoft      MAF is graph-based;           mature debate /            Kernel unified into MAF (now
Agent Fwk      in-memory by default          verification patterns      GA). Establish which one
                                                                        your team means

OpenAI         Explicit handoffs; context    Clean API inside an        Model lock-in; narrow handoff
Agents SDK     variables, ephemeral          OpenAI-first stack         patterns, not full orchestration

Google ADK     Hierarchical agent tree;      GCP-native, batteries      Opinionated; strongest inside
               session state, pluggable      included, good debug UI    its own ecosystem

Custom         Yours / yours                 Unusual observability,     You now maintain message
                                             state or regulatory needs  passing, retries, checkpointing
                                                                        and failure recovery`}</CodeBlock>
        <P>
          <strong>How to actually run this decision.</strong> Not by comparing feature tables — by
          writing down, in advance, the three things that would make you switch. If you cannot name
          them, you are not making a decision, you are expressing a preference. Then check: does the
          framework own any of them? If yes, that is your risk — and it is bounded by the state
          boundary, not by the framework&apos;s quality.
        </P>
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p className="mb-3">
          <strong>Your exit artefact: the state-boundary memo.</strong> One page you could send to
          both Priya and Marcus this afternoon.
        </p>
        <p>
          Write down: (1) the six kinds of state in your system, and where each lives today; (2) what
          would break if you changed orchestration framework next quarter; (3) the three conditions
          that would make you switch; (4) one thing you will move out of the framework this month.
        </p>
        <p className="mt-3">
          If the answer to point 2 is &quot;we&apos;d rewrite everything,&quot; you have found your
          real risk — and it was never which framework.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}

// ── Lesson 8 ─────────────────────────────────────────────────────────────────

export function AOLesson8Body() {
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
        Your regulatory-summarisation product uses five peer agents that critique each other&apos;s
        drafts before output. Your engineer built it after reading a paper. Internal quality ratings
        rose 14% when it shipped, and everyone was pleased. Last Tuesday it stated, in a client-facing
        summary, that a filing deadline had moved. It had not. The client rescheduled a team&apos;s
        work around it.
      </p>

      <P>
        You pull the trace. All five agents agreed. Three explicitly endorsed the claim during
        critique. The disagreement rate across the system, measured over 2,000 runs, is 6% — which the
        team has been reading as evidence that the system works. There is no record of <em>why</em> the
        claim was made. The transcript shows agreement, not reasoning. Nobody can tell you which agent
        originated it. The exercise asks you the question that matters more than any fix:{' '}
        <strong>why did five agents agree on something false?</strong>
      </P>

      <Exercise spec={AO_EXERCISES['lesson-8']} />

      <Divider />

      <Section label="Consensus is not evidence">
        <P>
          Five instances of the same model, given the same context, are not five opinions.{' '}
          <strong>They are one opinion sampled five times.</strong> In the scenario, agent 2
          originated the claim from a stale document in the retrieval index. The other four agreed
          because they had all been given the same document. There was never any independence in the
          system at all.
        </P>
        <P>
          Agreement between homogeneous agents measures shared priors, not truth. Which means a low
          disagreement rate is a warning sign rather than a health metric: it tells you the ensemble is
          not doing the thing you are paying five times for. Independence requires at least one of the
          following.
        </P>
        <DataTable
          rows={[
            { label: 'Different models', value: 'Different training, different failure modes', note: 'Cost: multi-provider complexity' },
            { label: 'Different context', value: 'The verifier does not see the drafter’s reasoning', note: 'Cost: careful context plumbing' },
            { label: 'Different retrieval', value: 'Different evidence, not the same stale document', note: 'Cost: index work' },
            { label: 'External ground truth', value: 'An actual arbiter rather than a vote', note: 'The hardest and the most valuable' },
            { label: 'Adversarial prompting', value: 'One agent told to find the flaw, not to agree', note: 'Cheap, and better than nothing' },
          ]}
        />
        <P>
          Debate without at least one of these is consensus theatre at N&times; the cost.
        </P>
      </Section>

      <Divider />

      <Section label="Verification beats critique">
        <P>
          For anything with a checkable answer,{' '}
          <strong>a verifier with sources beats a debate among peers</strong> — on both accuracy and
          cost. Most &quot;debate&quot; systems in production are trying to answer a factual question
          with a social mechanism. That is the whole bug.
        </P>
        <CodeBlock>{`                    DEBATE                      VERIFICATION
Question it answers "Do we agree?"               "Is this true?"
Needs               N agents × rounds            1 checker + sources
Cost                High                         Low
Fails by            Confident consensus          Missing sources
Right for           Genuinely contested          Everything factual
                    judgement with an arbiter`}</CodeBlock>
        <P>
          Regulatory summarisation is not a contested judgement. It has a right answer written down in
          a document. The correct instinct is not &quot;get the agents to argue better&quot; — it is
          &quot;go and read the document.&quot;
        </P>
      </Section>

      <Divider />

      <Section label="The metric trap">
        <P>
          That 14% quality lift was real, and it measured the wrong thing. Human raters without a
          strict rubric reward fluency, structure and confidence — and a multi-agent critique loop
          produces exactly those. The lift measured polish, and the team optimised for it.
        </P>
        <BlockQuote>
          Ask of any quality metric: what score would this give a confident, well-written falsehood?
          If the answer is &quot;a good one,&quot; the metric is measuring polish, and you are
          optimising for it.
        </BlockQuote>
      </Section>

      <Divider />

      <Section label="Observability — the four requirements">
        <P>
          You cannot manage what you cannot reconstruct. Before any multi-agent system takes
          customer-facing action, require all four of these. The second one is the single
          highest-value item on the list and the most commonly skipped.
        </P>
        <CodeBlock>{`1. A SPAN PER STEP
   Inputs, outputs, model, token counts, cost, latency, timestamp.
   Not logs — structured spans, queryable.

2. PER-CLAIM PROVENANCE
   For factual output, which source and which step produced it.
   Highest value on this list. Most commonly skipped.

3. REPLAY
   Take run #4471 and re-execute it, or at minimum read it start to
   finish. If "why did it say that" is a shrug, you do not have a
   product, you have a demo with customers.

4. COST AND STEP ATTRIBUTION
   Per run, per user, per step. This is how you find the loop
   before the invoice does.`}</CodeBlock>
      </Section>

      <Divider />

      <Section label="The metrics that are worth a dashboard">
        <P>
          Most agent dashboards show the wrong things. Success rate and average latency tell you
          almost nothing. Watch these instead.
        </P>
        <DataTable
          rows={[
            { label: 'Step-level success rate', value: 'Where the chain actually breaks' },
            { label: 'End-to-end task completion', value: 'The only number the user experiences' },
            { label: 'Loop depth distribution, p99', value: 'Catches unbounded behaviour before billing does' },
            { label: 'Budget-cap trip rate', value: 'If it is climbing, something changed upstream' },
            { label: 'Human override rate', value: 'The clearest signal of quality drift you will get' },
            { label: 'Cost per completed task, weekly', value: 'The economics number, tracked over time' },
            { label: 'Silent-failure estimate', value: 'From a sampled audit — the number nothing else will tell you' },
          ]}
        />
        <P>
          Note what is missing: disagreement rate, average tokens, model uptime. Those are inputs, not
          health.
        </P>
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p className="mb-3">
          <strong>Your exit artefact: the independence audit.</strong> For every multi-agent step in
          your system, fill one row:
        </p>
        <p>
          Step · Same model? · Same context? · Same retrieval? · Independent by what mechanism? Any
          row where the last column is blank is a row where you are paying a multiple for a single
          opinion.
        </p>
        <p className="mt-3">
          Then answer the three observability questions: can you produce the trace for a specific run
          from last month, can you attribute a specific claim to a source, and can you say what a run
          cost? Three shrugs is three tickets.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}

// ── Lesson 9 ─────────────────────────────────────────────────────────────────

export function AOLesson9Body() {
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
        Your support agent has been live four months. It handles refunds — not issues them,{' '}
        <em>recommends</em> them, and a human clicks approve. Approval rate is 96%. Median human review
        time is eleven seconds. Your ops lead has started calling it &quot;the click tax,&quot; and she
        has a proposal: let the agent issue refunds directly under £50. It would remove roughly 70% of
        the queue.
      </p>

      <P>
        The agent has access to the payments API, order history, the customer record and the ticket
        thread. Median refund is £23. Two facts to sit with. Of the 4% of refunds humans reject, most
        are not wrong refunds — they are correct refunds to customers already flagged for abuse, and{' '}
        <strong>the agent cannot see the abuse flag.</strong> And eleven seconds is not review. Eleven
        seconds is clicking. The exercise asks the one question almost nobody can answer about their
        own system: <strong>what is the maximum this agent can move in 24 hours if something goes
        wrong at 2am on a Sunday?</strong>
      </P>

      <Exercise spec={AO_EXERCISES['lesson-9']} />

      <Divider />

      <Section label="Least agency">
        <P>
          <strong>Grant only the minimum autonomy required for a safe, bounded task.</strong> The
          parallel to least privilege is deliberate, and the difference is the point. Least privilege
          bounds <em>what a system can reach</em>. Least agency bounds <em>what it can decide without
          you</em>. Agentic systems need both, and most teams have thought about neither.
        </P>
        <P>Four questions, in order, for any autonomy grant.</P>

        <SubHead>1 · Blast radius</SubHead>
        <P>
          What is the worst 24 hours — not the worst single event, the worst aggregate? The formula is
          simple, and doing the multiplication before you grant the permission is the entire skill.
        </P>
        <CodeBlock>{`blast radius = max value per action × max actions per detection window`}</CodeBlock>
        <P>
          In the scenario: £50 &times; the number of tickets the agent could process in the time it
          takes anyone to notice. If nobody looks until Monday, that window is 55 hours. Drag the
          three levers below and watch a &quot;fine&quot; number become an unacceptable one — then flip
          reversibility and watch the same number change meaning.
        </P>
        <BlastRadiusExplainer />

        <SubHead>2 · Reversibility</SubHead>
        <P>Can this be undone — by whom, how fast, and at what cost?</P>
        <DataTable
          rows={[
            { label: 'Free reversal', value: 'Draft, tag, categorise, internal note', note: 'Autonomy justified: High' },
            { label: 'Cheap reversal', value: 'Refund, reschedule, unpublish', note: 'Autonomy justified: Medium, with caps' },
            { label: 'Expensive reversal', value: 'Send external email, post publicly, alter a record of truth', note: 'Autonomy justified: Low' },
            { label: 'Irreversible', value: 'Delete data, transfer funds externally, submit a filing', note: 'Autonomy justified: Human, always' },
          ]}
        />
        <P>
          Reversibility justifies far more autonomy than accuracy does. A 90%-accurate agent doing
          reversible things is safer than a 99%-accurate agent doing irreversible ones.
        </P>

        <SubHead>3 · Detection latency</SubHead>
        <P>
          How long between a wrong action and someone knowing? If the answer is &quot;the monthly
          reconciliation,&quot; autonomy is not your problem — blindness is. Fix detection first. It is
          usually cheaper than fixing the model, and it improves every future decision.
        </P>

        <SubHead>4 · Checkpoint placement</SubHead>
        <P>
          Put the human where their judgement changes the outcome. Not where it produces a log line.
        </P>
      </Section>

      <Divider />

      <Section label="The autonomy ladder">
        <P>
          Move up one rung at a time, on evidence. The queue in the scenario was at rung 3 and being
          asked to jump to 5 — because rungs 2 to 4 feel like friction. The strong answer is a{' '}
          <em>conditional</em> rung 5: execute automatically only inside caps that are provably safe,
          and audit the rest.
        </P>
        <CodeBlock>{`RUNG                    THE AGENT             HUMAN ROLE            USE WHEN
1 · Suggest             Recommends, does      Decides and acts      New capability, unmeasured
                        nothing
2 · Draft               Prepares the action   Reviews and executes  Reversible, good accuracy
3 · Act with approval   Executes on a click   Approves each         Real but bounded consequence
4 · Act with notify     Executes, tells you   Can intervene         Cheap reversal, low volume
5 · Act with audit      Executes              Samples afterwards    Measured, capped, monitored
6 · Full                Executes              Exception handling    Free reversal only
                                              only`}</CodeBlock>
      </Section>

      <Divider />

      <Section label="Approval theatre">
        <P>
          <strong>A checkpoint a human passes in eleven seconds is not a control. It is a liability
          generator.</strong> It produces evidence of review without the review, which is strictly
          worse than no checkpoint — because it transfers accountability to a person who was never
          given the means to exercise it.
        </P>
        <P>You have three honest options:</P>
        <CodeBlock>{`1. MAKE IT REAL.
   Give the reviewer what the agent cannot see — the abuse flag,
   the duplicate-refund history, the risk score. Eleven seconds is
   not too short if the screen shows the one thing that matters.

2. BATCH IT.
   Twenty at a time, once an hour, with outliers surfaced. Better
   attention per decision than twenty interruptions.

3. REMOVE IT AND CONTROL THE RISK STRUCTURALLY.
   Caps, tiering, sampled audit, fast detection.`}</CodeBlock>
        <P>
          The worst option is the current one — and it is the one nearly every team is running. The
          design rule: <strong>review time should scale with consequence, not with volume.</strong> If
          your reviewers spend the same eleven seconds on a £5 refund and a £500 one, you have not
          designed a control, you have designed a queue.
        </P>
      </Section>

      <Divider />

      <Section label="Kill switches">
        <P>Every autonomous capability needs four things, and the last one is the one that gets skipped.</P>
        <DataTable
          rows={[
            { label: 'A flag', value: 'Disables the capability without a deploy' },
            { label: 'A named owner', value: 'A specific person who can pull it' },
            { label: 'A documented trigger', value: 'The condition under which they pull it' },
            { label: 'A test', value: 'Proof it works, run at least quarterly' },
          ]}
        />
        <P>Untested kill switches fail exactly when used.</P>
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p className="mb-3">
          <strong>Your exit artefact: the autonomy grant.</strong> For one action your system takes,
          write and date this. If you would not sign it, you do not yet have an autonomy design — you
          have a hope.
        </p>
        <CodeBlock>{`ACTION:
Autonomy rung (1–6):
Max value per action:
Max actions per detection window:
BLAST RADIUS (24h):
Reversibility class:
Detection latency:            Detected by:
Checkpoint: where, who, what they see, expected review time
Kill switch: flag, owner, trigger, last tested
Review date:`}</CodeBlock>
      </ExerciseLeadIn>
    </div>
  )
}

// ── Lesson 10 ────────────────────────────────────────────────────────────────

export function AOLesson10Body() {
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
        You do not need to run a threat model. You need to be able to do three things: recognise the
        dangerous shape when it appears in a design doc, use the same vocabulary as your security
        reviewer so the conversation takes an hour rather than a quarter, and know which risks your
        topology creates by construction. That is the whole job of this lesson.
      </p>

      <Section label="The vocabulary — and the distinction most coverage gets wrong">
        <P>
          The reference set is the <strong>OWASP Top 10 for Agentic Applications 2026</strong>,
          published 9 December 2025, with categories coded <strong>ASI01–ASI10</strong>. Use these as
          your default: they are ranked, incident-grounded, and the list your security team is most
          likely to be working from.
        </P>
        <P>
          One warning that will save you an embarrassing meeting. There is a second, separate OWASP
          document — <em>Agentic AI: Threats and Mitigations</em> — which uses{' '}
          <strong>T-codes</strong>. It is widely cited as T1–T15 from version 1.0; the current version
          1.1 (December 2025) extends it to T17.{' '}
          <strong>The two lists are different documents. Do not merge them, do not sum them, and do
          not cross-label them.</strong> A large share of the blog coverage does exactly that — which
          is a cheap way to spot writing that has not read the source.
        </P>
        <DataTable
          rows={[
            { label: 'ASI01 · Agent Goal Hijack', value: 'Any node that reads untrusted content and can influence the plan' },
            { label: 'ASI02 · Tool Misuse & Exploitation', value: 'Legitimate tools used at unintended volume, scope or chaining' },
            { label: 'ASI03 · Identity & Privilege Abuse', value: 'Nodes holding credentials beyond their task — supervisors especially' },
            { label: 'ASI04 · Agentic Supply Chain', value: 'Third-party tools, MCP servers, framework plugins composed at runtime' },
            { label: 'ASI05 · Unexpected Code Execution', value: 'Code-execution nodes, weak sandboxing' },
            { label: 'ASI06 · Memory & Context Poisoning', value: 'Persistent memory or shared context written by untrusted input' },
            { label: 'ASI07 · Insecure Inter-Agent Comms', value: 'Debate, swarm and supervisor topologies without authenticated messaging' },
            { label: 'ASI08 · Cascading Failures', value: 'Pipelines, and fan-outs from a shared upstream' },
            { label: 'ASI09 · Human–Agent Trust Exploitation', value: 'Approval theatre — the autonomy lesson’s eleven seconds' },
            { label: 'ASI10 · Rogue Agents', value: 'Dynamic peer topologies with no provenance' },
          ]}
        />
      </Section>

      <Divider />

      <Section label="The one path that matters most">
        <BlockQuote>
          Untrusted content reaching a node that can take an action is the dangerous shape.
        </BlockQuote>
        <P>
          A model cannot reliably distinguish instructions from content. So any text your system reads
          from outside your trust boundary — a web page, an email, an uploaded document, a customer
          message, a tool&apos;s response — is a potential instruction. If that content can influence a
          node that later calls a write-capable tool, you have a path from &quot;someone sent us a
          document&quot; to &quot;our system did something on their behalf.&quot;
        </P>
        <P>Draw this on your architecture diagram right now:</P>
        <CodeBlock>{`1. Mark every node that INGESTS UNTRUSTED CONTENT.
2. Mark every node that CAN WRITE — take an action with external effect.
3. Trace every path from the first set to the second.`}</CodeBlock>
        <P>
          Each such path needs at least one of: a human checkpoint, a deterministic policy check the
          model cannot talk its way past, a strict allowlist on the tool, or a hard cap on the action.{' '}
          <strong>&quot;We told the model not to&quot; is not a control.</strong>
        </P>
      </Section>

      <Divider />

      <Section label="What each topology gives you by construction">
        <P>
          You already know the five topologies. Each one arrives with a specific pair of risks and a
          specific control to ask for. You do not have to invent these in the meeting — you have to
          name them.
        </P>
        <CodeBlock>{`TOPOLOGY     COMES WITH        THE SPECIFIC CONTROL TO ASK FOR
Pipeline     ASI08, ASI06      Validation between stages; separate trusted
                               instructions from retrieved content
Fan-out      ASI08, ASI02      Per-branch budget caps; a reconciler with a
                               deterministic tie-break
Debate       ASI07, ASI09      Authenticated inter-agent messaging; a
                               ground-truth arbiter
Supervisor   ASI03, ASI01      The supervisor holds no credentials it does
                               not need for routing
Swarm        ASI10, ASI07,     Step caps, budget caps, per-claim provenance,
             ASI08             a named human`}</CodeBlock>
        <P>
          Note the recurring one. <strong>A supervisor tends to accumulate the union of its
          workers&apos; permissions</strong>, which turns your convenience layer into your largest
          single credential holder. Ask about it explicitly; it will not come up on its own.
        </P>
      </Section>

      <Divider />

      <Section label="The five questions to bring to a security review">
        <P>Bring these five, in this order. They are phrased in language your security team already uses.</P>
        <CodeBlock>{`1. Where does untrusted content enter, and what is the shortest
   path from there to an action?

2. Which node holds the broadest credentials, and does it need
   them for every task or for one?

3. What can be written to persistent memory, by whom, and what
   validates it?

4. What third-party tools and MCP servers are composed at runtime,
   and who reviewed them?

5. What is the blast radius, and what detects it inside an hour?`}</CodeBlock>
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p className="mb-3">
          <strong>Your exit artefact: the exposure map.</strong> Take your topology. For each node,
          record: <code>ingests_untrusted</code> yes/no, <code>can_write</code> yes/no, credentials
          held, and the ASI IDs it creates.
        </p>
        <p>
          Then list every untrusted&rarr;write path and the control on each. Any path with no control
          is your top priority this quarter — ahead of features.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}
