// Lesson bodies for the Agent Orchestration course, Module block 1.
// AOLesson1Body  ← source Module 0 (Orientation & diagnostic)
// AOLesson2Body  ← source Module 1 (Do you actually need multi-agent?)
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

export function AOLesson1Body() {
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
        You are not choosing a framework. You are choosing a failure mode and a cost curve. You do
        not need to write code to get this right — you need to sit in an architecture review and
        know which question to ask next. This lesson gives you the vocabulary and the one distinction
        that clears up most of the confusion.
      </p>

      <Section label="The diagnostic">
        <BlockQuote>
          Answer these three before reading further. Write the answers down — you will be shown them
          again at the end. (1) A pipeline has five stages, each 95% accurate. What is the end-to-end
          accuracy? (2) Name three ways a fan-out architecture costs more than you budgeted for. (3)
          What is the maximum money, data or damage your most autonomous agent could cause in 24
          hours, starting at 2am on a Sunday?
        </BlockQuote>
        <P>
          Most PMs get question 1 wrong by averaging. Most cannot answer question 3 at all. Question
          3 is the one that ends careers. Keep your answers — the course will test them against what
          you learn.
        </P>
      </Section>

      <Divider />

      <Section label="What orchestration actually means">
        <P>
          Orchestration is the layer that decides <strong>which model call happens next, with what
          context, and what happens when it fails.</strong> That is the whole definition. Everything
          else — agents, crews, graphs, swarms — is vocabulary layered on top of those three
          decisions. When a vendor tells you their framework does orchestration, they are telling you
          it makes those three decisions on your behalf, in a particular way, with particular
          assumptions baked in.
        </P>
        <P>
          The reason this matters to a PM and not only to an engineer: the topology you pick is three
          product decisions wearing engineering clothes.
        </P>

        <SubHead>Topology sets the cost curve</SubHead>
        <P>
          Not the model choice. A fan-out of seven costs seven times a single call, and no amount of
          prompt tuning fixes that.
        </P>

        <SubHead>Topology sets the failure surface</SubHead>
        <P>
          A sequential chain fails differently from a parallel scatter. You cannot mitigate a failure
          mode you have not named.
        </P>

        <SubHead>Topology sets the autonomy question</SubHead>
        <P>
          Where humans go, what they can see, and what the system can do without them.
        </P>
      </Section>

      <Divider />

      <Section label="Workflow vs. agent">
        <P>
          This is the one distinction that clears up most confusion.
        </P>
        <P>
          A <strong>workflow</strong> is a system where the path is defined in advance by you. Step A,
          then B, then either C or D depending on a condition you wrote. The model does the work at
          each step; the code decides the route.
        </P>
        <P>
          An <strong>agent</strong> is a system where the model decides the route. It picks tools,
          decides when it is done, and loops until it thinks the task is complete.
        </P>
        <P>
          Almost everything marketed as &quot;multi-agent&quot; in 2026 is in fact a multi-step
          workflow with LLM calls at the nodes. That is not a criticism —{' '}
          <strong>
            workflows are more reliable, cheaper, easier to debug and easier to defend to a
            regulator.
          </strong>{' '}
          It is a criticism only of the vocabulary, which obscures the trade you are making. Every
          unit of routing you hand from your code to the model buys you flexibility and costs you
          predictability. Spend it deliberately.
        </P>

        <CodeBlock>{`                        WORKFLOW              AGENT
  Route decided by      Your code             The model
  Cost                  Predictable           Variable, needs a cap
  Debugging             Read the code         Read the trace, hope you have one
  Handles novel input   Badly                 Well
  Defensible to audit   Yes                   Only with full provenance`}</CodeBlock>

        <BlockQuote>
          Ask in your next review: &quot;Which parts of this route are decided by our code, and which
          are decided by the model?&quot; If nobody can answer cleanly, the system is more agentic
          than the team thinks it is.
        </BlockQuote>
      </Section>
    </div>
  )
}

