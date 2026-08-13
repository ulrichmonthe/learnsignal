// Agent Orchestration — lesson bodies for Module 3 (lesson 5, reliability)
// and Module 4 (lesson 6, economics). Scenario-first: the learner decides
// inside the situation before any concept is named.

import {
  Divider,
  Section,
  SubHead,
  P,
  BlockQuote,
  CodeBlock,
  DataTable,
  ExerciseLeadIn,
} from '@/components/courses/lesson-helpers'
import { Exercise } from '@/components/courses/exercise'
import { AO_EXERCISES } from '@/lib/courses/exercises/agent-orchestration'
import { ErrorCompoundingExplainer } from '@/components/courses/explainers/error-compounding'
import { CostPerTaskExplainer } from '@/components/courses/explainers/cost-per-task'

// ── Lesson 5 · Reliability: how chains lie to you ────────────────────────────

export function AOLesson5Body() {
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
        You are three weeks from a renewal decision with your largest customer. Your team built an
        invoice-reconciliation agent — five steps: extract line items, match to purchase orders,
        resolve the customer account, flag discrepancies, draft the resolution email. It demoed
        beautifully. Four clean runs in front of the customer&apos;s finance lead, who signed off to
        pilot on the spot.
      </p>

      <Section label="Scenario 1 · The situation">
        <P>
          This morning, a support ticket. A resolution email went to the wrong customer, quoting a
          different customer&apos;s invoice totals.
        </P>
        <P>
          Your engineer traced it in twenty minutes. Step 3 resolved the customer ID incorrectly.
          Steps 4 and 5 then did exactly what they were built to do: they took step 3&apos;s output as
          fact and produced a confident, correctly formatted, completely wrong email. Every step in
          the trace is green. Every step reported success. Every step <em>was</em> successful — at
          producing an output.
        </P>
        <P>
          She has checked the logs. It has happened once in roughly forty runs since the pilot
          started. In Slack she writes:
        </P>

        <BlockQuote attribution="The finance lead, in Slack">
          Honestly it&apos;s a 2.5% error rate on one step. That&apos;s within tolerance for an LLM.
        </BlockQuote>

        <P>
          That statement is true. It is also the wrong frame, and you have until Friday to work out
          why. Before any concept gets named, make the call.
        </P>
      </Section>

      <Exercise spec={AO_EXERCISES['lesson-5']} />

      <Divider />

      <Section label="The concept · Error compounding">
        <P>
          In a sequential chain, end-to-end accuracy is the <strong>product</strong> of per-stage
          accuracy. Not the average. Five stages at 95% each:
        </P>

        <CodeBlock>{`0.95 ^ 5  =  77.4%`}</CodeBlock>

        <P>
          Nearly one run in four is wrong end-to-end, and every stage individually looked fine in
          review. Now take your own system, at the 97.5% implied by &ldquo;once in forty&rdquo;:
        </P>

        <CodeBlock>{`Stages    End-to-end
  1         97.5%
  2         95.1%
  3         92.7%
  4         90.4%
  5         88.1%`}</CodeBlock>

        <P>
          Your worst stage fails 1 run in 40. Your system fails 1 run in 8.4. And the demo: at 88.1%
          per run, four clean runs in a row has probability 0.881⁴ = <strong>60%</strong>. You had a
          60% chance of a clean demo. You got one. The demo was not evidence — it was a coin flip that
          landed your way.
        </P>

        <ErrorCompoundingExplainer />

        <P>
          Two things fall out immediately. <strong>Stage count is the most powerful lever you have</strong>{' '}
          — going from 10 stages to 5 at 95% takes you from 60% to 77% without improving a single
          stage, and deleting a stage is usually cheaper than improving one. And{' '}
          <strong>above about eight stages, nothing survives without near-perfect components</strong>.
          If someone shows you a twelve-step chain, the only question worth asking is the measured
          per-step accuracy — and the answer will be &ldquo;we haven&apos;t measured it.&rdquo;
        </P>
      </Section>

      <Divider />

      <Section label="The inversion · Error budgets">
        <P>
          Run it backwards. Start from the reliability you need and derive what each stage must
          deliver.
        </P>

        <CodeBlock>{`Required per-stage accuracy = target ^ (1/n)

Target end-to-end   2 stages    3         5         8         10
  99%               99.50%      99.67%    99.80%    99.87%    99.90%
  95%               97.47%      98.30%    98.98%    99.36%    99.49%
  90%               94.87%      96.55%    97.91%    98.69%    98.95%`}</CodeBlock>

        <P>
          Read the top row again. A five-stage chain that needs to be 99% reliable requires every
          single stage to be 99.8% accurate — a very demanding bar for an LLM step on messy
          real-world input. If your product genuinely needs 99%, the honest engineering answer is
          usually fewer stages, deterministic code at most of them, or a human in the loop. Not a
          better prompt. This table is how you turn &ldquo;the model isn&apos;t accurate enough&rdquo;
          into a specific, arguable, costed requirement.
        </P>
      </Section>

      <Divider />

      <Section label="Validation gates · what they actually buy you">
        <P>
          A gate does not fix an error. It detects one. What happens next is a design decision, and
          the three options are very different.
        </P>

        <DataTable
          rows={[
            {
              label: 'Halt',
              value: 'Convert a silent wrong answer into a loud failure.',
              note: 'Usually the best option and almost always the most underrated.',
            },
            {
              label: 'Retry',
              value: 'Re-run the stage. Effective accuracy ≈ a + (1−a)·c·a, where c is the gate catch rate.',
              note: 'Costs a second call on caught failures.',
            },
            {
              label: 'Escalate',
              value: 'Hand it to a human.',
              note: 'Best where the action is irreversible.',
            },
          ]}
        />

        <P>With a stage at 97.5% and different gate catch rates:</P>

        <CodeBlock>{`Gate catches    Effective accuracy    Residual SILENT error
  50%              98.7%                 1.25%
  80%              99.5%                 0.50%
  90%              99.7%                 0.25%
  99%              99.9%                 0.03%`}</CodeBlock>

        <P>
          The column that matters is the last one. The value of a gate is mostly in shrinking{' '}
          <em>silent</em> failure, not in the accuracy delta. A system that fails loudly at 3% is far
          more manageable than one that fails silently at 1.5%, because you can build process around
          the first and nothing around the second.
        </P>
        <P>
          Gates worth having, cheapest first: schema validation, referential validation (does this ID
          exist in our database), cross-check (does this total match the header), constraint check (is
          this refund within policy), and only then model-based critique — the most expensive and the
          least reliable. Four of those five are ordinary code. The most valuable reliability work in
          agent systems is usually not AI work.
        </P>
      </Section>

      <Divider />

      <Section label="Confidence propagation · the deeper bug">
        <P>
          The real defect in the scenario was not step 3&apos;s error rate. It was that steps 4 and 5
          had no way to know step 3 was uncertain. Between stages, structured outputs strip nuance.
          Stage 1 was 60% sure; it emitted a customer ID; stage 2 read a customer ID. Confidence was
          manufactured out of nothing at the boundary. <strong>Every handoff in a chain is a place
          where doubt goes to die.</strong>
        </P>
        <P>
          The fix is a product decision, not a model one: make uncertainty a first-class field in
          every inter-stage contract, and make at least one downstream stage act on it. A confidence
          score that nothing reads is decoration.
        </P>
      </Section>

      <Divider />

      <Section label="Correlated stage errors · why the maths is optimistic">
        <P>
          The product formula assumes stages fail independently. They often do not. If stages 2, 3 and
          4 all read the same badly-OCR&apos;d document, their errors are correlated and the true
          end-to-end number is worse than the product on hard inputs and better on easy ones. Your
          average is fine; your tail is much worse than you modelled.
        </P>
        <P>
          Practical version: measure end-to-end on a golden set rather than trusting the
          multiplication. Use the multiplication to argue about architecture, not to report
          reliability.
        </P>
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p className="mb-3">Sketch your own longest chain, then:</p>
        <p>
          List the stages. Next to each, the <strong>measured</strong> accuracy — not the estimate; if
          it is not measured, write UNKNOWN. Multiply what you have, and note how many UNKNOWNs you had
          to skip. Write the target end-to-end accuracy your product actually needs, look up the
          per-stage requirement in the error-budget table, and compare. Then write the one-line
          instrumentation ask you will send an engineer on Monday.
        </p>
        <p className="mt-3">
          Most people finish this with more UNKNOWNs than numbers. That result is the point, and it is
          worth more than any number you could have guessed.
        </p>
      </ExerciseLeadIn>

      <BlockQuote attribution="Ask your engineer">
        &ldquo;What&apos;s the measured accuracy of each stage on a golden set?&rdquo;
        <br />
        &ldquo;What&apos;s our end-to-end accuracy, measured, not derived?&rdquo;
        <br />
        &ldquo;Where does a stage&apos;s uncertainty go? Does anything downstream read it?&rdquo;
        <br />
        &ldquo;Which stages could be deterministic code instead of a model call?&rdquo;
        <br />
        &ldquo;If we deleted a stage, what would actually break?&rdquo;
      </BlockQuote>
    </div>
  )
}

