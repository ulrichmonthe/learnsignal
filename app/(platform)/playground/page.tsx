import Link from 'next/link'

type PlayArea = {
  eyebrow: string
  title: string
  tagline: string
  learn: string[]
  realWorld: string[]
  href: string
  cta: string
  accent: string
}

const AREAS: PlayArea[] = [
  {
    eyebrow: 'Retrieval',
    title: 'RAG Lab',
    tagline: "Build Helix's retrieval pipeline across 13 graded missions.",
    learn: [
      "Why a model doesn't know your data — and when RAG beats fine-tuning",
      'Chunking, dense vs sparse vs hybrid retrieval, and reranking',
      'Operating RAG in production: stale indexes, query drift, and cost',
    ],
    realWorld: [
      'A support copilot that cites the right help article instead of inventing one',
      'Cutting wrong answers by fixing how documents get split into chunks',
      'Keeping a knowledge bot accurate as your docs change every week',
    ],
    href: '/playground/rag-lab',
    cta: 'Enter the RAG Lab',
    accent: 'rgba(200,240,64,0.9)',
  },
  {
    eyebrow: 'Prompt & Context',
    title: 'PCE Lab',
    tagline: 'Make Atlas production-ready across 10 missions.',
    learn: [
      'Designing a system prompt that survives real product constraints',
      'Context assembly — what to put in the window, and what to leave out',
      'Few-shot examples and output formatting that hold up under pressure',
    ],
    realWorld: [
      "Tuning an assistant's tone and safety without 3×-ing the token bill",
      'Writing the context blueprint for a doc-grounded support bot',
      'Stopping a prompt that aced the demo from drifting in production',
    ],
    href: '/playground/pce-lab',
    cta: 'Enter the PCE Lab',
    accent: 'rgba(100,200,255,0.9)',
  },
  {
    eyebrow: 'Evaluation',
    title: 'Eval Lab',
    tagline: "Learn what “good” looks like — then prove it.",
    learn: [
      'The eval ladder: vibe check → offline evals → production monitoring',
      'Writing evaluators and building a golden dataset',
      'Catching regressions before your users do',
    ],
    realWorld: [
      'Labeling 20 support tickets to find the failure patterns that matter',
      'Building a rubric for outputs that have no single right answer',
      'Knowing — with evidence — when an AI feature is ready to ship',
    ],
    href: '/playground/eval-lab/concept',
    cta: 'Enter the Eval Lab',
    accent: 'rgba(255,180,80,0.9)',
  },
  {
    eyebrow: 'Orchestration',
    title: 'The Orchestration Lab',
    tagline: 'Don’t calculate the cost curve. Run it.',
    learn: [
      'Simulate any topology 1,000 times — measured accuracy vs the Π you predicted',
      'Watch a fan-out with no reducer fail the way the course says it will',
      'The demo-luck moment: four clean runs at 88% is a 60% coin flip',
    ],
    realWorld: [
      'Proving a five-stage pipeline is really a 77% system before you ship it',
      'Costing a fan-out at 3× volume before finance flags the invoice',
      'Deciding how much autonomy an agent gets by seeing its 24-hour blast radius',
    ],
    href: '/playground/orchestration-lab',
    cta: 'Enter the Lab',
    accent: 'rgba(200,240,64,0.9)',
  },
  {
    eyebrow: 'Courses',
    title: 'The Course Library',
    tagline: 'Five courses. Self-paced. Built for practitioners.',
    learn: [
      'Evals, Prompt & Context, Harness, RAG, and Agent Orchestration',
      'Concepts grounded in real product decisions, not slides',
      'Artifacts you keep: eval suites, scorecards, monitoring plans',
    ],
    realWorld: [
      'A shared vocabulary with your ML team on day one',
      'Decision frameworks you reach for in the next sprint planning',
      "The judgment to push back on “let's just fine-tune it”",
    ],
    href: '/playground/learn',
    cta: 'Browse courses',
    accent: 'rgba(200,100,255,0.9)',
  },
]

function Bullets({ heading, items, color }: { heading: string; items: string[]; color: string }) {
  return (
    <div>
      <p className="font-mono uppercase mb-2" style={{ fontSize: '9px', letterSpacing: '0.14em', color }}>
        {heading}
      </p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2" style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, fontFamily: 'var(--font-dm-sans)' }}>
            <span style={{ color, flexShrink: 0 }}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[1100px] mx-auto px-6 pt-12 pb-24">
        <p className="font-mono text-[11px] tracking-[0.12em] text-text3 uppercase mb-3">Playground</p>
        <h1 className="font-display font-medium text-text mb-3 leading-tight" style={{ fontSize: 'clamp(26px, 4vw, 34px)' }}>
          Pick a play area
        </h1>
        <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm-sans)', maxWidth: '560px' }}>
          Each is a hands-on environment that builds one real AI-PM muscle. Skim what you&apos;ll learn and
          where it shows up on the job, then jump in.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {AREAS.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="group flex flex-col rounded-xl p-6 transition-all"
              style={{ border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', textDecoration: 'none' }}
            >
              <p className="font-mono uppercase mb-2" style={{ fontSize: '10px', letterSpacing: '0.14em', color: a.accent }}>
                {a.eyebrow}
              </p>
              <h2 className="font-display font-medium text-text mb-2" style={{ fontSize: '20px', fontStyle: 'italic' }}>
                {a.title}
              </h2>
              <p className="mb-5" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, fontFamily: 'var(--font-dm-sans)' }}>
                {a.tagline}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 flex-1">
                <Bullets heading="What you'll learn" items={a.learn} color={a.accent} />
                <Bullets heading="In the real world" items={a.realWorld} color="rgba(255,255,255,0.35)" />
              </div>

              <span
                className="inline-flex items-center gap-2 font-mono mt-auto"
                style={{ fontSize: '11px', letterSpacing: '0.1em', color: a.accent }}
              >
                {a.cta} <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
