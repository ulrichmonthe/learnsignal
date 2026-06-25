// Evals Foundations course — complete content for all 10 lessons
// Used by the course route system to render lesson pages.
// Body content lives here (not in DB) for Phase A.

export interface LessonMeta {
  slug: string
  title: string
  headline: string
  tags: string
  estimatedMinutes: number
  lessonNumber: number
  moduleSlug: string
  moduleTitle: string
  ctaText: string
  ctaHref: string
}

export interface Module {
  slug: string
  title: string
  lessons: LessonMeta[]
}

export interface Course {
  slug: string
  title: string
  description: string
  estimatedMinutes: number
  modules: Module[]
}

export const EVALS_COURSE: Course = {
  slug: 'evals-foundations',
  title: 'Evals: From Vibe Checks to Production Quality',
  description:
    'A 10-lesson course on AI evaluation for product managers. Learn to go from gut-check testing to a full production eval system — using a real support triage agent as the test bed.',
  estimatedMinutes: 210,
  modules: [
    {
      slug: 'foundations',
      title: 'Foundations',
      lessons: [
        {
          slug: 'lesson-1',
          title: 'Your AI shipped. Now what?',
          headline: "Your AI shipped. Now how do you know if it's actually working?",
          tags: 'AI EVALS · LESSON 1 · 8 MIN READ',
          estimatedMinutes: 8,
          lessonNumber: 1,
          moduleSlug: 'foundations',
          moduleTitle: 'Foundations',
          ctaText: 'RUN A VIBE CHECK →',
          ctaHref: '/playground/eval-lab/vibe-check',
        },
        {
          slug: 'lesson-2',
          title: 'Why your QA instincts will fail you',
          headline: 'The first thing AI breaks is your definition of "working."',
          tags: 'AI EVALS · LESSON 2 · 10 MIN READ',
          estimatedMinutes: 10,
          lessonNumber: 2,
          moduleSlug: 'foundations',
          moduleTitle: 'Foundations',
          ctaText: 'TRY THE LABELING EXERCISE →',
          ctaHref: '#exercise',
        },
      ],
    },
    {
      slug: 'vibe-checks',
      title: 'Vibe Checks',
      lessons: [
        {
          slug: 'lesson-3',
          title: 'Generating diverse test inputs',
          headline: 'Your eval set is only as honest as the inputs you put into it.',
          tags: 'AI EVALS · LESSON 3 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 3,
          moduleSlug: 'vibe-checks',
          moduleTitle: 'Vibe Checks',
          ctaText: 'GENERATE TEST INPUTS →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-4',
          title: 'Labeling outputs and writing your first rubric',
          headline: "Your rubric isn't a document you write. It's a pattern you discover.",
          tags: 'AI EVALS · LESSON 4 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 4,
          moduleSlug: 'vibe-checks',
          moduleTitle: 'Vibe Checks',
          ctaText: 'LABEL 20 OUTPUTS →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-5',
          title: 'Finding failure patterns',
          headline: 'Three of the same failure is a pattern. One is just a Tuesday.',
          tags: 'AI EVALS · LESSON 5 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 5,
          moduleSlug: 'vibe-checks',
          moduleTitle: 'Vibe Checks',
          ctaText: 'FIND THE PATTERNS →',
          ctaHref: '#exercise',
        },
      ],
    },
    {
      slug: 'automated-evals',
      title: 'Automated Evals',
      lessons: [
        {
          slug: 'lesson-6',
          title: 'From rubric to deterministic checks',
          headline: "Half your rubric doesn't need AI to check it. Don't pay for what code can do.",
          tags: 'AI EVALS · LESSON 6 · 15 MIN READ',
          estimatedMinutes: 15,
          lessonNumber: 6,
          moduleSlug: 'automated-evals',
          moduleTitle: 'Automated Evals',
          ctaText: 'ARCHITECT YOUR EVALUATOR →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-7',
          title: 'LLM-as-judge done right',
          headline:
            'An uncalibrated LLM judge is worse than no judge at all. It gives you false confidence.',
          tags: 'AI EVALS · LESSON 7 · 25 MIN READ',
          estimatedMinutes: 25,
          lessonNumber: 7,
          moduleSlug: 'automated-evals',
          moduleTitle: 'Automated Evals',
          ctaText: 'BUILD A CALIBRATED JUDGE →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-8',
          title: 'Pairwise vs absolute scoring',
          headline:
            "When you can't tell if something's a 3 or a 4, ask which of two outputs is better instead.",
          tags: 'AI EVALS · LESSON 8 · 10 MIN READ',
          estimatedMinutes: 10,
          lessonNumber: 8,
          moduleSlug: 'automated-evals',
          moduleTitle: 'Automated Evals',
          ctaText: 'COMPARE 10 PAIRS →',
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
          title: 'Online monitoring and drift detection',
          headline:
            "Your eval set is a snapshot of what you know. Your users do things you didn't anticipate.",
          tags: 'AI EVALS · LESSON 9 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 9,
          moduleSlug: 'production',
          moduleTitle: 'Production',
          ctaText: 'BUILD A MONITORING PLAN →',
          ctaHref: '#exercise',
        },
        {
          slug: 'lesson-10',
          title: 'Tracing failures to root cause',
          headline:
            "AI failures are rarely just \"the model was wrong.\" They're chains where one bad decision cascades.",
          tags: 'AI EVALS · LESSON 10 · 20 MIN READ',
          estimatedMinutes: 20,
          lessonNumber: 10,
          moduleSlug: 'production',
          moduleTitle: 'Production',
          ctaText: 'TRACE THREE FAILURES →',
          ctaHref: '#exercise',
        },
      ],
    },
  ],
}

// Flat list of all lessons in order
export const ALL_LESSONS: LessonMeta[] = EVALS_COURSE.modules.flatMap(m => m.lessons)

export function getLessonBySlug(slug: string): LessonMeta | undefined {
  return ALL_LESSONS.find(l => l.slug === slug)
}

export function getAdjacentLessons(slug: string): {
  prev: LessonMeta | null
  next: LessonMeta | null
} {
  const idx = ALL_LESSONS.findIndex(l => l.slug === slug)
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : null,
    next: idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null,
  }
}
