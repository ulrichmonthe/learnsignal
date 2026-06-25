// Lesson body components for the RAG course.
// Lessons 4, 7, and 11 are "full" lessons with rich content; the rest use the
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

// ── Helix context box ─────────────────────────────────────────────────────────

function HelixBox() {
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
        Helix — Acme Analytics doc-grounded support copilot
      </p>
      <p
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: '1.6',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        A support copilot that answers customer questions using only the company&apos;s help center
        documentation. Every lesson in this course modifies one part of Helix&apos;s retrieval
        pipeline — its chunking strategy, embedding model, reranking layer, or monitoring stack.
      </p>
      <div className="mt-4 space-y-1">
        {[
          'Answers questions using only retrieved help center docs',
          'Returns answer, source citations, and confidence score',
          'Escalates when retrieved context is insufficient',
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

// ── RAG Lesson 1 ──────────────────────────────────────────────────────────────

export function RAGLesson1Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        When people say &ldquo;the model doesn&apos;t know things,&rdquo; they mean the training cutoff.
        That framing is too narrow, and it leads teams to reach for the wrong fixes. The cutoff is the
        gap you can see. The gaps that actually break products are usually invisible — and older than
        any model you&apos;ve ever deployed.
      </Lead>

      <P>
        There are three distinct knowledge gaps in any AI product. The temporal gap is the one
        everybody knows: the model was trained through some date and hasn&apos;t seen what happened
        since. The private gap is the one that kills most enterprise products: your internal data —
        your policies, your customer records, your product docs — was never in training at all.
        It wasn&apos;t a cutoff issue; it was a firewall issue. And the institutional gap is subtler
        still: the reasoning patterns, conventions, and implicit context that live in your
        organization&apos;s heads and are written nowhere the model could have seen.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The temporal gap is visible and often overstated. A model trained through March 2024
            doesn&apos;t know about April 2024 news — but it still knows everything that was true
            before that date. For most enterprise use cases, the cutoff is a minor concern compared
            to the private gap.
          </Bullet>
          <Bullet>
            The private gap is where products actually break. Your company&apos;s help center,
            internal wikis, product documentation, and customer data were never in training. RAG
            is the canonical answer. Fine-tuning is not — fine-tuning teaches style and format,
            not facts, and facts can change.
          </Bullet>
          <Bullet>
            The institutional gap is the hardest to close. Tacit knowledge — the conventions,
            escalation patterns, and &ldquo;obviously we don&apos;t do it that way&rdquo; rules —
            lives in people&apos;s heads. RAG can help if someone has written it down; it
            can&apos;t help if nobody has.
          </Bullet>
          <Bullet>
            The wrong fix is to update the model. Model updates are slow, expensive, and only
            solve the temporal gap. The right fix is to treat the model as a reasoning engine
            and feed it the knowledge it needs at query time.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Helix is your test bed for this course: a doc-grounded support copilot that answers customer
        questions using only retrieved help center documents. When a customer asks about a billing
        policy Helix has never been trained on, RAG is how it answers correctly. Every lesson that
        follows modifies one piece of that pipeline — and shows you exactly what breaks when you
        get it wrong.
      </Lead>

      <ExerciseSoon lessonTitle="The knowledge cutoff is the least of your problems." />
    </div>
  )
}

// ── RAG Lesson 2 ──────────────────────────────────────────────────────────────

export function RAGLesson2Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        RAG is one of the most misunderstood terms in AI product work. Teams use it to mean anything
        from &ldquo;we have a vector database&rdquo; to &ldquo;we do something with documents.&rdquo;
        Getting the mechanics exactly right matters — because almost every decision you make later
        depends on a clear model of what is actually happening.
      </Lead>

      <P>
        RAG does one thing: it hands the model relevant documents at answer time. That&apos;s it.
        It does not train the model. It does not update its weights. It does not teach the model
        anything permanently. The model is the same model it was before — it just has more context
        to reason from when it generates a response. When the conversation ends, it forgets.
        Retrieval is not memory; it is attention.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The four-step pipeline: query → retrieve → assemble → generate. A user sends a question.
            The retrieval layer finds relevant chunks from your index. The assembly layer decides which
            chunks go in the context and how they&apos;re formatted. The model generates an answer
            grounded in those chunks.
          </Bullet>
          <Bullet>
            RAG is not fine-tuning. Fine-tuning changes the model&apos;s weights permanently.
            RAG changes what&apos;s in context at runtime. If your data changes next week,
            you update the index — not the model. This is one of RAG&apos;s core advantages.
          </Bullet>
          <Bullet>
            RAG is not long context. Stuffing your entire knowledge base into the prompt is
            technically possible with long-context models — but it doesn&apos;t scale, it&apos;s
            expensive, and attention degrades as context grows. Retrieval solves the selection
            problem that long context ignores.
          </Bullet>
          <Bullet>
            RAG is not magic. A RAG system fails if the wrong chunks are retrieved, if the right
            chunks are assembled badly, or if the model ignores the retrieved context and
            hallucinates anyway. All three failure modes are real. Lesson 3 covers them explicitly.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        The mental model to carry forward: RAG is a question-time knowledge injection system.
        You can change what the model knows without touching the model. That&apos;s powerful —
        but only if the retrieval half of the pipeline actually finds the right things.
      </Lead>

      <ExerciseSoon lessonTitle="What RAG is, and what it isn't." />
    </div>
  )
}

// ── RAG Lesson 3 ──────────────────────────────────────────────────────────────

