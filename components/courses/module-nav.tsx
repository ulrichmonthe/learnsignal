'use client'

import Link from 'next/link'
import type { Course } from '@/lib/courses/evals-foundations'

interface ModuleNavProps {
  course: Course
  courseSlug: string
  backLabel: string
  currentSlug: string
  completedSlugs: string[]
}

export default function ModuleNav({
  course,
  courseSlug,
  backLabel,
  currentSlug,
  completedSlugs,
}: ModuleNavProps) {
  const isCurrent = (slug: string) => slug === currentSlug
  const isCompleted = (slug: string) => completedSlugs.includes(slug)

  return (
    <nav className="w-full">
      <div className="mb-6">
        <Link
          href={`/playground/learn/${courseSlug}`}
          className="font-mono uppercase hover:opacity-70 transition-opacity"
          style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--accent)' }}
        >
          ← {backLabel}
        </Link>
      </div>

      <div className="space-y-6">
        {course.modules.map(module => (
          <div key={module.slug}>
            <p
              className="font-mono uppercase mb-3"
              style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.3)' }}
            >
              {module.title}
            </p>

            <div className="space-y-0.5">
              {module.lessons.map(lesson => {
                const current = isCurrent(lesson.slug)
                const completed = isCompleted(lesson.slug)

                return (
                  <Link
                    key={lesson.slug}
                    href={`/playground/learn/${courseSlug}/${lesson.slug}`}
                    className="flex items-center gap-3 py-2 px-2 rounded transition-colors"
                    style={{
                      background: current ? 'rgba(200,240,64,0.08)' : 'transparent',
                      borderLeft: current ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!current) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={e => {
                      if (!current) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{
                        background: completed
                          ? 'var(--accent)'
                          : current
                          ? 'rgba(200,240,64,0.6)'
                          : 'rgba(255,255,255,0.15)',
                      }}
                    />
                    <span
                      className="font-sans text-left leading-snug"
                      style={{
                        fontSize: '12px',
                        color: current
                          ? 'rgba(255,255,255,0.9)'
                          : completed
                          ? 'rgba(255,255,255,0.65)'
                          : 'rgba(255,255,255,0.45)',
                        lineHeight: '1.4',
                      }}
                    >
                      {lesson.title}
                    </span>
                    <span
                      className="font-mono ml-auto flex-shrink-0"
                      style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}
                    >
                      {lesson.estimatedMinutes}m
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