// ── Lesson 6 · Economics: cost per completed task ────────────────────────────

export function AOLesson6Body() {
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
        Your document-intelligence feature fans out. Every user request triggers seven parallel calls
        — classify, extract entities, check policy, retrieve precedent, assess risk, draft, format.
        It is fast, users like it, and usage tripled in a fortnight. Then finance flagged it on
        Monday.
      </p>

      <Section label="Scenario 2 · The situation">
        <P>
          Last week&apos;s model spend: <strong>$18,900</strong>. The week before: $6,300. Usage up
          3×, cost up 3×, precisely linear. The feature is not yet priced. Revenue attributable to it
          this week: zero. Runway is fourteen months.
        </P>
        <P>Two numbers from your analytics that nobody has connected to the invoice yet:</P>

        <CodeBlock>{`· 82% of requests reach a completed output.
  The other 18% are abandoned mid-flow or error out.

· Of the ~9,000 input tokens per call, roughly 6,000 are an
  identical system prompt and policy document — sent seven
  times per request.`}</CodeBlock>

        <P>
          Before any concept gets named, make the call. And answer this before you decide:{' '}
          <strong>what is your cost per completed task, and what does it need to be?</strong> If you
          cannot answer that, note it — you have just been asked the only question that mattered.
        </P>
      </Section>

      <Exercise spec={AO_EXERCISES['lesson-6']} />

      <Divider />

      <Section label="The concept · Cost per completed task">
        <P>
          Cost per token is the vendor&apos;s unit. Cost per completed task is yours.
        </P>

        <CodeBlock>{`cost per completed task = total model spend / tasks that reached a useful output`}</CodeBlock>

        <P>
          Baseline here: $18,900 ÷ 60,000 requests = $0.315 per request. At 82% completion,{' '}
          <strong>$0.384 per completed task</strong>. Every optimisation gets judged against that
          number, because a 42% cut in token spend that costs eight points of completion is a far
          smaller win than the dashboard says, and a 60% cut that halves completion is not a win at
          all.
        </P>
        <P>Track its ugly sibling too:</P>

        <CodeBlock>{`abandonment waste = cost per request × requests × (1 − completion rate)

$0.315 × 60,000 × 0.18  =  $3,402 a week spent on outputs nobody read`}</CodeBlock>

        <P>
          In a fan-out you pay for all seven branches whether or not the user stays. This line item
          does not appear on any invoice and it is 18% of your bill.
        </P>

        <CostPerTaskExplainer />

        <P>
          Start from price, not from spend. At a $29/month subscription and a 70% target gross margin,
          you have $20.30 per user per month for model costs:
        </P>

        <CodeBlock>{`Tasks per user per month    Max cost per completed task
  50                          $0.406
  100                         $0.203
  200                         $0.101`}</CodeBlock>

        <P>
          At $0.384 per completed task, this product is viable at 50 tasks a month and deeply unviable
          at 200 — which means <strong>your power users are your worst-margin users</strong>, and any
          growth in engagement makes the business worse. That is a product strategy problem
          masquerading as an infrastructure bill, and it is the single most common way AI features
          quietly destroy margin. Derive your ceiling before you optimise, or you will not know when
          to stop.
        </P>
      </Section>

      <Divider />

      <Section label="The four levers, in the order you should pull them">
        <SubHead>1 · Caching — hours of work, no quality risk</SubHead>
        <P>
          Providers cache stable prefixes and charge a fraction of the normal input rate to read them,
          with a small premium to write. The content must be an exact, stable prefix, so put the
          system prompt and policy documents at the front and the variable request at the back.
          Fan-out is the best case in the whole field — the same prefix, N times, in the same second.
          Watch for short cache TTLs on low-traffic endpoints, and any prompt change that alters the
          prefix and silently zeroes your hit rate.
        </P>

        <SubHead>2 · Tiering — days of work, real quality risk</SubHead>
        <P>
          The heuristic: if the step has a verifiable right answer, tier it down. If the step requires
          judgement, do not.
        </P>

        <CodeBlock>{`Tier down                          Keep on the frontier model
  Routing, classification            Final customer-facing reasoning
  Structured extraction              Anything with legal/financial consequence
  Formatting, summarising            Ambiguous judgement calls
  Deduplication, filtering           Multi-constraint trade-offs`}</CodeBlock>

        <P>
          The failure mode is specific and nasty: a cheap model that is wrong does not know it is
          wrong, and if the step it does feeds a confident downstream step, you have quietly recreated
          the compounding problem to save $2,000. Always measure completion rate and end-to-end
          accuracy after tiering, not just spend. The trick worth knowing: a cheap model plus a
          deterministic verifier often beats the frontier model on both cost and accuracy for
          extraction — not a compromise, usually just better.
        </P>

        <SubHead>3 · Topology — weeks of work, biggest ceiling</SubHead>
        <P>
          Fewer branches, fewer stages, a router in front. This attacks the cause, is where the large
          savings live, and is where you risk deleting quality you never measured. Do it after you
          have instrumented, never before.
        </P>

        <SubHead>4 · Pricing and gating — the lever PMs forget they own</SubHead>
        <P>
          Usage caps, tiered plans, credits, or simply not offering the expensive path to free users.
          If cost per completed task cannot get under your ceiling, the answer may be that the ceiling
          is wrong, not the architecture.
        </P>
      </Section>

      <Divider />

      <Section label="Circuit breakers · non-negotiable">
        <P>
          Every agent system in production needs three, and most have none until after the incident.
        </P>

        <DataTable
          rows={[
            {
              label: 'Per-request budget cap',
              value: 'Hard stop. Return partial output rather than an unbounded bill.',
            },
            {
              label: 'Per-user daily cap',
              value: 'Protects against loops, abuse, and one enthusiastic customer.',
            },
            {
              label: 'Global kill switch',
              value: 'One flag, one person, no deploy required.',
            },
          ]}
        />

        <P>
          Ask when these were last tested. &ldquo;We have them&rdquo; and &ldquo;we have tested
          them&rdquo; are different answers.
        </P>
      </Section>

      <Divider />

      <ExerciseLeadIn>
        <p className="mb-3">Build the cost model for your own system. Fill in:</p>
        <p>
          Requests per week · calls per request · avg input/output tokens per call · cached fraction
          of input · completion rate · price point and target margin. Then compute cost per request,
          cost per completed task, abandonment waste per week, your affordable ceiling, and the gap.
        </p>
        <p className="mt-3">
          Then name <strong>one</strong> change, its estimated effect, and the metric you will watch
          to catch the quality cost.
        </p>
      </ExerciseLeadIn>

      <BlockQuote attribution="Ask your engineer">
        &ldquo;What&apos;s our cache hit rate, and when did we last verify it after a prompt
        change?&rdquo;
        <br />
        &ldquo;Which calls run on a frontier model that have a verifiable right answer?&rdquo;
        <br />
        &ldquo;What do we spend per week on requests the user abandons?&rdquo;
        <br />
        &ldquo;What is the per-request budget cap, and when did we last test it?&rdquo;
        <br />
        &ldquo;What&apos;s our cost per completed task, and how has it moved in eight weeks?&rdquo;
      </BlockQuote>
    </div>
  )
}