export function RAGLesson3Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        A RAG system is a pipeline with at least two failure modes operating independently of each
        other. When your product underperforms, the first diagnostic question is which half is
        broken — and most teams have no systematic way to answer it. They run end-to-end evals,
        see bad output, and reach for the prompt. The retrieval pipeline was the problem all along.
      </Lead>

      <P>
        The three failure modes map directly to the three phases of a RAG pipeline. Retrieval
        failure means the right chunks never made it into context — the index didn&apos;t have
        them, the query didn&apos;t surface them, or they were buried below the top-k cutoff.
        Assembly failure means the right chunks were retrieved but assembled incorrectly — reordered,
        truncated, or dropped. Generation failure means the model had everything it needed and
        hallucinated anyway, contradicting or ignoring the retrieved context.
      </P>

      <Section label="The three failure modes">
        <BulletList>
          <Bullet>
            <strong>Retrieval failure:</strong> the right document wasn&apos;t returned. Causes include
            a stale index, mismatched embeddings, query/document phrasing mismatch, or too small a
            top-k. Diagnostic signal: manually retrieve for a failing query. If the right chunk
            doesn&apos;t appear in the top 20, it&apos;s a retrieval problem.
          </Bullet>
          <Bullet>
            <strong>Assembly failure:</strong> the right chunks were retrieved but not used. Causes
            include truncation when the context window fills, wrong ordering (models attend to early
            and late positions more strongly), or formatting that makes chunks hard to parse.
            Diagnostic signal: log what actually goes into context and verify the key sentences are
            there and in a reasonable position.
          </Bullet>
          <Bullet>
            <strong>Generation failure:</strong> the model had the right context and ignored it.
            This happens when the model&apos;s prior from training is strong enough to override
            retrieved context, or when the answer requires multi-hop reasoning across multiple chunks
            and the model doesn&apos;t connect them. Diagnostic signal: present the model with the
            correct context in isolation and ask the same question. If it still fails, it&apos;s a
            generation problem.
          </Bullet>
        </BulletList>
      </Section>

      <BlockQuote>
        Evaluate retrieval and generation separately. If you score the full pipeline end-to-end,
        you&apos;ll know something is wrong but never which half to fix.
      </BlockQuote>

      <Lead>
        The instinct to install: any time a RAG product underperforms, run the three-part diagnosis
        before touching anything. Which chunks were retrieved? Were the right ones in context? Did
        the model use them? The answer changes what you fix — and those fixes live in very different
        parts of the stack.
      </Lead>

      <ExerciseSoon lessonTitle="The three failure modes that kill RAG systems." />
    </div>
  )
}

// ── RAG Lesson 4 (full) ───────────────────────────────────────────────────────

export function RAGLesson4Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        Chunking is the first decision you make when building a RAG system and the one most teams
        make too quickly. It&apos;s also the decision that is hardest to change later — because your
        entire index is built on it, and rebuilding an index is expensive. Get it wrong and
        you&apos;ll spend weeks debugging retrieval quality that never quite improves.
      </Lead>

      <Section label="What chunking actually does">
        <P>
          Chunking splits your source documents into pieces small enough to retrieve individually.
          The embedding model encodes each chunk into a vector, and that vector is what retrieval
          actually searches over. The chunk boundaries you choose determine what information can
          and cannot be retrieved together.
        </P>
        <P>
          This is where the &ldquo;speaker&apos;s name&rdquo; problem comes from. Imagine a
          transcript formatted as a series of speaker turns. If you chunk on fixed token counts,
          you might split a turn across two chunks — the speaker identification in one chunk,
          the statement attributed to them in another. A query about what that person said retrieves
          the statement chunk. No speaker. The answer is factually present but unretrievable
          in context.
        </P>
      </Section>

      <Section label="The chunking strategies">
        <SubHead>Fixed-size chunking</SubHead>
        <P>
          Split every N tokens, with or without overlap. Simple to implement, predictable index
          size, easy to reason about. Breaks badly on structured documents where meaning spans
          natural boundaries — policy sections, multi-paragraph arguments, speaker turns.
          The default choice for teams who haven&apos;t thought about it.
        </P>

        <SubHead>Semantic chunking</SubHead>
        <P>
          Use embedding similarity between adjacent sentences to detect topic boundaries. Split
          when the embedding distance spikes. Preserves topical coherence at the cost of
          variable chunk sizes and higher ingestion compute. The right choice when your documents
          are long-form prose with organic topic shifts.
        </P>

        <SubHead>Structural chunking</SubHead>
        <P>
          Parse document structure — headings, sections, tables, list items — and use those
          boundaries as chunk boundaries. Works best on structured documents like API docs,
          policy manuals, and help center articles where structure carries meaning.
          Helix uses structural chunking: each help center article section is one chunk,
          preserving section heading context in every retrieval result.
        </P>
      </Section>

      <Section label="The overlap question">
        <P>
          Overlap adds a fixed number of tokens from the end of one chunk to the beginning of
          the next. It reduces the chance of splitting a sentence that spans a boundary.
          Typical values are 10–20% of chunk size. More overlap means redundant information,
          larger index, and slightly worse embedding signal. Less overlap means sharper chunk
          boundaries and higher risk of split-sentence failures. There is no right answer —
          only the right answer for your documents and query distribution.
        </P>
      </Section>

      <CodeBlock>
{`# Helix chunking decision log
# Decision made: 2024-09-15

DOCUMENT TYPE:     Help center articles (structured Markdown)
CHUNKING STRATEGY: Structural — split on heading boundaries (##, ###)
CHUNK SIZE TARGET: 300–600 tokens per section
OVERLAP:           50 tokens (one paragraph carry-over)

RATIONALE:
  - Articles are already written as self-contained sections
  - Heading text is prepended to each chunk for embedding context
  - Tables are kept intact within their section chunk
  - FAQ items (Q + A pairs) treated as atomic units

REJECTED ALTERNATIVES:
  - Fixed 512 tokens: splits mid-section on longer articles
  - Semantic chunking: too slow for 40k-article corpus at ingestion

KNOWN EDGE CASES:
  - Step-by-step guides: steps 3–5 often exceed 600 tokens → split at step boundary
  - Release notes: treated as one chunk regardless of length (temporal coherence)`}
      </CodeBlock>

      <Section label="The ingestion decision log">
        <P>
          The chunking decision log is your first artifact. It is a record of what you chose,
          why you chose it, what you rejected, and what edge cases you know about. Without it,
          the next engineer on the project will re-derive your decisions from first principles —
          and probably reach a different answer. With it, you have a starting point for the
          systematic iteration chunking quality requires.
        </P>
      </Section>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '12px' }}>
          <strong>Build Helix&apos;s chunking + ingestion decision log.</strong>
        </p>
        <p>
          You&apos;re joining the Helix team. The retrieval pipeline exists but the chunking
          decisions were never documented. Using the Helix corpus sample below, write a chunking
          decision log: choose a strategy, justify it against the document structure, identify
          two edge cases, and note one alternative you considered and rejected.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}

