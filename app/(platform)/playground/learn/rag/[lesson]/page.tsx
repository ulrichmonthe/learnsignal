import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getRAGLessonBySlug,
  getAdjacentRAGLessons,
  RAG_COURSE,
  RAG_ARTIFACT_PREVIEWS,
  ALL_RAG_LESSONS,
} from '@/lib/courses/rag'
import ModuleNav from '@/components/courses/module-nav'
import ArtifactPanel from '@/components/courses/artifact-panel'
import { getCourseProgress } from '@/lib/learn/progress'
import { LessonComplete } from '@/components/courses/lesson-complete'
import {
  RAGLesson1Body,
  RAGLesson2Body,
  RAGLesson3Body,
  RAGLesson4Body,
  RAGLesson5Body,
  RAGLesson6Body,
  RAGLesson7Body,
  RAGLesson8Body,
  RAGLesson9Body,
  RAGLesson10Body,
  RAGLesson11Body,
  RAGLesson12Body,
  RAGLesson13Body,
  RAGLesson14Body,
  RAGLesson15Body,
  RAGLesson16Body,
} from '@/components/courses/rag-bodies'

interface PageProps {
  params: Promise<{ lesson: string }>
}

const LESSON_BODIES: Record<string, React.ComponentType> = {
  'lesson-1': RAGLesson1Body,
  'lesson-2': RAGLesson2Body,
  'lesson-3': RAGLesson3Body,
  'lesson-4': RAGLesson4Body,
  'lesson-5': RAGLesson5Body,
  'lesson-6': RAGLesson6Body,
  'lesson-7': RAGLesson7Body,
  'lesson-8': RAGLesson8Body,
  'lesson-9': RAGLesson9Body,
  'lesson-10': RAGLesson10Body,
  'lesson-11': RAGLesson11Body,
  'lesson-12': RAGLesson12Body,
  'lesson-13': RAGLesson13Body,
  'lesson-14': RAGLesson14Body,
  'lesson-15': RAGLesson15Body,
  'lesson-16': RAGLesson16Body,
}

export default async function RAGLessonPage({ params }: PageProps) {
  const { lesson: lessonSlug } = await params
  const lesson = getRAGLessonBySlug(lessonSlug)

  if (!lesson) notFound()

  const { prev, next } = getAdjacentRAGLessons(lessonSlug)
  const LessonBody = LESSON_BODIES[lessonSlug]

  if (!LessonBody) notFound()

  const progress = await getCourseProgress('rag')
  const totalLessons = ALL_RAG_LESSONS.length

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="flex max-w-[1200px] mx-auto px-4 pt-10 pb-24 gap-0">

        {/* ── Left sidebar: module nav ──────────────────────────── */}
        <aside
          className="hidden lg:block flex-shrink-0 pr-8 pt-2"
          style={{ width: '220px' }}
        >
          <ModuleNav
            course={RAG_COURSE}
            courseSlug="rag"
            backLabel="RAG Course"
            currentSlug={lessonSlug}
            completedSlugs={progress.completedSlugs}
          />
        </aside>

        {/* ── Centre: lesson content ────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, maxWidth: '680px' }}>

          {/* Mobile back link */}
          <div className="lg:hidden mb-6">
            <Link
              href="/playground/learn/rag"
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
            courseSlug="rag"
            lessonSlug={lessonSlug}
            total={totalLessons}
            nextHref={next ? `/playground/learn/rag/${next.slug}` : null}
            initiallyComplete={progress.completedSlugs.includes(lessonSlug)}
          />

          {/* ── Bottom navigation ───────────────────────────────── */}
          <div
            className="mt-14 pt-8 flex items-center justify-between"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            {prev ? (
              <Link
                href={`/playground/learn/rag/${prev.slug}`}
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
                href={`/playground/learn/rag/${next.slug}`}
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
                href="/playground/learn/rag"
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
          <ArtifactPanel artifacts={[]} previewArtifacts={RAG_ARTIFACT_PREVIEWS} />
        </aside>
      </div>
    </div>
  )
}

// Static generation for all known lesson slugs
export async function generateStaticParams() {
  return RAG_COURSE.modules
    .flatMap(m => m.lessons)
    .map(lesson => ({ lesson: lesson.slug }))
}
