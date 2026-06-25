// Prompt & Context Engineering — course metadata for all 10 lessons.
// Body content lives in components/courses/prompt-context-bodies.tsx (Phase A).

import type { Course, LessonMeta } from './evals-foundations'

export const PROMPT_CONTEXT_COURSE: Course = {
  slug: 'prompt-context-engineering',
  title: 'Prompt & Context Engineering',
  description:
    'Stop tuning strings by trial and error. Learn to engineer the entire context that reaches the model — the discipline that separates AI PMs who ship reliable products from AI PMs who keep getting surprised in production. Built around a real doc-grounded support copilot, Atlas, as the test bed.',
  estimatedMinutes: 184,
  modules: [
    {
      slug: 'the-shift',
      title: 'The Shift',
      lessons: [
        {
          slug: 'lesson-1',
          title: "You didn't ship a prompt. You shipped a context strategy.",
          headline: 'The prompt is the part you can see. The context is the part that decides whether it works.',
          tags: 'PROMPT & CONTEXT · LESSON 1 · 8 MIN READ',
          estimatedMinutes: 8,
          lessonNumber: 1,
          moduleSlug: 'the-shift',
          moduleTitle: 'The Shift',
          ctaText: 'READ LESSON 2 →',
          ctaHref: '/playground/learn/prompt-context-engineering/lesson-2',
        },
        {
          slug: 'lesson-2',
          title: 'Your context window is a budget. Attention is the currency.',
          headline: 'Every token you add makes every other token matter a little less.',
          tags: 'PROMPT & CONTEXT · LESSON 2 · 12 MIN READ',
          estimatedMinutes: 12,
          lessonNumber: 2,
          moduleSlug: 'the-shift',
          moduleTitle: 'The Shift',
          ctaText: 'READ LESSON 3 →',
          ctaHref: '/playground/learn/prompt-context-engineering/lesson-3',
        },
      ],
    },
    {
      slug: 'the-prompt',
      title: 'The Prompt',
      lessons: [
        {
          slug: 'lesson-3',
          title: 'Anatomy of a system prompt that holds up.',
          headline: 'Most prompts that fail in production fail for reasons you could see on paper.',
          tags: 'PROMPT & CONTEXT · LESSON 3 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 3,
          moduleSlug: 'the-prompt',
          moduleTitle: 'The Prompt',
          ctaText: 'WRITE YOUR SYSTEM PROMPT →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-4',
          title: "Show, don't tell: few-shot that generalizes.",
          headline: 'Three good examples beat three paragraphs of rules. Three bad ones beat nothing at all.',
          tags: 'PROMPT & CONTEXT · LESSON 4 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 4,
          moduleSlug: 'the-prompt',
          moduleTitle: 'The Prompt',
          ctaText: 'BUILD YOUR FEW-SHOT SET →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-5',
          title: 'Controlling what comes back: reasoning and structure.',
          headline: "Nobody ships \"it usually returns JSON.\" You ship a schema, or you ship a bug.",
          tags: 'PROMPT & CONTEXT · LESSON 5 · 24 MIN READ',
          estimatedMinutes: 24,
          lessonNumber: 5,
          moduleSlug: 'the-prompt',
          moduleTitle: 'The Prompt',
          ctaText: 'DESIGN YOUR OUTPUT SCHEMA →',
          ctaHref: '#exercise',
        },
      ],
    },
    {
      slug: 'the-context',
      title: 'The Context',
      lessons: [
        {
          slug: 'lesson-6',
          title: 'Context is the unit of work: write, select, compress, isolate.',
          headline: 'Stop editing the prompt. Start engineering what reaches the model at runtime.',
          tags: 'PROMPT & CONTEXT · LESSON 6 · 22 MIN READ',
          estimatedMinutes: 22,
          lessonNumber: 6,
          moduleSlug: 'the-context',
          moduleTitle: 'The Context',
          ctaText: 'BUILD YOUR CONTEXT BLUEPRINT →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-7',
          title: 'Retrieval without the lies: RAG and lost-in-the-middle.',
          headline: "A bigger context window doesn't fix bad retrieval. It buries it in the middle.",
          tags: 'PROMPT & CONTEXT · LESSON 7 · 22 MIN READ',
          estimatedMinutes: 22,
          lessonNumber: 7,
          moduleSlug: 'the-context',
          moduleTitle: 'The Context',
          ctaText: 'MAP RETRIEVAL FAILURE PATTERNS →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-8',
          title: 'Memory, history, and the bill: what to keep, drop, and cache.',
          headline: 'Every turn your conversation gets longer, dumber, and more expensive. Pick which one to fight.',
          tags: 'PROMPT & CONTEXT · LESSON 8 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 8,
          moduleSlug: 'the-context',
          moduleTitle: 'The Context',
          ctaText: 'DESIGN YOUR MEMORY ARCHITECTURE →',
          ctaHref: '#exercise',
        },
      ],
    },
    {
      slug: 'production',
      title: 'Production',
      lessons: [
        {
          slug: 'lesson-9',
          title: 'The failure modes that cost you trust.',
          headline: "Hallucination, sycophancy, and injection aren't edge cases. They're the resting state.",
          tags: 'PROMPT & CONTEXT · LESSON 9 · 22 MIN READ',
          estimatedMinutes: 22,
          lessonNumber: 9,
          moduleSlug: 'production',
          moduleTitle: 'Production',
          ctaText: 'BUILD YOUR FAILURE CHECKLIST →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-10',
          title: 'Prompts are code: versioning, regression, and the trajectory problem.',
          headline: 'The prompt that worked last quarter is quietly breaking on the model you upgraded to this quarter.',
          tags: 'PROMPT & CONTEXT · LESSON 10 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 10,
          moduleSlug: 'production',
          moduleTitle: 'Production',
          ctaText: 'SET UP YOUR REGRESSION SUITE →',
          ctaHref: '#exercise',
        },
      ],
    },
  ],
}

export const ALL_PCE_LESSONS: LessonMeta[] = PROMPT_CONTEXT_COURSE.modules.flatMap(m => m.lessons)

export function getPCELessonBySlug(slug: string): LessonMeta | undefined {
  return ALL_PCE_LESSONS.find(l => l.slug === slug)
}

export function getAdjacentPCELessons(slug: string): {
  prev: LessonMeta | null
  next: LessonMeta | null
} {
  const idx = ALL_PCE_LESSONS.findIndex(l => l.slug === slug)
  return {
    prev: idx > 0 ? ALL_PCE_LESSONS[idx - 1] : null,
    next: idx < ALL_PCE_LESSONS.length - 1 ? ALL_PCE_LESSONS[idx + 1] : null,
  }
}

export const PCE_ARTIFACT_PREVIEWS = [
  { label: "Atlas's system prompt", lesson: 3, icon: '◎' },
  { label: 'A calibrated few-shot set', lesson: 4, icon: '◈' },
  { label: 'An output schema + reasoning policy', lesson: 5, icon: '⬡' },
  { label: 'A context-assembly blueprint', lesson: 6, icon: '◉' },
  { label: 'A failure-mode + injection defense checklist', lesson: 9, icon: '◇' },
]
