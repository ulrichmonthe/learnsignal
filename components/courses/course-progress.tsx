'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Client-side course progress for the (client-component) course overview pages.
// Lesson pages read progress server-side; here we fetch it once on mount.

export function useCourseProgress(course: string): string[] {
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/learn/progress?course=${course}`, { signal: AbortSignal.timeout(5000) })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return
        const slugs = json?.data?.completedSlugs
        if (Array.isArray(slugs)) setCompleted(slugs.filter((s) => typeof s === 'string'))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [course])

  return completed
}

export function CourseCTA({
  hrefBase,
  orderedSlugs,
  completedSlugs,
}: {
  hrefBase: string
  orderedSlugs: string[]
  completedSlugs: string[]
}) {
  const done = orderedSlugs.filter((s) => completedSlugs.includes(s)).length
  const total = orderedSlugs.length
  const nextSlug = orderedSlugs.find((s) => !completedSlugs.includes(s))

  if (done === 0) {
    return (
      <Link
        href={`${hrefBase}/${orderedSlugs[0]}`}
        className="inline-block font-mono font-medium text-black hover:opacity-90 transition-opacity"
        style={{
          fontSize: '12px',
          letterSpacing: '0.08em',
          background: 'var(--accent)',
          padding: '12px 22px',
          borderRadius: '8px',
        }}
      >
        START WITH LESSON 1 →
      </Link>
    )
  }

  return (
    <div style={{ maxWidth: '420px' }}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: '5px', background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(done / total) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
        <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          {done}/{total}
        </span>
      </div>
      {nextSlug ? (
        <Link
          href={`${hrefBase}/${nextSlug}`}
          className="inline-block font-mono font-medium text-black hover:opacity-90 transition-opacity"
          style={{
            fontSize: '12px',
            letterSpacing: '0.08em',
            background: 'var(--accent)',
            padding: '12px 22px',
            borderRadius: '8px',
          }}
        >
          RESUME · LESSON {orderedSlugs.indexOf(nextSlug) + 1} →
        </Link>
      ) : (
        <p className="font-mono" style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--accent)' }}>
          COURSE COMPLETE ✓
        </p>
      )}
    </div>
  )
}

export function LessonNumber({ number, done }: { number: number; done: boolean }) {
  return (
    <span
      className="font-mono flex-shrink-0"
      style={{
        fontSize: '11px',
        color: done ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
        width: '28px',
      }}
    >
      {done ? '✓' : String(number).padStart(2, '0')}
    </span>
  )
}