// ── RAG Lesson 5 ──────────────────────────────────────────────────────────────

export function RAGLesson5Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        There are two fundamentally different ways to find relevant chunks, and they fail on
        completely different queries. Sparse retrieval finds exact text. Dense retrieval finds
        meaning. The mistake most teams make is picking one and using it everywhere. The right
        architecture uses both — and knows when each one is the bottleneck.
      </Lead>

      <P>
        Sparse retrieval (BM25, TF-IDF) is keyword search with some statistical weighting. It
        returns chunks that contain the words in the query, ranked by how often and how
        distinctively those words appear. It is fast, cheap, and interpretable. It fails
        completely on paraphrased queries, semantic questions, and anything where the user
        words their question differently than the document.
      </P>

      <P>
        Dense retrieval uses embedding similarity. The query is embedded, document chunks are
        embedded, and the nearest vectors are returned. It handles paraphrasing and semantic
        intent naturally. It fails on exact-match requirements — product codes, section
        numbers, proper nouns — where the embedding blurs what should be a precise match.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            &ldquo;Section 420&rdquo; must match exactly — sparse wins here. The user typed
            a policy code. The document contains that exact code. No amount of semantic
            understanding improves on an exact keyword match. Sparse retrieval finds it
            instantly; dense retrieval may rank it lower than semantically similar but
            wrong sections.
          </Bullet>
          <Bullet>
            &ldquo;What if someone lies to get a refund?&rdquo; needs meaning — dense wins here.
            The help center article talks about fraud prevention and policy abuse. No exact
            words match the query. Dense retrieval surfaces it; sparse retrieval returns nothing
            useful.
          </Bullet>
          <Bullet>
            Hybrid retrieval runs both and combines the results. Reciprocal Rank Fusion (RRF)
            is the standard combination method: each retriever ranks chunks independently, and
            the final score is the harmonic sum of each chunk&apos;s reciprocal rank from each
            retriever. It is simple, robust, and consistently outperforms either retriever alone.
          </Bullet>
          <Bullet>
            When to start hybrid vs start with one: if your corpus has product codes, model
            numbers, section references, or any identifier that must match exactly, start hybrid.
            If your corpus is pure prose and queries are all semantic, dense alone is simpler.
            Adding sparse later is easier than removing it.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Helix uses hybrid retrieval with RRF. When a customer asks about &ldquo;the Premium plan
        cancellation policy,&rdquo; sparse catches &ldquo;Premium&rdquo; and &ldquo;cancellation&rdquo;
        as exact matches; dense catches the semantic intent around plan management and refunds.
        The combined result is more robust than either alone — and that combination is where most
        production RAG systems end up.
      </Lead>

      <ExerciseSoon lessonTitle="Dense, sparse, and hybrid retrieval: when each wins." />
    </div>
  )
}

// ── RAG Lesson 6 ──────────────────────────────────────────────────────────────

export function RAGLesson6Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        Retrieval and ranking are different problems, and conflating them is one of the most
        common sources of mediocre RAG quality. Retrieval is a recall problem: find everything
        that might be relevant. Ranking is a precision problem: from what you found, identify
        what is most useful. A reranker is a second-stage model that solves the precision problem
        — and adding one is usually the highest-leverage change you can make after initial retrieval
        is working.
      </Lead>

      <P>
        The distinction matters because of how embedding models work. A bi-encoder (your embedding
        model) encodes query and document independently and measures vector distance. It&apos;s
        fast enough to search millions of chunks but trades off some precision for speed. A
        cross-encoder (your reranker) sees the query and document together and produces a relevance
        score. It&apos;s too slow to run on your entire index but gives much higher quality
        relevance scores for a short list of candidates.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The two-stage architecture: retrieve top-100 with your embedding model, rerank to
            top-5 with a cross-encoder, pass top-5 to the context window. The first stage is
            fast and high-recall. The second stage is slower but high-precision. The model
            only sees the reranked top results.
          </Bullet>
          <Bullet>
            When to add a reranker: when your retrieval metrics show good recall at high k
            (the right chunks appear in the top 50) but poor precision at low k (they
            don&apos;t surface in the top 5). If recall at top-50 is already bad, fix the
            retrieval first — a reranker can&apos;t rescue chunks that weren&apos;t retrieved.
          </Bullet>
          <Bullet>
            Reranker options: Cohere Rerank, cross-encoder models from SentenceTransformers,
            or a custom fine-tuned cross-encoder if you have labeled preference data. For
            most teams, a pre-trained cross-encoder is a strong starting point with minimal
            infrastructure cost.
          </Bullet>
          <Bullet>
            The latency trade-off: a reranker adds 50–200ms for a 100-candidate list.
            For synchronous user-facing products, budget this into your latency targets.
            For asynchronous or streaming products, it&apos;s nearly free.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        For Helix, retrieval alone surfaces relevant articles in the top 20 on most queries.
        The problem is that the top 3 — what actually goes in context — aren&apos;t always
        the most relevant 3. A reranker fixes this at the last step, consistently improving
        faithfulness scores without requiring any changes to the index or embedding model.
      </Lead>

      <ExerciseSoon lessonTitle="When to add a reranking layer." />
    </div>
  )
}

// ── RAG Lesson 7 (full) ───────────────────────────────────────────────────────

