import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getLessonBySlug,
  getAdjacentLessons,
  EVALS_COURSE,
  ALL_LESSONS,
} from '@/lib/courses/evals-foundations'
import ModuleNav from '@/components/courses/module-nav'
import ArtifactPanel from '@/components/courses/artifact-panel'
import { getCourseProgress } from '@/lib/learn/progress'
import { LessonComplete } from '@/components/courses/lesson-complete'
import {
  Lesson2Body,
  Lesson3Body,
  Lesson4Body,
  Lesson5Body,
  Lesson6Body,
  Lesson7Body,
  Lesson8Body,
  Lesson9Body,
  Lesson10Body,
} from '@/components/courses/lesson-bodies'

// Redirect lesson 1 to the existing concept page content,
// rendered inline here for URL consistency.
import Lesson1Body from '@/components/courses/lesson-1-body'

interface PageProps {
  params: Promise<{ lesson: string }>
}

const LESSON_BODIES: Record<string, React.ComponentType> = {
  'lesson-1': Lesson1Body,
  'lesson-2': Lesson2Body,
  'lesson-3': Lesson3Body,
  'lesson-4': Lesson4Body,
  'lesson-5': Lesson5Body,
  'lesson-6': Lesson6Body,
  'lesson-7': Lesson7Body,
  'lesson-8': Lesson8Body,
  'lesson-9': Lesson9Body,
  'lesson-10': Lesson10Body,
}

export default async function LessonPage({ params }: PageProps) {
  const { lesson: lessonSlug } = await params
  const lesson = getLessonBySlug(lessonSlug)

  if (!lesson) notFound()

  const { prev, next } = getAdjacentLessons(lessonSlug)
  const LessonBody = LESSON_BODIES[lessonSlug]

  if (!LessonBody) notFound()

  const progress = await getCourseProgress('evals-foundations')
  const totalLessons = ALL_LESSONS.length

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="flex max-w-[1200px] mx-auto px-4 pt-10 pb-24 gap-0">

        {/* ── Left sidebar: module nav ─────────────────────────── */}
        <aside
          className="hidden lg:block flex-shrink-0 pr-8 pt-2"
          style={{ width: '220px' }}
        >
          <ModuleNav
            course={EVALS_COURSE}
            courseSlug="evals-foundations"
            backLabel="Evals Foundations"
            currentSlug={lessonSlug}
            completedSlugs={progress.completedSlugs}
          />
        </aside>

        {/* ── Centre: lesson content ───────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, maxWidth: '680px' }}>

          {/* Mobile nav — back link only */}
          <div className="lg:hidden mb-6">
            <Link
              href="/playground/learn/evals-foundations"
              className="font-mono hover:opacity-70 transition-opacity"
              style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--accent)' }}
            >
              ← All lessons
            </Link>
          </div>

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="font-mono uppercase"
              style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
            >
              {lesson.moduleTitle}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>·</span>
            <span
              className="font-mono"
              style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)' }}
            >
              Lesson {lesson.lessonNumber}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>·</span>
            <span
              className="font-mono"
              style={{ fontSize: '10px', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)' }}
            >
              {lesson.estimatedMinutes} min read
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-medium text-text leading-tight mb-10"
            style={{ fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: '1.2', fontStyle: 'italic' }}
          >
            {lesson.headline}
          </h1>

          {/* Lesson body */}
          <LessonBody />

          {/* Mark complete + continue */}
          <LessonComplete
            courseSlug="evals-foundations"
            lessonSlug={lessonSlug}
            total={totalLessons}
            nextHref={next ? `/playground/learn/evals-foundations/${next.slug}` : null}
            initiallyComplete={progress.completedSlugs.includes(lessonSlug)}
          />

          {/* ── Bottom navigation ──────────────────────────────── */}
          <div
            className="mt-14 pt-8 flex items-center justify-between"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            {prev ? (
              <Link
                href={`/playground/learn/evals-foundations/${prev.slug}`}
                className="group"
                style={{ textDecoration: 'none' }}
              >
                <p
                  className="font-mono uppercase mb-1"
                  style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}
                >
                  ← Previous
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.55)',
                    maxWidth: '200px',
                    lineHeight: '1.4',
                  }}
                >
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/playground/learn/evals-foundations/${next.slug}`}
                className="text-right"
                style={{ textDecoration: 'none' }}
              >
                <p
                  className="font-mono uppercase mb-1"
                  style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'var(--accent)' }}
                >
                  Next →
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.7)',
                    maxWidth: '200px',
                    lineHeight: '1.4',
                    textAlign: 'right',
                  }}
                >
                  {next.title}
                </p>
              </Link>
            ) : (
              /* Course complete state */
              <Link
                href="/playground/learn/evals-foundations"
                className="text-right"
                style={{ textDecoration: 'none' }}
              >
                <p
                  className="font-mono uppercase mb-1"
                  style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'var(--accent)' }}
                >
                  Course complete ✓
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.55)',
                    textAlign: 'right',
                  }}
                >
                  Back to course overview
                </p>
              </Link>
            )}
          </div>
        </main>

        {/* ── Right sidebar: artifact panel ───────────────────── */}
        <aside
          className="hidden xl:block flex-shrink-0 pl-10 pt-2"
          style={{ width: '240px' }}
        >
          <ArtifactPanel artifacts={[]} />
        </aside>
      </div>
    </div>
  )
}

// Static generation for all known lesson slugs
export async function generateStaticParams() {
  return EVALS_COURSE.modules
    .flatMap(m => m.lessons)
    .map(lesson => ({ lesson: lesson.slug }))
}
