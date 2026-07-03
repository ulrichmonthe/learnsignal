import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a research translator for AI product managers. Given a paper abstract, return a JSON object with these exact keys:
- "coreInsight": 1-2 paragraph plain English summary, no jargon
- "implementationDifficulty": integer 1-5 with "justification" string
- "computeRequirement": one of "low" | "medium" | "high" | "very high"
- "productRelevance": 1-2 sentences on relevance to the given product type
- "immediateAction": one concrete thing a PM could do this week based on this paper

Return only valid JSON. No prose, no markdown, no explanation.`

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const abstract = body?.abstract
  const productType = typeof body?.productType === 'string' ? body.productType.slice(0, 200) : undefined
  if (typeof abstract !== 'string' || !abstract.trim()) {
    return NextResponse.json({ error: 'abstract required' }, { status: 400 })
  }
  if (abstract.length > 50_000) {
    return NextResponse.json({ error: 'abstract too long (max 50,000 chars)' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Product type: ${productType ?? 'general AI product'}\n\nAbstract:\n${abstract}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const result = JSON.parse(raw)
    await supabase.from('tool_usage').insert({
      user_id: userId,
      tool_id: 'research-translator',
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse model response' }, { status: 500 })
  }
}
