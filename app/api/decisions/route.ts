import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 300

export async function GET() {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('decisions')
    .select('id, slug, name, description, display_order, signals(slug, name, display_order)')
    .order('display_order')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
  })
}
