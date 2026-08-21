import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CAPABILITY_MAP } from '@/lib/capabilities/map'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Resume bridge: parse an uploaded PDF against the same 14-capability taxonomy
// the job classifier uses, store the claims, discard the file. Claims are
// routing signals only — readiness and the public record never count them.

const MAX_BYTES = 4 * 1024 * 1024 // 4MB decoded
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TAXONOMY = Object.keys(CAPABILITY_MAP)

const SYSTEM = `You extract AI-product-management capability claims from a resume.

Return ONLY a JSON array, no fences or commentary. Each element:
{ "capability": "<one of the taxonomy below>", "claimed_level": 1|2|3, "evidence_quote": "<short quote or close paraphrase from the resume>" }

TAXONOMY (capability MUST be one of): ${TAXONOMY.join(', ')}

RULES:
- Only claim a capability when the resume shows CONCRETE evidence: a named artefact, system, metric, or responsibility. "Worked with AI" is not evidence.
- claimed_level: 1 = touched it, 2 = owned it on one product, 3 = deep repeated ownership.
- evidence_quote must come from the resume text. Never invent.
- 0 claims is a valid answer. Maximum 8. Return [] if the document is not a resume.`

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const data = (body as { data?: unknown } | null)?.data
  if (typeof data !== 'string' || data.length === 0) {
    return NextResponse.json({ error: 'Missing file data' }, { status: 400 })
  }
  if (data.length > (MAX_BYTES * 4) / 3 + 64) {
    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 413 })
  }
  // PDF magic bytes = %PDF ("JVBERi" in base64)
  if (!data.startsWith('JVBERi')) {
    return NextResponse.json({ error: 'Only PDF resumes are supported' }, { status: 400 })
  }

  let text = ''
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data },
            },
            { type: 'text', text: 'Extract the capability claims as specified. JSON array only.' },
          ],
        },
      ],
    })
    text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
  } catch {
    return NextResponse.json({ error: 'Could not parse the resume — try again' }, { status: 502 })
  }

  let claims: Array<{ capability: string; claimed_level: number; evidence_quote: string }> = []
  try {
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start === -1 || end <= start) throw new Error('no array')
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))
    if (!Array.isArray(parsed)) throw new Error('not array')
    claims = parsed
      .filter(
        (c): c is { capability: string; claimed_level?: unknown; evidence_quote?: unknown } =>
          !!c && typeof c === 'object' && typeof (c as { capability?: unknown }).capability === 'string',
      )
      .filter((c) => TAXONOMY.includes(c.capability))
      .slice(0, 8)
      .map((c) => ({
        capability: c.capability,
        claimed_level: Math.max(1, Math.min(3, Number(c.claimed_level) || 1)),
        evidence_quote: typeof c.evidence_quote === 'string' ? c.evidence_quote.slice(0, 300) : '',
      }))
  } catch {
    return NextResponse.json({ error: 'The model returned an unreadable result — try again' }, { status: 502 })
  }

  const supabase = await createServiceClient()
  const { error: delError } = await supabase.from('resume_claims').delete().eq('user_id', userId)
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 })
  }
  if (claims.length > 0) {
    const { error } = await supabase.from('resume_claims').insert(
      claims.map((c) => ({
        user_id: userId,
        capability: c.capability,
        claimed_level: c.claimed_level,
        evidence_quote: c.evidence_quote,
      })),
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, claims })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createServiceClient()
  const { error } = await supabase.from('resume_claims').delete().eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