export function RAGLesson7Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        Most teams eval their RAG system by asking the full pipeline questions and rating the
        answers. This tells you something is wrong. It tells you nothing about what to fix.
        To improve a RAG system systematically, you need two separate eval suites that run
        independently — one that measures retrieval, one that measures generation — because
        the metrics are different, the failure modes are different, and the fixes live in
        completely different parts of the stack.
      </Lead>

      <Section label="Retrieval metrics">
        <SubHead>Precision@k</SubHead>
        <P>
          Of the k chunks retrieved, how many are actually relevant? Precision@3 of 0.67
          means two of your top three chunks are relevant. This is the primary quality
          signal for what the model will actually see. Low precision means the model is
          generating answers from noise.
        </P>

        <SubHead>Recall@k</SubHead>
        <P>
          Of all the relevant chunks in your index, how many appear in the top k? Recall@20
          of 0.90 means 90% of relevant chunks were retrieved in the top 20. If recall is
          low, the right information exists in your index but retrieval isn&apos;t finding it.
          The fix is in your retrieval strategy, not your reranker.
        </P>

        <SubHead>Mean Reciprocal Rank (MRR)</SubHead>
        <P>
          The average reciprocal of the rank of the first relevant chunk. If the first relevant
          chunk is at position 1, MRR contribution is 1.0. At position 3, it&apos;s 0.33. MRR
          rewards systems that surface relevant chunks early — important because models attend
          more to context that appears at the beginning.
        </P>
      </Section>

      <Section label="Generation metrics">
        <SubHead>Faithfulness</SubHead>
        <P>
          Does every claim in the generated answer appear in the retrieved context? Faithfulness
          is binary at the claim level — each factual claim is either grounded in context or it
          isn&apos;t. A faithfulness score of 0.85 means 15% of claims in the answer have no
          basis in what was retrieved. Those 15% are hallucinations.
        </P>

        <SubHead>Answer Relevance</SubHead>
        <P>
          Does the answer actually address the question? A faithful answer can be irrelevant —
          it only cites facts from context, but those facts don&apos;t answer what the user
          asked. Answer relevance catches this separately from faithfulness.
        </P>
      </Section>

      <CodeBlock>
{`# Retrieval eval suite structure — Helix

EVAL_SET_SIZE: 150 queries
  - 50 factual lookups (policy questions with single correct source)
  - 50 multi-doc questions (answers span 2+ articles)
  - 30 edge cases (ambiguous queries, sparse coverage topics)
  - 20 adversarial (queries designed to surface off-topic chunks)

RETRIEVAL METRICS (run on retrieval output, before generation)
  precision@3:   target ≥ 0.80
  precision@5:   target ≥ 0.70
  recall@20:     target ≥ 0.90
  mrr:           target ≥ 0.75

GENERATION METRICS (run on final answers)
  faithfulness:        target ≥ 0.92  (LLM-as-judge, per-claim)
  answer_relevance:    target ≥ 0.88  (LLM-as-judge, whole answer)

EVALUATION CADENCE
  retrieval suite:  run on every index rebuild
  generation suite: run on every model or prompt change`}
      </CodeBlock>

      <Section label="Building the eval set">
        <P>
          The hardest part of retrieval evaluation is building the labeled dataset. You need
          queries and the correct chunks for each. Three practical approaches: (1) mine production
          logs for real queries, manually label which articles resolved them; (2) use an LLM to
          generate query/source pairs from your documents, then validate a sample; (3) work
          backward from your worst-performing responses to identify the queries and sources that
          should have been used.
        </P>
        <P>
          The eval set should reflect your actual query distribution, not your idealized one.
          If 30% of real user queries are ambiguous or underspecified, your eval set should include
          them — because your system will face them, and optimizing for clean queries only produces
          a system that works in testing and fails in production.
        </P>
      </Section>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '12px' }}>
          <strong>Build Helix&apos;s retrieval eval suite.</strong>
        </p>
        <p>
          Using the query log sample and article corpus below, construct a 20-query eval set for
          Helix&apos;s retrieval pipeline. For each query: identify the correct source chunk(s),
          write the expected precision@3 target, and classify the query type (factual lookup,
          multi-doc, edge case, or adversarial). Then define one retrieval metric threshold you
          would use to gate an index rebuild.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}

// ── RAG Lesson 8 ──────────────────────────────────────────────────────────────

export function RAGLesson8Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        The embedding model is the most load-bearing component in your retrieval pipeline — and
        most teams pick it once, at the beginning, from a leaderboard, and never revisit. The
        MTEB leaderboard is a useful starting point. It is not an oracle. It measures performance
        on benchmark datasets that probably don&apos;t share your domain, your document structure,
        or your query distribution. The model that wins MTEB might not win on your corpus.
      </Lead>

      <P>
        Embedding models encode text into vectors. The quality of those vectors determines
        whether your retrieval step finds the right chunks. Two documents that should be near
        each other in your query/document space need to be near each other in vector space.
        A general-purpose embedding model may not place them near each other if your domain
        uses specialized vocabulary, abbreviations, or phrasing patterns that differ from the
        model&apos;s training data.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            MTEB scores are a prior, not a decision. Use MTEB to shortlist 3–5 candidates.
            Then eval each on your actual data. The delta between models on your eval set is
            often larger than the delta on MTEB — and it goes in a different direction.
          </Bullet>
          <Bullet>
            Domain matters more than model size. A mid-size model fine-tuned on legal text
            will outperform a large general model on a legal document corpus. A model
            trained on web crawl data may perform worse than expected on internal enterprise
            documentation, which uses different conventions.
          </Bullet>
          <Bullet>
            Query/document asymmetry is a real problem. Some embedding models are optimized
            for symmetric tasks (document similarity). Others are optimized for asymmetric
            tasks (short query against long document). Know which you have. For RAG,
            asymmetric models usually perform better.
          </Bullet>
          <Bullet>
            The scorecard structure: for each candidate model, measure precision@3, recall@20,
            and MRR on your eval set. Add inference latency and cost. Add operational
            constraints (self-hosted vs API, license). The winner is the model with the
            best retrieval metrics at acceptable cost and latency — not the MTEB top-5.
          </Bullet>
        </BulletList>
      </Section>

      <BlockQuote>
        The MTEB leaderboard tells you which model wins on benchmark data. Your eval set tells
        you which model wins on your data. Run both. Trust yours more.
      </BlockQuote>

      <Lead>
        For Helix, the initial choice was a general-purpose embedding model in the MTEB top 10.
        When evaluated on the Acme Analytics help center corpus, a smaller domain-adapted model
        outperformed it on precision@3 by 11 percentage points. That gap became visible only when
        the team built a proper eval set. Without one, they would have shipped the worse model
        with high confidence.
      </Lead>

      <ExerciseSoon lessonTitle="Embedding models: what makes one better for your use case." />
    </div>
  )
}

