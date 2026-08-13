// Agent Orchestration — course metadata for all 11 lessons (Track 02).
// Body content lives in components/courses/agent-orchestration/m{1..5}.tsx.

import type { Course, LessonMeta } from './evals-foundations'

export const AGENT_ORCHESTRATION_COURSE: Course = {
  slug: 'agent-orchestration',
  title: 'Agent Orchestration',
  description:
    'You are not choosing a framework. You are choosing a failure mode and a cost curve. For the PM shipping a system where a model calls tools and takes multi-step action — how to interrogate an architecture, cost it, predict how it breaks, and decide how much autonomy it gets. Those skills survive the framework churn. Syntax does not.',
  estimatedMinutes: 169,
  modules: [
    {
      slug: 'the-decision',
      title: 'The Orchestration Decision',
      lessons: [
        {
          slug: 'lesson-1',
          title: 'What orchestration actually is.',
          headline: 'Orchestration is three decisions: which model call happens next, with what context, and what happens when it fails.',
          tags: 'AGENT ORCHESTRATION · LESSON 1 · 12 MIN READ',
          estimatedMinutes: 12,
          lessonNumber: 1,
          moduleSlug: 'the-decision',
          moduleTitle: 'The Orchestration Decision',
          ctaText: 'READ LESSON 2 →',
          ctaHref: '/playground/learn/agent-orchestration/lesson-2',
        },
        {
          slug: 'lesson-2',
          title: 'Do you actually need multi-agent?',
          headline: 'Most teams that need multi-agent need one agent with better tools.',
          tags: 'AGENT ORCHESTRATION · LESSON 2 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 2,
          moduleSlug: 'the-decision',
          moduleTitle: 'The Orchestration Decision',
          ctaText: 'READ LESSON 3 →',
          ctaHref: '/playground/learn/agent-orchestration/lesson-3',
        },
      ],
    },
    {
      slug: 'five-patterns',
      title: 'The Five Patterns',
      lessons: [
        {
          slug: 'lesson-3',
          title: 'Fan-out and pipeline: the two you build first.',
          headline: 'The topology sets the cost curve — not the model choice.',
          tags: 'AGENT ORCHESTRATION · LESSON 3 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 3,
          moduleSlug: 'five-patterns',
          moduleTitle: 'The Five Patterns',
          ctaText: 'READ LESSON 4 →',
          ctaHref: '/playground/learn/agent-orchestration/lesson-4',
        },
        {
          slug: 'lesson-4',
          title: 'Debate, supervisor, swarm — and what composition costs.',
          headline: 'Composed systems inherit every failure mode of their parts, and add one: nobody owns the end-to-end number.',
          tags: 'AGENT ORCHESTRATION · LESSON 4 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 4,
          moduleSlug: 'five-patterns',
          moduleTitle: 'The Five Patterns',
          ctaText: 'READ LESSON 5 →',
          ctaHref: '/playground/learn/agent-orchestration/lesson-5',
        },
      ],
    },
    {
      slug: 'the-numbers',
      title: 'The Numbers That Lie',
      lessons: [
        {
          slug: 'lesson-5',
          title: 'Reliability: how chains lie to you.',
          headline: 'Five stages at 95% is a 77% system. End-to-end accuracy is the product, not the average.',
          tags: 'AGENT ORCHESTRATION · LESSON 5 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 5,
          moduleSlug: 'the-numbers',
          moduleTitle: 'The Numbers That Lie',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-6',
          title: 'Economics: cost per completed task.',
          headline: "Cost per token is the vendor's unit. Cost per completed task is yours.",
          tags: 'AGENT ORCHESTRATION · LESSON 6 · 18 MIN READ',
          estimatedMinutes: 18,
          lessonNumber: 6,
          moduleSlug: 'the-numbers',
          moduleTitle: 'The Numbers That Lie',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
      ],
    },
    {
      slug: 'operating',
      title: 'Operating in Production',
      lessons: [
        {
          slug: 'lesson-7',
          title: 'State, checkpoints and frameworks.',
          headline: 'You are not choosing a framework. You are choosing how much of your state it owns.',
          tags: 'AGENT ORCHESTRATION · LESSON 7 · 16 MIN READ',
          estimatedMinutes: 16,
          lessonNumber: 7,
          moduleSlug: 'operating',
          moduleTitle: 'Operating in Production',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-8',
          title: 'Independence and observability.',
          headline: 'Same model plus same context equals one opinion, billed N times.',
          tags: 'AGENT ORCHESTRATION · LESSON 8 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 8,
          moduleSlug: 'operating',
          moduleTitle: 'Operating in Production',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-9',
          title: 'Autonomy and least agency.',
          headline: 'Reversibility justifies autonomy more than accuracy does.',
          tags: 'AGENT ORCHESTRATION · LESSON 9 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 9,
          moduleSlug: 'operating',
          moduleTitle: 'Operating in Production',
          ctaText: 'DO THE EXERCISE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-10',
          title: 'The security frame.',
          headline: 'Untrusted content reaching a node that can take an action is the dangerous shape.',
          tags: 'AGENT ORCHESTRATION · LESSON 10 · 12 MIN READ',
          estimatedMinutes: 12,
          lessonNumber: 10,
          moduleSlug: 'operating',
          moduleTitle: 'Operating in Production',
          ctaText: 'READ LESSON 11 →',
          ctaHref: '/playground/learn/agent-orchestration/lesson-11',
        },
      ],
    },
    {
      slug: 'the-review',
      title: 'The Review',
      lessons: [
        {
          slug: 'lesson-11',
          title: 'The orchestration review.',
          headline: 'Forty minutes to decide if an architecture survives production. Run the questions in the order the constraints bind.',
          tags: 'AGENT ORCHESTRATION · LESSON 11 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 11,
          moduleSlug: 'the-review',
          moduleTitle: 'The Review',
          ctaText: 'BACK TO COURSE →',
          ctaHref: '/playground/learn/agent-orchestration',
        },
      ],
    },
  ],
}

export const ALL_AO_LESSONS: LessonMeta[] = AGENT_ORCHESTRATION_COURSE.modules.flatMap(m => m.lessons)

export function getAOLessonBySlug(slug: string): LessonMeta | undefined {
  return ALL_AO_LESSONS.find(l => l.slug === slug)
}

export function getAdjacentAOLessons(slug: string): {
  prev: LessonMeta | null
  next: LessonMeta | null
} {
  const i = ALL_AO_LESSONS.findIndex(l => l.slug === slug)
  return {
    prev: i > 0 ? ALL_AO_LESSONS[i - 1] : null,
    next: i >= 0 && i < ALL_AO_LESSONS.length - 1 ? ALL_AO_LESSONS[i + 1] : null,
  }
}

export const AO_ARTIFACT_PREVIEWS = [
  { label: 'The decomposition memo', lesson: 2 },
  { label: 'Your topology, named', lesson: 4 },
  { label: 'The error-budget table', lesson: 5 },
  { label: 'Your cost model', lesson: 6 },
  { label: 'The state boundary memo', lesson: 7 },
  { label: 'The autonomy grant', lesson: 9 },
  { label: 'The ASI exposure map', lesson: 10 },
  { label: 'The orchestration review', lesson: 11 },
]
