import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getPCELessonBySlug,
  getAdjacentPCELessons,
  PROMPT_CONTEXT_COURSE,
  PCE_ARTIFACT_PREVIEWS,
  ALL_PCE_LESSONS,
} from '@/lib/courses/prompt-context-engineering'
import ModuleNav from '@/components/courses/module-nav'
import ArtifactPanel from '@/components/courses/artifact-panel'
import { getCourseProgress } from '@/lib/learn/progress'
import { LessonComplete } from '@/components/courses/lesson-complete'
import {
  PCELesson1Body,
  PCELesson2Body,
  PCELesson3Body,
  PCELesson4Body,
  PCELesson5Body,
  PCELesson6Body,
  PCELesson7Body,
  PCELesson8Body,
  PCELesson9Body,
  PCELesson10Body,
} from '@/components/courses/prompt-context-bodies'

interface PageProps {
  params: Promise<{ lesson: string }>
}

const LESSON_BODIES: Record<string, React.ComponentType> = {
  'lesson-1': PCELesson1Body,
  'lesson-2': PCELesson2Body,
  'lesson-3': PCELesson3Body,
  'lesson-4': PCELesson4Body,
  'lesson-5': PCELesson5Body,
  'lesson-6': PCELesson6Body,
  'lesson-7': PCELesson7Body,
  'lesson-8': PCELesson8Body,
  'lesson-9': PCELesson9Body,
  'lesson-10': PCELesson10Body,
}

export default async function PCELessonPage({ params }: PageProps) {
  const { lesson: lessonSlug } = await params
  const lesson = getPCELessonBySlug(lessonSlug)

  if (!lesson) notFound()

  const { prev, next } = getAdjacentPCELessons(lessonSlug)
  const LessonBody = LESSON_BODIES[lessonSlug]

  if (!LessonBody) notFound()

  const progress = await getCourseProgress('prompt-context-engineering')
  const totalLessons = ALL_PCE_LESSONS.length

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="flex max-w-[1200px] mx-auto px-4 pt-10 pb-24 gap-0">

        {/* ── Left sidebar: module nav ──────────────────────────── */}
        <aside
          className="hidden lg:block flex-shrink-0 pr-8 pt-2"
          style={{ width: '220px' }}
        >
          <ModuleNav
            course={PROMPT_CONTEXT_COURSE}
            courseSlug="prompt-context-engineering"
            backLabel="Prompt &amp; Context Eng."
            currentSlug={lessonSlug}
            completedSlugs={progress.completedSlugs}
          />
        </aside>

        {/* ── Centre: lesson content ────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, maxWidth: '680px' }}>

          {/* Mobile back link */}
          <div className="lg:hidden mb-6">
            <Link
              href="/playground/learn/prompt-context-engineering"
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
            courseSlug="prompt-context-engineering"
            lessonSlug={lessonSlug}
            total={totalLessons}
            nextHref={next ? `/playground/learn/prompt-context-engineering/${next.slug}` : null}
            initiallyComplete={progress.completedSlugs.includes(lessonSlug)}
          />

          {/* ── Bottom navigation ───────────────────────────────── */}
          <div
            className="mt-14 pt-8 flex items-center justify-between"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            {prev ? (
              <Link
                href={`/playground/learn/prompt-context-engineering/${prev.slug}`}
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
                href={`/playground/learn/prompt-context-engineering/${next.slug}`}
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
                href="/playground/learn/prompt-context-engineering"
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

        {/* ── Right sidebar: artifact panel ────────────────────── */}
        <aside
          className="hidden xl:block flex-shrink-0 pl-10 pt-2"
          style={{ width: '240px' }}
        >
          <ArtifactPanel artifacts={[]} previewArtifacts={PCE_ARTIFACT_PREVIEWS} />
        </aside>
      </div>
    </div>
  )
}

// Static generation for all known lesson slugs
export async function generateStaticParams() {
  return PROMPT_CONTEXT_COURSE.modules
    .flatMap(m => m.lessons)
    .map(lesson => ({ lesson: lesson.slug }))
}