// ── RAG Lesson 9 ──────────────────────────────────────────────────────────────

export function RAGLesson9Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        A RAG system can degrade without any code change, any model change, or any configuration
        change. All it takes is for the world to move on while your index stays still. Stale
        retrieval is one of the most insidious production failure modes precisely because it is
        invisible to most monitoring setups — the pipeline runs, the metrics look normal, and
        users get answers that were correct six months ago.
      </Lead>

      <P>
        The freshness problem has two dimensions. Temporal staleness means your index no longer
        reflects the current state of your documents — articles were updated, policies changed,
        products were discontinued, but the index wasn&apos;t rebuilt. Coverage staleness means
        new documents were added to the source but never ingested — the user is asking about
        a product that launched last month and your index has never seen it.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            The silent failure pattern: retrieval returns an answer, the answer looks reasonable,
            but the policy it cites was updated three months ago. Confidence scores are high.
            LLM-as-judge gives it a good faithfulness score. Users follow the outdated guidance.
            No alert fires because nothing in the pipeline looks broken.
          </Bullet>
          <Bullet>
            Freshness strategies by corpus type: static corpora (legal texts, historical docs)
            can be indexed once. Slowly changing corpora (product docs, help centers) need
            scheduled rebuilds aligned with release cadence. Rapidly changing corpora
            (news, pricing, inventory) need streaming ingestion or real-time retrieval
            augmentation.
          </Bullet>
          <Bullet>
            Document-level TTL policies: assign every chunk a time-to-live based on the
            source document&apos;s expected change frequency. High-churn documents get shorter
            TTLs and trigger re-ingestion more aggressively. Low-churn documents can be
            left longer. This is cheaper than rebuilding the entire index on a fixed schedule.
          </Bullet>
          <Bullet>
            Staleness detection: log the last-ingested timestamp alongside each retrieved chunk.
            Surface it in your monitoring dashboard. Set an alert when more than X% of retrieved
            chunks are older than your staleness threshold. This is the signal most teams are not
            logging.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Helix ingests from a content management system with a webhook on article publish. When
        an article is updated, the old chunks for that article are deleted and the new content
        is re-ingested within minutes. This is the right architecture for a help center —
        but it required a deliberate choice to build streaming ingestion rather than nightly
        batch rebuilds, and that choice was made because the team catalogued their failure modes
        before designing the pipeline.
      </Lead>

      <ExerciseSoon lessonTitle="Index freshness and the stale knowledge problem." />
    </div>
  )
}

// ── RAG Lesson 10 ─────────────────────────────────────────────────────────────

export function RAGLesson10Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        The most common explanation for a RAG system that performs well in testing and poorly
        in production is query drift — the distribution of queries your users actually send
        is different from the distribution of queries you tested against. This is almost always
        true to some degree, and it becomes a serious problem when the gap is large enough that
        your index simply wasn&apos;t designed to answer what users are actually asking.
      </Lead>

      <P>
        Query drift happens in two directions. Coverage drift means users start asking about
        topics your index doesn&apos;t contain — a new product line, a regulatory change,
        a use case you didn&apos;t anticipate. Query phrasing drift means users word their
        questions differently than your eval set assumed — more colloquially, more
        domain-specifically, or in different languages. Both require different responses
        and both require monitoring to detect.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Log every query. This is the foundational requirement. You cannot detect drift
            without a record of what users are actually asking. Many teams skip this because
            of privacy concerns — use anonymization and aggregation, but keep the query signal.
          </Bullet>
          <Bullet>
            Measure retrieval failure rate: the proportion of queries that return no relevant
            chunks (zero-hit rate) or return chunks below your relevance threshold. A rising
            failure rate is the earliest signal of coverage drift. If users are asking questions
            your index can&apos;t answer, you need new documents — not better retrieval.
          </Bullet>
          <Bullet>
            Cluster your production queries periodically. Use embedding clustering to identify
            emerging topics in your query distribution. If a new cluster appears and grows,
            investigate whether your index covers it. This is how Helix discovered that users
            were asking billing questions in Spanish two months before the team planned to
            internationalize the help center.
          </Bullet>
          <Bullet>
            Query expansion as a mitigation: when queries are phrased differently than documents,
            have the LLM generate 2–3 alternative phrasings before retrieval. Run each, union
            the results, deduplicate. This reduces the phrasing mismatch penalty without
            requiring index changes, but adds latency.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Test query distributions are curated. Production query distributions are discovered.
        The gap between them is where most RAG products quietly fail. Treating query distribution
        monitoring as a first-class concern — not an afterthought — is what separates teams
        that improve over time from teams that keep debugging the same problem in different forms.
      </Lead>

      <ExerciseSoon lessonTitle="Query drift: when users ask what your index wasn't built for." />
    </div>
  )
}

// ── RAG Lesson 11 (full) ──────────────────────────────────────────────────────

