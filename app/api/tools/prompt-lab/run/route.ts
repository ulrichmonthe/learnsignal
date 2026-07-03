import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const MONTHLY_LIMIT_INDIVIDUAL = 50
const MAX_PROMPT_CHARS = 10_000
const MAX_OUTPUT_TOKENS = 1024
const ALLOWED_MODELS = new Set(['claude-sonnet-4-6', 'claude-haiku-4-5'])

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { systemPrompt, userPrompt, temperature = 1, modelId = 'claude-sonnet-4-6' } = body

  if (typeof userPrompt !== 'string' || !userPrompt) {
    return NextResponse.json({ error: 'userPrompt required' }, { status: 400 })
  }
  if (!ALLOWED_MODELS.has(modelId)) {
    return NextResponse.json({ error: 'Unknown model' }, { status: 400 })
  }
  if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
    return NextResponse.json({ error: 'temperature must be between 0 and 1' }, { status: 400 })
  }
  if (
    (systemPrompt?.length ?? 0) > MAX_PROMPT_CHARS ||
    userPrompt.length > MAX_PROMPT_CHARS
  ) {
    return NextResponse.json({ error: 'Prompt too long (max 10,000 chars)' }, { status: 400 })
  }

  // Check monthly rate limit
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('tool_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tool_id', 'prompt-lab')
    .gte('created_at', monthStart.toISOString())

  if ((count ?? 0) >= MONTHLY_LIMIT_INDIVIDUAL) {
    return NextResponse.json(
      { error: 'Monthly limit reached (50 runs/mo on individual plan)' },
      { status: 429 }
    )
  }

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }]

  const response = await client.messages.create({
    model: modelId,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages,
  })

  await supabase.from('tool_usage').insert({
    user_id: userId,
    tool_id: 'prompt-lab',
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  })

  return NextResponse.json({
    response: response.content[0].type === 'text' ? response.content[0].text : '',
    usage: response.usage,
    stopReason: response.stop_reason,
  })
}
