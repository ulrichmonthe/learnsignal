// Harness Engineering — course metadata for all 10 lessons.
// Body content lives in components/courses/harness-engineering-bodies.tsx.

import type { Course, LessonMeta } from './evals-foundations'

export const HARNESS_COURSE: Course = {
  slug: 'harness-engineering',
  title: 'Harness Engineering',
  description:
    'The third layer of building with AI. Prompts tell the model what to do. Context tells it what it knows. The harness decides how the whole system actually runs — and it\'s the layer that turns a 92%-reliable demo into a product you can ship. Built around a real autonomous coding agent, Forge, as the test bed from lesson one to lesson ten.',
  estimatedMinutes: 172,
  modules: [
    {
      slug: 'the-third-layer',
      title: 'The Third Layer',
      lessons: [
        {
          slug: 'lesson-1',
          title: 'Prompt, context, harness: the three layers.',
          headline: 'When the agent fails, the bug is usually one layer below where you\'re looking.',
          tags: 'HARNESS ENGINEERING · LESSON 1 · 10 MIN READ',
          estimatedMinutes: 10,
          lessonNumber: 1,
          moduleSlug: 'the-third-layer',
          moduleTitle: 'The Third Layer',
          ctaText: 'READ LESSON 2 →',
          ctaHref: '/playground/learn/harness-engineering/lesson-2',
        },
        {
          slug: 'lesson-2',
          title: 'Probabilistic vs deterministic.',
          headline: 'You can prompt your way from 60% to 99%. You cannot prompt your way to 100%.',
          tags: 'HARNESS ENGINEERING · LESSON 2 · 14 MIN READ',
          estimatedMinutes: 14,
          lessonNumber: 2,
          moduleSlug: 'the-third-layer',
          moduleTitle: 'The Third Layer',
          ctaText: 'READ LESSON 3 →',
          ctaHref: '/playground/learn/harness-engineering/lesson-3',
        },
      ],
    },
    {
      slug: 'deterministic-guardrails',
      title: 'Deterministic Guardrails',
      lessons: [
        {
          slug: 'lesson-3',
          title: 'Rules files done right: AGENTS.md and the over-specification trap.',
          headline: 'A longer rules file is not a more obedient agent. It\'s usually a worse one.',
          tags: 'HARNESS ENGINEERING · LESSON 3 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 3,
          moduleSlug: 'deterministic-guardrails',
          moduleTitle: 'Deterministic Guardrails',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-4',
          title: 'Hooks and gates: the permission system for agents.',
          headline: 'You wouldn\'t stop a dropped table with a comment that says please don\'t.',
          tags: 'HARNESS ENGINEERING · LESSON 4 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 4,
          moduleSlug: 'deterministic-guardrails',
          moduleTitle: 'Deterministic Guardrails',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-5',
          title: 'Verification loops: Plan-Execute-Verify.',
          headline: 'If your verifier thinks like your planner, it will bless the same mistake.',
          tags: 'HARNESS ENGINEERING · LESSON 5 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 5,
          moduleSlug: 'deterministic-guardrails',
          moduleTitle: 'Deterministic Guardrails',
          ctaText: 'READ LESSON 6 →',
          ctaHref: '/playground/learn/harness-engineering/lesson-6',
        },
      ],
    },
    {
      slug: 'managing-the-run',
      title: 'Managing the Run',
      lessons: [
        {
          slug: 'lesson-6',
          title: 'Sub-agents as task isolation.',
          headline: 'Spin up a sub-agent when the work is noisy, bounded, and easy to summarize.',
          tags: 'HARNESS ENGINEERING · LESSON 6 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 6,
          moduleSlug: 'managing-the-run',
          moduleTitle: 'Managing the Run',
          ctaText: 'READ LESSON 7 →',
          ctaHref: '/playground/learn/harness-engineering/lesson-7',
        },
        {
          slug: 'lesson-7',
          title: 'Context garbage collection: compaction, clearing, memory.',
          headline: 'Compact at the task boundary, not when the window is already full.',
          tags: 'HARNESS ENGINEERING · LESSON 7 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 7,
          moduleSlug: 'managing-the-run',
          moduleTitle: 'Managing the Run',
          ctaText: 'READ LESSON 8 →',
          ctaHref: '/playground/learn/harness-engineering/lesson-8',
        },
      ],
    },
    {
      slug: 'the-architectural-decision',
      title: 'The Architectural Decision',
      lessons: [
        {
          slug: 'lesson-8',
          title: 'Which layer do you fix? The diagnostic flowchart.',
          headline: 'Tighten the prompt, edit the rules file, or add a CI gate? The answer is the whole lesson.',
          tags: 'HARNESS ENGINEERING · LESSON 8 · 22 MIN READ',
          estimatedMinutes: 22,
          lessonNumber: 8,
          moduleSlug: 'the-architectural-decision',
          moduleTitle: 'The Architectural Decision',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-9',
          title: 'The economics of the harness.',
          headline: 'Deterministic checks are nearly free. LLM judgment is on the meter. Spend accordingly.',
          tags: 'HARNESS ENGINEERING · LESSON 9 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 9,
          moduleSlug: 'the-architectural-decision',
          moduleTitle: 'The Architectural Decision',
          ctaText: 'READ LESSON 10 →',
          ctaHref: '/playground/learn/harness-engineering/lesson-10',
        },
        {
          slug: 'lesson-10',
          title: 'The shrinking harness.',
          headline: 'The best harness is the one you\'ll be able to delete in a year.',
          tags: 'HARNESS ENGINEERING · LESSON 10 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 10,
          moduleSlug: 'the-architectural-decision',
          moduleTitle: 'The Architectural Decision',
          ctaText: 'BACK TO COURSE OVERVIEW →',
          ctaHref: '/playground/learn/harness-engineering',
        },
      ],
    },
  ],
}

export const ALL_HE_LESSONS: LessonMeta[] = HARNESS_COURSE.modules.flatMap(m => m.lessons)

export function getHELessonBySlug(slug: string): LessonMeta | undefined {
  return ALL_HE_LESSONS.find(l => l.slug === slug)
}

export function getAdjacentHELessons(slug: string): {
  prev: LessonMeta | null
  next: LessonMeta | null
} {
  const idx = ALL_HE_LESSONS.findIndex(l => l.slug === slug)
  return {
    prev: idx > 0 ? ALL_HE_LESSONS[idx - 1] : null,
    next: idx < ALL_HE_LESSONS.length - 1 ? ALL_HE_LESSONS[idx + 1] : null,
  }
}

export const HE_ARTIFACT_PREVIEWS = [
  { label: "Forge's AGENTS.md", lesson: 3, icon: '◎' },
  { label: 'A hook architecture table', lesson: 4, icon: '◈' },
  { label: 'A Plan-Execute-Verify loop spec', lesson: 5, icon: '⬡' },
  { label: 'A context garbage-collection policy', lesson: 7, icon: '◉' },
  { label: 'A layer-diagnosis flowchart', lesson: 8, icon: '◇' },
]
