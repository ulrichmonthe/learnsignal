'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function LessonComplete({
  courseSlug,
  lessonSlug,
  total,
  nextHref,
  initiallyComplete,
}: {
  courseSlug: string
  lessonSlug: string
  total: number
  nextHref: string | null
  initiallyComplete: boolean
}) {
  const router = useRouter()
  const [done, setDone] = useState(initiallyComplete)
  const [saving, setSaving] = useState(false)

  async function markComplete() {
    if (done) return true
    setSaving(true)
    try {
      const res = await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course: courseSlug, lessonSlug, total }),
      })
      if (res.ok) setDone(true)
      return res.ok
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }

  async function completeAndContinue() {
    await markComplete()
    if (nextHref) router.push(nextHref)
  }

  return (
    <div
      className="mt-12 rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap"
      style={{
        border: `0.5px solid ${done ? 'rgba(200,240,64,0.3)' : 'rgba(255,255,255,0.12)'}`,
        background: done ? 'rgba(200,240,64,0.04)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            fontSize: 11,
            background: done ? 'var(--accent)' : 'transparent',
            border: done ? 'none' : '1px solid rgba(255,255,255,0.25)',
            color: done ? 'black' : 'rgba(255,255,255,0.4)',
          }}
        >
          {done ? '✓' : ''}
        </span>
        <p className="text-sm" style={{ color: done ? 'var(--accent)' : 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm-sans)' }}>
          {done ? 'Lesson complete' : 'Finished reading? Mark it complete.'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {!done && (
          <button
            onClick={markComplete}
            disabled={saving}
            className="font-mono transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}
          >
            {saving ? 'Saving…' : 'Mark complete'}
          </button>
        )}
        {nextHref ? (
          <button
            onClick={completeAndContinue}
            disabled={saving}
            className="font-mono font-medium rounded px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ fontSize: 11, letterSpacing: '0.08em', background: 'var(--accent)', color: 'black' }}
          >
            {done ? 'Next lesson →' : 'Complete & continue →'}
          </button>
        ) : (
          <Link
            href={`/playground/learn/${courseSlug}`}
            onClick={() => markComplete()}
            className="font-mono font-medium rounded px-4 py-2 transition-opacity hover:opacity-90"
            style={{ fontSize: 11, letterSpacing: '0.08em', background: 'var(--accent)', color: 'black', textDecoration: 'none' }}
          >
            {done ? 'Course overview →' : 'Finish course →'}
          </Link>
        )}
      </div>
    </div>
  )
}