export function RAGLesson11Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        Most RAG monitoring setups measure one thing: whether the system returned an answer.
        That&apos;s not monitoring — that&apos;s uptime checking. A system can return confident,
        coherent, well-formatted answers that are factually wrong, retrieved from stale documents,
        or grounded in chunks that don&apos;t address the actual question. You need four signals
        to know when any of these things are happening before users tell you.
      </Lead>

      <Section label="Signal 1: Retrieval rate">
        <P>
          The proportion of queries that return at least one chunk above your relevance threshold.
          A falling retrieval rate is the first indicator of coverage drift, index staleness,
          or embedding model degradation. Set a baseline in the first week of production. Alert
          if it falls more than 5 percentage points below that baseline.
        </P>
        <P>
          What it catches: new topics your index doesn&apos;t cover, index corruption after
          a failed rebuild, embedding model version mismatches between ingestion and query time.
        </P>
      </Section>

      <Section label="Signal 2: Retrieval relevance score">
        <P>
          The average similarity score of your top-k retrieved chunks. This requires logging
          the raw similarity scores your retriever returns, not just the chunks. A falling
          average score without a falling retrieval rate means retrieval is degrading
          silently — the right chunks are appearing in the results, but lower in the rankings,
          with weaker confidence.
        </P>
        <P>
          What it catches: query/document phrasing drift, embedding model degradation,
          index growth that pushes relevant chunks further from centroids.
        </P>
      </Section>

      <Section label="Signal 3: Faithfulness score">
        <P>
          The proportion of claims in generated answers that are grounded in retrieved context.
          Run this as an LLM-as-judge check on a sample of production responses — 5–10% is
          usually sufficient. A falling faithfulness score means the model is generating beyond
          its context, either because retrieval is failing or because the model&apos;s prior
          is overriding retrieved context.
        </P>
        <P>
          What it catches: retrieval quality degradation that reaches the generation step,
          model updates that change how strongly the model weights context vs prior,
          prompting issues that reduce context grounding.
        </P>
      </Section>

      <Section label="Signal 4: Answer confidence calibration">
        <P>
          If your system returns confidence scores or escalation flags, measure how well
          calibrated they are. A system that returns high confidence on wrong answers is
          worse than one that returns low confidence on wrong answers — because high confidence
          discourages user verification. Track the correlation between stated confidence and
          actual faithfulness. If it drifts, your calibration is breaking.
        </P>
        <P>
          What it catches: prompt changes that affect confidence expression, model updates
          that affect verbosity or hedging, edge cases where retrieval succeeded but the
          model doesn&apos;t register uncertainty.
        </P>
      </Section>

      <CodeBlock>
{`# Helix four-signal monitoring plan

SIGNAL 1: RETRIEVAL RATE
  metric:    fraction of queries with top_score ≥ 0.72
  baseline:  0.91 (measured week 1 of production)
  alert:     < 0.86 (5-point drop)
  cadence:   hourly rolling average
  owner:     retrieval team

SIGNAL 2: RETRIEVAL RELEVANCE SCORE
  metric:    avg similarity score of top-3 retrieved chunks
  baseline:  0.81
  alert:     < 0.76
  cadence:   daily
  owner:     retrieval team

SIGNAL 3: FAITHFULNESS SCORE
  metric:    LLM-as-judge faithfulness on 8% random sample
  baseline:  0.94
  alert:     < 0.89
  cadence:   daily (sampled)
  owner:     model team

SIGNAL 4: CONFIDENCE CALIBRATION
  metric:    Pearson correlation of stated confidence vs faithfulness
  baseline:  0.78
  alert:     < 0.65
  cadence:   weekly
  owner:     model team`}
      </CodeBlock>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '12px' }}>
          <strong>Build Helix&apos;s production monitoring plan.</strong>
        </p>
        <p>
          Using the Helix system spec and a week of simulated query logs below, fill in all
          four signals: define the metric, set a baseline from the log data, set an alert
          threshold, assign a cadence, and name which part of the stack is responsible for
          responding to each alert.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}

// ── RAG Lesson 12 ─────────────────────────────────────────────────────────────

export function RAGLesson12Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        RAG is not always the right answer. Knowing its ceiling — and the conditions under which
        other approaches win — is as important as knowing how to build it well. Teams that
        treat RAG as a universal solution end up building unnecessarily complex pipelines for
        problems that a simpler approach would have solved, or hitting a quality ceiling they
        could have avoided by choosing differently at the start.
      </Lead>

      <P>
        The two dimensions that drive the RAG vs alternatives decision are corpus size and change
        frequency. Large corpora that change frequently are the canonical RAG use case: the knowledge
        base is too big to fit in context and updates too often to fine-tune on. Small corpora that
        change rarely are the canonical long-context use case: put the whole thing in the prompt
        and let the model reason over it directly. Fine-tuning answers a different question entirely.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            RAG wins when: corpus is large (10k+ documents), content changes frequently (weekly
            or more), you need source citations, or different users need access to different
            document subsets (RAG enables per-query access control at retrieval time).
          </Bullet>
          <Bullet>
            Long context wins when: corpus is small and stable, latency matters more than cost,
            you need the model to reason across the entire corpus simultaneously (not just
            retrieved chunks), or infrastructure complexity is a major constraint. The cost
            per query is high; the engineering cost is low.
          </Bullet>
          <Bullet>
            Fine-tuning wins when: you need the model to adopt a consistent style, format,
            or domain-specific behavior — not facts. Fine-tuning teaches a model to write
            like your brand, reason in your domain&apos;s terms, or follow your output schema
            reliably. It does not reliably teach facts, especially facts that will change.
          </Bullet>
          <Bullet>
            Hybrid approaches: fine-tune the model for style and format, RAG for facts.
            Or long-context for the stable core knowledge, RAG for the live-updating periphery.
            These combinations are increasingly common in production systems.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        Helix uses RAG because the Acme Analytics help center has 40,000 articles that are
        updated continuously. Long context at that scale is cost-prohibitive. Fine-tuning
        would teach Helix the current policies and then go stale immediately. RAG is the right
        choice — but it&apos;s the right choice because of specific characteristics of the corpus,
        not because RAG is always right.
      </Lead>

      <ExerciseSoon lessonTitle="When to move beyond RAG: fine-tuning, hybrid, or long context." />
    </div>
  )
}

// ── RAG Lesson 13 ─────────────────────────────────────────────────────────────

