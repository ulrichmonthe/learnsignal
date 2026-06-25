import { NextRequest, NextResponse } from 'next/server'
import { classifyQuery } from '@/lib/classify'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const result = classifyQuery(q)
  return NextResponse.json(result)
}