export function AOLesson2Body() {
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
        The outcome of this lesson is narrow and useful: you can run the decomposition test on any
        proposal and say no to four out of five of them, with a reason. Multi-agent is a real tool.
        It is also the answer to a question most teams are not actually asking.
      </p>

      <Section label="The default answer is no">
        <P>
          Most teams that &quot;need multi-agent&quot; need one agent with better tools. This is not
          conservatism. It is arithmetic. Every agent you add multiplies four things.
        </P>

        <SubHead>Context</SubHead>
        <P>
          Each agent needs its share of the situation restated. The same background gets paid for
          repeatedly.
        </P>

        <SubHead>Failure surface</SubHead>
        <P>
          Five agents is five places to be wrong about the same fact, plus four handoffs where
          information is lost in translation.
        </P>

        <SubHead>Debugging cost</SubHead>
        <P>
          You now reconstruct a distributed system from logs rather than reading one transcript.
        </P>

        <SubHead>Latency or spend — pick one</SubHead>
        <P>
          Sequential costs you time; parallel costs you money.
        </P>
        <P>
          Against that you get parallelism, specialisation, permission separation, and independent
          verification. Those are real. They are just not what most proposals are actually buying.
        </P>
      </Section>

      <Divider />

      <Section label="The most common wrong reason">
        <P>
          <strong>Agents used as a code-organisation metaphor.</strong> An engineer says: &quot;We&apos;ll
          have a research agent, a writing agent and an editing agent.&quot; It sounds like an
          architecture. It is usually a description of three prompts that could be three sections of
          one prompt, or three function calls in one loop.
        </P>
        <P>
          The tell: if you ask <em>&quot;what can the writing agent do that a writing step could
          not?&quot;</em> and the answer is about tidiness rather than capability, you are looking at
          organisation, not architecture. Agents are not a way to structure code. They are a way to
          structure <strong>decisions and permissions.</strong>
        </P>
      </Section>

      <Divider />

      <Section label="The decomposition test">
        <P>
          You need at least one concrete yes. Not a hypothetical yes.
        </P>

        <SubHead>1 · Genuine parallelism</SubHead>
        <P>
          Are there subtasks that do not need each other&apos;s output, where doing them at the same
          time materially improves the experience?
        </P>
        <P>
          <em>Concrete yes:</em> &quot;We check the document against four independent policy sets. None
          depends on the others. Serially that&apos;s 40 seconds, in parallel it&apos;s 12.&quot;{' '}
          <em>Not a yes:</em> &quot;It feels faster.&quot;
        </P>

        <SubHead>2 · Different tools or permissions</SubHead>
        <P>
          Does a subtask need access that you do not want the rest of the system to have?
        </P>
        <P>
          <em>Concrete yes:</em> &quot;The refund step needs payments credentials. Nothing else in the
          flow should hold them.&quot; This is the strongest reason on the list and the most underused.{' '}
          <em>Not a yes:</em> &quot;They use different APIs.&quot; One agent can hold many tools.
        </P>

        <SubHead>3 · Different model requirements</SubHead>
        <P>
          Does a subtask genuinely need a different model — cheaper, faster, longer-context,
          differently trained?
        </P>
        <P>
          <em>Concrete yes:</em> &quot;Classification runs 40,000 times a day and is trivially
          verifiable. It should not run on a frontier model.&quot; <em>Not a yes:</em> &quot;The
          writing agent should be more creative.&quot; That is a temperature setting.
        </P>

        <SubHead>4 · Required independence</SubHead>
        <P>
          Do you need a second opinion that was not contaminated by the first?
        </P>
        <P>
          <em>Concrete yes:</em> &quot;The verifier must not see the drafter&apos;s reasoning, only its
          output and the source documents.&quot; <em>Not a yes:</em> &quot;Two heads are better than
          one.&quot; Two instances of the same model with the same context are one head, billed twice.
        </P>

        <SubHead>5 · Context ceiling</SubHead>
        <P>
          Does the task genuinely exceed what one agent can hold and reason over usefully?
        </P>
        <P>
          <em>Concrete yes:</em> &quot;Each of the 200 documents is 30k tokens and the task requires
          reading all of them.&quot; <em>Not a yes:</em> &quot;The prompt is getting long.&quot; Long
          is not the same as too long.
        </P>
        <P>
          <strong>
            If you cannot produce a concrete yes to at least one: one agent, more tools.
          </strong>{' '}
          Ship that, measure it, and let the ceiling show up in data rather than in a design meeting.
        </P>
      </Section>

      <Divider />

      <Section label="The single-agent ceiling">
        <P>
          You will hit real limits. Recognise them by their signature rather than by vibes. Note that
          four of the five have a fix that is <em>not</em> &quot;add more agents.&quot; Only the last
          two point at a genuine topology change.
        </P>
        <CodeBlock>{`CEILING              SIGNATURE IN PRODUCTION            THE HONEST FIX
  Tool confusion       Above ~20-30 tools, selection      Group tools behind a
                       accuracy degrades; picks           router, or split by
                       plausibly wrong tools              permission boundary
  Context degradation  Quality drops on long inputs       Shorten, retrieve rather
                       even inside the window; early      than stuff, or split the
                       instructions ignored late          task
  Serial latency       Genuinely 6 independent lookups,   Fan-out, and only fan-out
                       users wait 40 seconds
  Permission bleed     One agent holds credentials for    Split by permission — an
                       everything it might ever need      architecture decision,
                                                          not an optimisation
  No independent check The thing that wrote the answer    Add a verifier with
                       is the thing that approved it      separate context`}</CodeBlock>
      </Section>

      <Divider />

      <Section label="The cost of decomposition — the tax nobody budgets">
        <P>If you do split, price these before you commit.</P>
        <DataTable
          rows={[
            {
              label: 'Context duplication',
              value:
                'Shared background restated per agent. A five-agent system with 6k tokens of common context pays 30k tokens per request for the same information.',
              note: 'Prompt caching recovers most of this — and almost nobody enables it before launch.',
            },
            {
              label: 'Handoff loss',
              value:
                "Information that existed in agent 1's reasoning and did not survive into the structured output it passed to agent 2.",
              note: 'The source of most "confidently wrong" incidents — the downstream agent has no way to know something was lost.',
            },
            {
              label: 'Coordination overhead',
              value: 'Supervisor tokens, routing calls, reconciliation.',
              note: 'Real, and usually 10-25% of total spend in a supervisor topology.',
            },
            {
              label: 'Observability requirement',
              value:
                'A single agent can be debugged from a transcript. A multi-agent system cannot be debugged without tracing infrastructure you must build or buy.',
              note: 'Budget it as part of the decision, not as a follow-up ticket.',
            },
          ]}
        />
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p style={{ marginBottom: '10px' }}>
          <strong>The decomposition memo.</strong> Take the most recent multi-agent proposal you have
          seen. Write:
        </p>
        <ol style={{ paddingLeft: '18px', listStyle: 'decimal' }}>
          <li style={{ marginBottom: '6px' }}>
            The concrete yes, quoted from the test above, with the actual number attached.
          </li>
          <li style={{ marginBottom: '6px' }}>
            What the single-agent version would look like and why it fails.
          </li>
          <li style={{ marginBottom: '6px' }}>The four decomposition costs, priced roughly.</li>
          <li>The one measurement that would prove you wrong within six weeks.</li>
        </ol>
        <p style={{ marginTop: '10px' }}>
          If you cannot fill in point 1 with a number, you have your answer — and you have saved a
          quarter.
        </p>
      </ExerciseLeadIn>

      <BlockQuote>
        Ask your engineer: &quot;What can these three agents do that three steps in one agent could
        not?&quot; · &quot;How much of the context is duplicated across agents, and is prompt caching
        on?&quot; · &quot;When agent 2 gets agent 1&apos;s output, what does it lose?&quot; · &quot;If
        I asked you to collapse this to one agent tomorrow, what breaks first?&quot;
      </BlockQuote>
    </div>
  )
}