export function RAGLesson13Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        In a pipeline RAG system, you decide the retrieval strategy. You pick the retriever,
        set the top-k, choose the chunk size, define what gets retrieved. In an agentic RAG
        system, the agent makes those decisions — per query, based on what it knows about
        the query and what tools it has available. Retrieval became a learned policy rather
        than a fixed configuration, and that shift changes everything about how you build,
        evaluate, and operate retrieval systems.
      </Lead>

      <P>
        The agentic shift matters because not every query benefits from the same retrieval
        strategy. A factual lookup needs precise retrieval and a small top-k. An exploratory
        question needs broad retrieval across multiple document types. A multi-hop question
        needs sequential retrieval where the results of the first retrieval inform what to
        retrieve next. A fixed pipeline gives every query the same treatment. An agentic
        system can route each query to the appropriate strategy.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Conditional retrieval: the agent first decides whether retrieval is necessary at
            all. Simple factual questions the model already knows the answer to don&apos;t
            need retrieval — triggering it wastes latency and adds noise. The agent should
            classify whether retrieval would improve the answer before invoking it.
          </Bullet>
          <Bullet>
            Multi-hop retrieval: the agent retrieves once, reads the results, identifies a
            gap, and retrieves again with a refined query. This handles questions that require
            connecting information across multiple documents — something a single-pass pipeline
            cannot do. It adds latency proportional to the number of hops; budget accordingly.
          </Bullet>
          <Bullet>
            Tool-based retrieval: in an agentic framework, retrieval is a tool the agent calls,
            not a pipeline step it passes through. This means the agent can choose which retrieval
            tool to use: vector search for semantic queries, keyword search for exact match,
            SQL for structured data, grep for code. The right tool depends on the query.
          </Bullet>
          <Bullet>
            Evaluation changes: per-query strategy decisions need per-query evals. A single
            end-of-pipeline faithfulness score no longer captures whether the agent made good
            retrieval decisions. You need trace-level logging that shows what was retrieved at
            each hop and why.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        This is the inflection point the rest of the module builds from. When retrieval is a
        policy rather than a configuration, the PM&apos;s job shifts from &ldquo;configure the
        pipeline&rdquo; to &ldquo;define the retrieval policy and eval it.&rdquo; Lessons 14–16
        cover the specific decisions that policy requires.
      </Lead>

      <ExerciseSoon lessonTitle="Retrieval is now a decision the system makes, not you." />
    </div>
  )
}

// ── RAG Lesson 14 ─────────────────────────────────────────────────────────────

export function RAGLesson14Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        Two years ago, the standard RAG architecture was: chunk documents, embed with a
        transformer, store in a vector database, retrieve by cosine similarity. That architecture
        is still valid — but it is no longer the default. The retrieval strategy landscape has
        expanded significantly, and the decision about which strategy to use for which query
        is now the central architectural choice in any agentic RAG system.
      </Lead>

      <P>
        The expansion happened for two reasons. Embedding models have improved dramatically,
        but so have alternatives. Long-context models can now reason over documents that would
        have required sophisticated chunking and retrieval a year ago. Structured data queries
        — previously impossible with vector retrieval — are now accessible through SQL agents.
        And the resurgence of sparse retrieval (BM25, grep) has reminded the field that
        fast exact-match retrieval is often better than slow semantic retrieval for structured
        or code-heavy corpora.
      </P>

      <Section label="The strategy landscape">
        <BulletList>
          <Bullet>
            <strong>Vector retrieval:</strong> semantic similarity search over embedded chunks.
            Best for: prose documents, semantic queries, large corpora where the query
            phrasing differs from document phrasing. Still the right default for unstructured
            text at scale.
          </Bullet>
          <Bullet>
            <strong>Sparse / keyword retrieval:</strong> BM25, TF-IDF, grep. Best for: exact
            identifiers, product codes, section numbers, code search, any query where the
            exact terms matter. Fast, interpretable, and often underused in systems that
            defaulted to vectors without thinking.
          </Bullet>
          <Bullet>
            <strong>Structured query retrieval:</strong> SQL or similar against a structured
            database. Best for: numerical data, filtered lookups, aggregations. If your
            &ldquo;knowledge base&rdquo; is actually a database with known schema, this is
            probably the right answer — not vector search.
          </Bullet>
          <Bullet>
            <strong>Long-context injection:</strong> include the relevant documents in full
            context without retrieval. Best for: small, stable, well-defined document sets
            where the user&apos;s question might require reasoning across the full corpus.
            Cost is high; retrieval complexity is zero.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        The retrieval-strategy decision matrix is your second-to-last artifact. It maps query
        types to retrieval strategies based on corpus characteristics, query characteristics,
        and operational constraints. In an agentic system, this matrix becomes the routing
        policy — the logic that decides which tool to call for which query class.
      </Lead>

      <ExerciseSoon lessonTitle="The retrieval-strategy decision: vector is no longer the default." />
    </div>
  )
}

// ── RAG Lesson 15 ─────────────────────────────────────────────────────────────

