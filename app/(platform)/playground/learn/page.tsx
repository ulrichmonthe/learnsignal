'use client'

import Link from 'next/link'
import { EVALS_COURSE } from '@/lib/courses/evals-foundations'
import { PROMPT_CONTEXT_COURSE } from '@/lib/courses/prompt-context-engineering'
import { HARNESS_COURSE } from '@/lib/courses/harness-engineering'
import { RAG_COURSE } from '@/lib/courses/rag'

const COURSES = [
  {
    course: EVALS_COURSE,
    href: '/playground/learn/evals-foundations',
    cta: 'START COURSE',
  },
  {
    course: PROMPT_CONTEXT_COURSE,
    href: '/playground/learn/prompt-context-engineering',
    cta: 'START COURSE',
  },
  {
    course: HARNESS_COURSE,
    href: '/playground/learn/harness-engineering',
    cta: 'START COURSE',
  },
  {
    course: RAG_COURSE,
    href: '/playground/learn/rag',
    cta: 'START COURSE',
  },
]

export default function LearnPage() {

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[680px] mx-auto px-6 pt-14 pb-24">

        {/* Eyebrow */}
        <p
          className="font-mono uppercase mb-8"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
        >
          The Signal · Courses
        </p>

        {/* Headline */}
        <h1
          className="font-display font-medium text-text leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontStyle: 'italic' }}
        >
          Courses for AI PMs
        </h1>

        <p
          className="mb-14"
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.65',
            fontFamily: 'var(--font-dm-sans)',
            maxWidth: '520px',
          }}
        >
          Learn the disciplines that separate AI PMs who ship from AI PMs who guess.
          Grounded in real examples. Built for practitioners, not students.
        </p>

        {/* Course cards */}
        <div className="space-y-4">
          {COURSES.map(({ course, href, cta }) => {
            const lessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
            const hours = Math.round((course.estimatedMinutes / 60) * 10) / 10
            return (
              <Link
                key={course.slug}
                href={href}
                className="block group"
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="rounded-lg p-6 transition-all"
                  style={{
                    border: '0.5px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.22)'
                    ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'
                    ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
                  }}
                >
                  {/* Meta */}
                  <p
                    className="font-mono uppercase mb-3"
                    style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
                  >
                    Course · {lessons} Lessons · {hours} Hours
                  </p>

                  {/* Title */}
                  <h2
                    className="font-display font-medium text-text mb-3"
                    style={{ fontSize: '22px', fontStyle: 'italic', lineHeight: '1.3' }}
                  >
                    {course.title}
                  </h2>

                  {/* Description */}
                  <p
                    className="mb-5"
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.55)',
                      lineHeight: '1.65',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {course.description}
                  </p>

                  {/* Module chips */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {course.modules.map(module => (
                      <span
                        key={module.slug}
                        className="font-mono"
                        style={{
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          color: 'rgba(255,255,255,0.4)',
                          background: 'rgba(255,255,255,0.05)',
                          padding: '3px 8px',
                          border: '0.5px solid rgba(255,255,255,0.08)',
                          borderRadius: '4px',
                        }}
                      >
                        {module.title}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-medium"
                      style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--accent)' }}
                    >
                      → {cta}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
