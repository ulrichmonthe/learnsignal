import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { classifyQuery } from '@/lib/classify'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') ?? '').slice(0, 2_000)
  const result = classifyQuery(q)
  return NextResponse.json(result)
}
