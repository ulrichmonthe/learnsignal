'use client'

import Link from 'next/link'
import { useCourseProgress, CourseCTA, LessonNumber } from '@/components/courses/course-progress'
import { PROMPT_CONTEXT_COURSE, PCE_ARTIFACT_PREVIEWS } from '@/lib/courses/prompt-context-engineering'

export default function PromptContextEngineeringPage() {
  const totalLessons = PROMPT_CONTEXT_COURSE.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedSlugs = useCourseProgress('prompt-context-engineering')
  const orderedSlugs = PROMPT_CONTEXT_COURSE.modules.flatMap(m => m.lessons.map(l => l.slug))

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[780px] mx-auto px-6 pt-14 pb-24">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/playground/learn"
            className="font-mono hover:opacity-70 transition-opacity"
            style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}
          >
            Courses
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>›</span>
          <span
            className="font-mono"
            style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em' }}
          >
            Prompt &amp; Context Engineering
          </span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <p
            className="font-mono uppercase mb-3"
            style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
          >
            Course · {totalLessons} Lessons · {PROMPT_CONTEXT_COURSE.estimatedMinutes} Minutes
          </p>
          <h1
            className="font-display font-medium text-text leading-tight mb-4"
            style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontStyle: 'italic' }}
          >
            {PROMPT_CONTEXT_COURSE.title}
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.65',
              fontFamily: 'var(--font-dm-sans)',
              maxWidth: '560px',
            }}
          >
            {PROMPT_CONTEXT_COURSE.description}
          </p>

          <div className="mt-6">
            <CourseCTA hrefBase="/playground/learn/prompt-context-engineering" orderedSlugs={orderedSlugs} completedSlugs={completedSlugs} />
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-10">
          {PROMPT_CONTEXT_COURSE.modules.map((module, mIdx) => (
            <div key={module.slug}>
              {/* Module header */}
              <div className="flex items-center gap-4 mb-4">
                <p
                  className="font-mono uppercase"
                  style={{ fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)' }}
                >
                  Module {mIdx + 1}
                </p>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
                <p
                  className="font-mono uppercase"
                  style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'var(--accent)' }}
                >
                  {module.title}
                </p>
              </div>

              {/* Lesson list */}
              <div className="space-y-2">
                {module.lessons.map(lesson => (
                  <Link
                    key={lesson.slug}
                    href={`/playground/learn/prompt-context-engineering/${lesson.slug}`}
                    className="flex items-center gap-4 group transition-all rounded-lg"
                    style={{
                      padding: '14px 16px',
                      border: '0.5px solid rgba(255,255,255,0.08)',
                      background: 'transparent',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.16)'
                      ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)'
                      ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    }}
                  >
                    {/* Lesson number */}
                    <LessonNumber number={lesson.lessonNumber} done={completedSlugs.includes(lesson.slug)} />

                    {/* Lesson title + dek */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          color: 'rgba(255,255,255,0.75)',
                          lineHeight: '1.4',
                          marginBottom: '2px',
                        }}
                      >
                        {lesson.title}
                      </p>
                      <p
                        className="font-display"
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.3)',
                          fontStyle: 'italic',
                          lineHeight: '1.4',
                        }}
                      >
                        {lesson.headline}
                      </p>
                    </div>

                    {/* Time + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className="font-mono"
                        style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}
                      >
                        {lesson.estimatedMinutes} min
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* What you'll build */}
        <div
          className="mt-14 rounded-lg p-6"
          style={{
            border: '0.5px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <p
            className="font-mono uppercase mb-4"
            style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
          >
            What you&apos;ll build
          </p>
          <p
            className="mb-4"
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: '1.65',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Ten lessons. Five artifacts. One production-grade context system for an AI product.
          </p>
          <div className="space-y-2">
            {PCE_ARTIFACT_PREVIEWS.map((artifact, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="font-mono"
                  style={{ fontSize: '10px', color: 'var(--accent)', opacity: 0.6 }}
                >
                  {i + 1}.
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.55)',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {artifact.label}
                </span>
                <span
                  className="font-mono ml-auto"
                  style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}
                >
                  Lesson {artifact.lesson}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PCE Lab CTA */}
        <div
          className="mt-10 rounded-lg p-5"
          style={{ background: 'rgba(200,240,64,0.04)', border: '0.5px solid rgba(200,240,64,0.15)' }}
        >
          <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--accent)' }}>
            Practice environment
          </p>
          <h3
            className="font-display font-medium mb-2"
            style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}
          >
            Build Atlas in the PCE Lab
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm-sans)', lineHeight: '1.6', marginBottom: '14px' }}>
            Put every concept from this course into practice across 10 graded missions.
            Fix a broken prompt, tune context assembly, and hit your Signal Score target — all in a real-time three-panel environment.
          </p>
          <Link
            href="/playground/pce-lab"
            className="inline-block font-mono rounded px-4 py-2 transition-opacity hover:opacity-80"
            style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'black',
              background: 'var(--accent)',
            }}
          >
            OPEN PCE LAB →
          </Link>
        </div>

      </div>
    </div>
  )
}
