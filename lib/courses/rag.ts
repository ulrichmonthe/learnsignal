// RAG: Building Knowledge-Grounded AI Products — course metadata for all 16 lessons.
// Body content lives in components/courses/rag-bodies.tsx.

import type { Course, LessonMeta } from './evals-foundations'

export const RAG_COURSE: Course = {
  slug: 'rag',
  title: 'RAG: Building Knowledge-Grounded AI Products',
  description:
    "The model doesn't know your data — and a bigger context window won't save you. Learn to design, evaluate, and operate retrieval systems that ground answers in truth, from the chunking call nobody takes seriously to the agentic era where retrieval is a decision the system makes, not you. Built around a real doc-grounded support copilot, Helix, as the test bed.",
  estimatedMinutes: 286,
  modules: [
    {
      slug: 'why-the-model-doesnt-know-things',
      title: "Why The Model Doesn't Know Things",
      lessons: [
        {
          slug: 'lesson-1',
          title: 'The knowledge cutoff is the least of your problems.',
          headline: 'The cutoff is the visible gap. Your firewalled data was never in training at all.',
          tags: 'RAG · LESSON 1 · 14 MIN READ',
          estimatedMinutes: 14,
          lessonNumber: 1,
          moduleSlug: 'why-the-model-doesnt-know-things',
          moduleTitle: "Why The Model Doesn't Know Things",
          ctaText: 'READ LESSON 2 →',
          ctaHref: '/playground/learn/rag/lesson-2',
        },
        {
          slug: 'lesson-2',
          title: "What RAG is, and what it isn't.",
          headline: 'RAG hands the model documents at answer time. It does not teach the model anything.',
          tags: 'RAG · LESSON 2 · 12 MIN READ',
          estimatedMinutes: 12,
          lessonNumber: 2,
          moduleSlug: 'why-the-model-doesnt-know-things',
          moduleTitle: "Why The Model Doesn't Know Things",
          ctaText: 'READ LESSON 3 →',
          ctaHref: '/playground/learn/rag/lesson-3',
        },
        {
          slug: 'lesson-3',
          title: 'The three failure modes that kill RAG systems.',
          headline: "Retrieval, generation, or both — most teams can't tell which one is broken.",
          tags: 'RAG · LESSON 3 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 3,
          moduleSlug: 'why-the-model-doesnt-know-things',
          moduleTitle: "Why The Model Doesn't Know Things",
          ctaText: 'READ LESSON 4 →',
          ctaHref: '/playground/learn/rag/lesson-4',
        },
        {
          slug: 'lesson-4',
          title: "Chunking: the decision nobody takes seriously enough.",
          headline: "The wrong split drops the speaker's name and breaks the answer. There is no one right size.",
          tags: 'RAG · LESSON 4 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 4,
          moduleSlug: 'why-the-model-doesnt-know-things',
          moduleTitle: "Why The Model Doesn't Know Things",
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
      ],
    },
    {
      slug: 'making-retrieval-work',
      title: 'Making Retrieval Work',
      lessons: [
        {
          slug: 'lesson-5',
          title: 'Dense, sparse, and hybrid retrieval: when each wins.',
          headline: '"Section 420" must match exactly. "What if someone lies for money?" needs meaning. Neither alone is enough.',
          tags: 'RAG · LESSON 5 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 5,
          moduleSlug: 'making-retrieval-work',
          moduleTitle: 'Making Retrieval Work',
          ctaText: 'READ LESSON 6 →',
          ctaHref: '/playground/learn/rag/lesson-6',
        },
        {
          slug: 'lesson-6',
          title: 'When to add a reranking layer.',
          headline: 'Retrieve broadly, rank precisely. The fix for mediocre results is usually a reranker, not a better embedding.',
          tags: 'RAG · LESSON 6 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 6,
          moduleSlug: 'making-retrieval-work',
          moduleTitle: 'Making Retrieval Work',
          ctaText: 'READ LESSON 7 →',
          ctaHref: '/playground/learn/rag/lesson-7',
        },
        {
          slug: 'lesson-7',
          title: 'Evaluating retrieval quality separately from generation.',
          headline: "If you score the whole pipeline at once, you'll never know which half failed.",
          tags: 'RAG · LESSON 7 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 7,
          moduleSlug: 'making-retrieval-work',
          moduleTitle: 'Making Retrieval Work',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-8',
          title: 'Embedding models: what makes one better for your use case.',
          headline: "The MTEB leaderboard is a prior, not an oracle. Your eval set knows your domain; the leaderboard doesn't.",
          tags: 'RAG · LESSON 8 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 8,
          moduleSlug: 'making-retrieval-work',
          moduleTitle: 'Making Retrieval Work',
          ctaText: 'READ LESSON 9 →',
          ctaHref: '/playground/learn/rag/lesson-9',
        },
      ],
    },
    {
      slug: 'operating-rag-in-production',
      title: 'Operating RAG in Production',
      lessons: [
        {
          slug: 'lesson-9',
          title: 'Index freshness and the stale knowledge problem.',
          headline: 'Stale retrieval flips from a performance enhancer to an active liability — silently.',
          tags: 'RAG · LESSON 9 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 9,
          moduleSlug: 'operating-rag-in-production',
          moduleTitle: 'Operating RAG in Production',
          ctaText: 'READ LESSON 10 →',
          ctaHref: '/playground/learn/rag/lesson-10',
        },
        {
          slug: 'lesson-10',
          title: "Query drift: when users ask what your index wasn't built for.",
          headline: "Good in testing, poor in production almost always means your test queries don't match real ones.",
          tags: 'RAG · LESSON 10 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 10,
          moduleSlug: 'operating-rag-in-production',
          moduleTitle: 'Operating RAG in Production',
          ctaText: 'READ LESSON 11 →',
          ctaHref: '/playground/learn/rag/lesson-11',
        },
        {
          slug: 'lesson-11',
          title: 'The RAG monitoring stack every PM should know exists.',
          headline: 'Four signals warn you before users complain. Most teams log none of them.',
          tags: 'RAG · LESSON 11 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 11,
          moduleSlug: 'operating-rag-in-production',
          moduleTitle: 'Operating RAG in Production',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-12',
          title: 'When to move beyond RAG: fine-tuning, hybrid, or long context.',
          headline: "Knowing RAG's ceiling is its own skill. Large/changing → RAG. Small/static → long context.",
          tags: 'RAG · LESSON 12 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 12,
          moduleSlug: 'operating-rag-in-production',
          moduleTitle: 'Operating RAG in Production',
          ctaText: 'READ LESSON 13 →',
          ctaHref: '/playground/learn/rag/lesson-13',
        },
      ],
    },
    {
      slug: 'rag-in-the-agentic-era',
      title: 'RAG in the Agentic Era',
      lessons: [
        {
          slug: 'lesson-13',
          title: 'Retrieval is now a decision the system makes, not you.',
          headline: 'The agent picks the retriever, the top-k, the chunk size — per query. Retrieval became a learned policy.',
          tags: 'RAG · LESSON 13 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 13,
          moduleSlug: 'rag-in-the-agentic-era',
          moduleTitle: 'RAG in the Agentic Era',
          ctaText: 'READ LESSON 14 →',
          ctaHref: '/playground/learn/rag/lesson-14',
        },
        {
          slug: 'lesson-14',
          title: 'The retrieval-strategy decision: vector is no longer the default.',
          headline: 'Standalone vector DBs are losing share. Grep, structured queries, and long context are all "retrieval" now.',
          tags: 'RAG · LESSON 14 · 22 MIN READ',
          estimatedMinutes: 22,
          lessonNumber: 14,
          moduleSlug: 'rag-in-the-agentic-era',
          moduleTitle: 'RAG in the Agentic Era',
          ctaText: 'READ LESSON 15 →',
          ctaHref: '/playground/learn/rag/lesson-15',
        },
        {
          slug: 'lesson-15',
          title: 'Evaluating systems that retrieve more than once.',
          headline: 'A one-shot end-of-pipeline eval never catches the agent that fabricates fact #7. You need per-span checks.',
          tags: 'RAG · LESSON 15 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 15,
          moduleSlug: 'rag-in-the-agentic-era',
          moduleTitle: 'RAG in the Agentic Era',
          ctaText: 'READ LESSON 16 →',
          ctaHref: '/playground/learn/rag/lesson-16',
        },
        {
          slug: 'lesson-16',
          title: 'The new cost levers: caching and adaptive routing.',
          headline: 'Cache the stable tokens. Route the easy queries away from retrieval entirely. Cost control is now mandatory.',
          tags: 'RAG · LESSON 16 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 16,
          moduleSlug: 'rag-in-the-agentic-era',
          moduleTitle: 'RAG in the Agentic Era',
          ctaText: 'BACK TO COURSE OVERVIEW →',
          ctaHref: '/playground/learn/rag',
        },
      ],
    },
  ],
}

export const ALL_RAG_LESSONS: LessonMeta[] = RAG_COURSE.modules.flatMap(m => m.lessons)

export function getRAGLessonBySlug(slug: string): LessonMeta | undefined {
  return ALL_RAG_LESSONS.find(l => l.slug === slug)
}

export function getAdjacentRAGLessons(slug: string): {
  prev: LessonMeta | null
  next: LessonMeta | null
} {
  const idx = ALL_RAG_LESSONS.findIndex(l => l.slug === slug)
  return {
    prev: idx > 0 ? ALL_RAG_LESSONS[idx - 1] : null,
    next: idx < ALL_RAG_LESSONS.length - 1 ? ALL_RAG_LESSONS[idx + 1] : null,
  }
}

export const RAG_ARTIFACT_PREVIEWS = [
  { label: "Helix's chunking + ingestion decision log", lesson: 4, icon: '◎' },
  { label: 'A retrieval eval suite (precision, recall, faithfulness)', lesson: 7, icon: '◈' },
  { label: 'An embedding-model selection scorecard', lesson: 8, icon: '⬡' },
  { label: 'A four-signal production monitoring plan', lesson: 11, icon: '◉' },
  { label: 'A retrieval-strategy decision matrix + query-routing policy', lesson: 16, icon: '◇' },
]
