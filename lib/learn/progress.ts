import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export type CourseProgress = { completedSlugs: string[]; lastSlug: string | null }

// Server-side read of a user's lesson-completion for a course.
export async function getCourseProgress(courseSlug: string): Promise<CourseProgress> {
  const { userId } = await auth()
  if (!userId) return { completedSlugs: [], lastSlug: null }

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('lab_progress')
    .select('data')
    .eq('user_id', userId)
    .eq('lab', `course:${courseSlug}`)
    .maybeSingle()

  const d = (data?.data ?? {}) as { completedSlugs?: string[]; lastSlug?: string | null }
  return { completedSlugs: d.completedSlugs ?? [], lastSlug: d.lastSlug ?? null }
}
