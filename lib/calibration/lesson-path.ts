// Client-safe route parsing. Deliberately isolated from the rest of the
// calibration lib: those modules reach node:crypto (HMAC, hashing), which
// webpack cannot bundle for the browser. The exercise component is a client
// component, so it may only import from here.

/** Courses whose exercises may write to the corpus. Closed set — an unknown
 *  course means a bad or spoofed route, and a junk row is worse than no row. */
export const KNOWN_COURSES = new Set([
  'rag',
  'prompt-context-engineering',
  'evals-foundations',
  'harness-engineering',
  'agent-orchestration',
])

export const LESSON_RE = /^lesson-\d{1,3}$/

/** Derives course + lesson from a lesson route, or null if it isn't one. */
export function parseLessonPath(
  pathname: string,
): { course: string; lesson: string } | null {
  const parts = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean)
  // Require the full /playground/learn/<course>/<lesson> shape. Matching a bare
  // "learn" segment anywhere would let an unrelated route mint corpus rows.
  const i = parts.indexOf('learn')
  if (i < 1 || parts[i - 1] !== 'playground' || parts.length < i + 3) return null
  const course = parts[i + 1]
  const lesson = parts[i + 2]
  if (!KNOWN_COURSES.has(course) || !LESSON_RE.test(lesson)) return null
  return { course, lesson }
}