export function RAGLesson15Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        A single-pass RAG pipeline is straightforward to evaluate: send in a query, retrieve
        chunks, generate an answer, score the answer. When retrieval happens more than once —
        when the system multi-hops, re-retrieves after reading initial results, or orchestrates
        parallel retrieval across multiple sources — end-of-pipeline evaluation stops working.
        You see the final answer. You cannot see which retrieval step went wrong.
      </Lead>

      <P>
        The &ldquo;fabricated fact #7&rdquo; problem illustrates this concretely. An agentic
        RAG system generates an answer with eight factual claims. Seven are grounded in retrieved
        context. One is fabricated — the model generated it from prior knowledge because the
        relevant chunk was not retrieved in any of the three retrieval hops. A faithfulness score
        of 7/8 looks reasonable. But the fabricated claim may be the most important one. And you
        cannot tell from the end-of-pipeline score which hop failed to retrieve the relevant context.
      </P>

      <Section label="The core of this lesson">
        <BulletList>
          <Bullet>
            Trace-level logging: every retrieval call in a multi-hop system should log its
            input query, the chunks returned, and the relevance scores. This creates an
            audit trail that lets you diagnose which hop failed for any given response.
            Without trace logging, multi-hop systems are nearly impossible to debug systematically.
          </Bullet>
          <Bullet>
            Per-span faithfulness: run faithfulness checks at each generation step, not
            just the final output. If the system reads retrieved chunks and generates an
            intermediate summary before the second retrieval hop, that summary should be
            checked for faithfulness before it influences the second query.
          </Bullet>
          <Bullet>
            Retrieval decision auditing: log not just what was retrieved, but why the agent
            chose to retrieve it. In a tool-use framework, the agent&apos;s tool call includes
            the query it chose to issue. Reviewing those queries across a production sample
            reveals whether the agent is making sensible retrieval decisions or drifting.
          </Bullet>
          <Bullet>
            The eval cadence change: single-pass pipeline evals can run on demand. Multi-hop
            eval requires replaying traces, which is slower and more expensive. Design your
            eval suite to run on a sample rather than every query, and invest in a trace
            viewer that makes individual trace inspection practical.
          </Bullet>
        </BulletList>
      </Section>

      <Lead>
        The core principle for multi-hop evaluation: evaluate the decisions, not just the outcomes.
        A system that makes good retrieval decisions at each hop and still produces a poor final
        answer has a generation problem. A system that produces a good final answer after making
        poor retrieval decisions got lucky — and will fail unpredictably. You need both signals.
      </Lead>

      <ExerciseSoon lessonTitle="Evaluating systems that retrieve more than once." />
    </div>
  )
}

// ── RAG Lesson 16 ─────────────────────────────────────────────────────────────

export function RAGLesson16Body() {
  return (
    <div>
      <HelixBox />

      <Lead>
        RAG at scale is expensive. Every query triggers embedding, retrieval, reranking, and
        generation. At high volume, those costs compound quickly — especially if your system
        retrieves broadly (large top-k), uses expensive embedding models, and routes every
        query through the full pipeline regardless of whether it needs it. The final lesson in
        this course is about cost control: two levers that reduce cost without reducing quality,
        and the routing policy that decides when to use each.
      </Lead>

      <P>
        The two levers are caching and adaptive routing. Caching stores retrieval results (and
        sometimes generated answers) for queries that are likely to recur. Adaptive routing
        classifies queries and sends them to the cheapest pipeline that can answer them correctly —
        and that means some queries bypass retrieval entirely.
      </P>

      <Section label="Caching strategies">
        <BulletList>
          <Bullet>
            <strong>Query-level cache:</strong> store retrieval results keyed by the (normalized)
            query. When the same query arrives again, return the cached chunks without re-embedding
            or re-retrieving. Works well for help center copilots where a small number of
            high-frequency questions dominate volume. Cache hit rates of 30–50% are common.
          </Bullet>
          <Bullet>
            <strong>Semantic cache:</strong> embed the incoming query and check for similar
            queries in the cache (cosine similarity above a threshold). Return the cached result
            for the most similar prior query. Handles paraphrasing. Higher infrastructure cost
            than exact-match caching but catches far more repeat patterns.
          </Bullet>
          <Bullet>
            <strong>Prompt cache:</strong> for stable system prompt content — your retrieval
            instructions, few-shot examples, and document preambles — use the LLM
            provider&apos;s prompt caching feature. The stable prefix is cached on the first
            call and reused, dramatically reducing token costs for the LLM call itself.
          </Bullet>
        </BulletList>
      </Section>

      <Section label="Adaptive routing">
        <P>
          Not every query needs retrieval. A question like &ldquo;what does RAG stand for?&rdquo;
          can be answered from model knowledge without retrieving anything. A question like
          &ldquo;what is Acme Analytics&apos; refund policy for annual plans?&rdquo; requires
          retrieval. A query classifier that runs before retrieval can route each query to
          the right path: model-only (no retrieval), cached retrieval, or full retrieval.
        </P>
        <P>
          The classifier adds a small latency cost upfront. For high-volume systems, the savings
          from eliminating unnecessary retrieval calls far exceed that cost. The routing policy
          you build here is the final artifact.
        </P>
      </Section>

      <CodeBlock>
{`# Helix retrieval-strategy decision matrix + query-routing policy

QUERY CLASSIFIER OUTPUT → ROUTE

model_only
  condition:  general knowledge question, no Acme-specific entities
  pipeline:   LLM call only (no retrieval)
  cost:       ~$0.001/query
  latency:    ~800ms

cache_hit
  condition:  query similarity ≥ 0.94 to cached query
  pipeline:   return cached retrieval result → LLM call
  cost:       ~$0.0005/query (cache amortized)
  latency:    ~400ms

standard_retrieval
  condition:  Acme-specific query, cache miss
  pipeline:   hybrid retrieve → rerank → LLM call
  cost:       ~$0.008/query
  latency:    ~1200ms

deep_retrieval
  condition:  multi-doc question, comparative question, audit trail required
  pipeline:   multi-hop retrieve → per-span faithfulness check → LLM call
  cost:       ~$0.022/query
  latency:    ~2800ms

ROUTING DISTRIBUTION (measured, week 4 production)
  model_only:          12%
  cache_hit:           34%
  standard_retrieval:  49%
  deep_retrieval:       5%

COST REDUCTION VS FULL RETRIEVAL ON EVERY QUERY: 52%`}
      </CodeBlock>

      <ExerciseLeadIn>
        <p style={{ marginBottom: '12px' }}>
          <strong>Build Helix&apos;s retrieval-strategy decision matrix and query-routing policy.</strong>
        </p>
        <p>
          Using the query log sample and cost data below, design a routing policy for Helix:
          define your query classes, assign each to a retrieval strategy, estimate the cost
          and latency for each route, and project the cost reduction vs a flat
          full-retrieval-on-every-query baseline. This is your final artifact.
        </p>
      </ExerciseLeadIn>
    </div>
  )
}
