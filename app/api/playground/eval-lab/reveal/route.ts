import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Pattern detection slots per the build brief
const PATTERN_SLOTS = {
  shortInputHallucination: [3, 7, 11, 17],
  sarcasmAsNeutral: [5, 9, 13, 16],
  multiIssueDrop: [8, 14],
  subvertedPattern: [19],    // trap ticket — correct label is PASS
  calibration: [10, 15, 20], // EITHER — excluded from pattern counts
}

export type PatternResult = {
  id: string
  name: string
  caughtCount: number
  totalCount: number
  confirmedCount?: number  // for multi-issue pattern
  description: string
  tier: 'confirmed' | 'spotted'
}

export type RevealData = {
  ticketsLabelled: number
  sessionMinutes: number
  patterns: PatternResult[]
  subvertedPatternMissed: boolean  // user labelled ticket 19 as FAIL
  allCaught: boolean
  zeroCaught: boolean
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionId = req.nextUrl.searchParams.get('session_id')

  // Find the most recent completed (or in-progress) session
  let query = supabase
    .from('vibe_check_sessions')
    .select('id, started_at, completed_at, last_ticket')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)

  if (sessionId) {
    query = supabase
      .from('vibe_check_sessions')
      .select('id, started_at, completed_at, last_ticket')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .limit(1)
  }

  const { data: sessions } = await query
  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ error: 'No session found' }, { status: 404 })
  }

  const session = sessions[0]

  // Fetch all labels for this session
  const { data: labels } = await supabase
    .from('ticket_labels')
    .select('slot_number, label')
    .eq('session_id', session.id)

  if (!labels) {
    return NextResponse.json({ error: 'No labels found' }, { status: 404 })
  }

  const labelMap = new Map<number, string>(labels.map(l => [l.slot_number, l.label]))
  const ticketsLabelled = labels.length

  // Calculate session duration in minutes
  const started = new Date(session.started_at)
  const ended = session.completed_at ? new Date(session.completed_at) : new Date()
  const sessionMinutes = Math.round((ended.getTime() - started.getTime()) / 60000)

  // --- Pattern 1: Short-input hallucinations ---
  const shortSlots = PATTERN_SLOTS.shortInputHallucination
  const shortCaught = shortSlots.filter(s => labelMap.get(s) === 'FAIL').length

  // --- Pattern 2: Sarcasm as neutral ---
  // Base 4 slots + bonus for correctly labelling ticket 19 as PASS
  const sarcasmSlots = PATTERN_SLOTS.sarcasmAsNeutral
  const sarcasmCaught = sarcasmSlots.filter(s => labelMap.get(s) === 'FAIL').length
  const ticket19CorrectlyPassed = labelMap.get(19) === 'PASS'
  const sarcasmTotalWithBonus = 5 // 4 genuine + 1 bonus (ticket 19 = correctly not marking as FAIL)
  const sarcasmCaughtWithBonus = sarcasmCaught + (ticket19CorrectlyPassed ? 1 : 0)

  // --- Pattern 3: Multi-issue label drops ---
  const multiSlots = PATTERN_SLOTS.multiIssueDrop
  const multiCaught = multiSlots.filter(
    s => labelMap.get(s) === 'FAIL' || labelMap.get(s) === 'NEEDS_EDITS'
  ).length

  // --- Subverted pattern trap ---
  const subvertedPatternMissed = labelMap.get(19) === 'FAIL'

  // Build pattern results
  const shortDescription =
    shortCaught === 0
      ? "Every ticket under 12 characters had invented details — error codes, account types, urgency levels that weren't in the input. These are worth looking at."
      : shortCaught >= 3
        ? `You caught ${shortCaught} of them. The agent invented details — error codes, account types, urgency levels — that weren't in the input.`
        : `You caught ${shortCaught} of them. The ones you missed were short inputs where the agent filled in plausible-sounding details that weren't in the ticket at all.`

  const sarcasmDescription =
    sarcasmCaught === 0
      ? 'The agent labelled angry, sarcastic tickets as neutral sentiment across all four cases. This is worth re-reading — every one of those tickets contained clear frustration signals.'
      : sarcasmCaught >= 4
        ? `The agent labelled angry, sarcastic tickets as neutral sentiment. You caught ${sarcasmCaughtWithBonus} of the ${sarcasmTotalWithBonus}. The hardest cases used polite phrasing wrapped around clearly angry intent.`
        : `The agent labelled angry, sarcastic tickets as neutral sentiment. You caught ${sarcasmCaughtWithBonus} of the ${sarcasmTotalWithBonus}. The ones you missed used polite words — all the surface markers of calm — while the intent was frustration.`

  const multiDescription =
    multiCaught === 0
      ? 'Two tickets contained two separate issues — the agent only categorised one each time. These are worth flagging: customers who mention multiple issues often have higher churn risk.'
      : multiCaught === 1
        ? 'You flagged one ticket where a customer mentioned two issues and the agent only categorised one. There was a second one. Worth investigating — this often correlates with churn risk.'
        : 'You flagged both tickets where a customer mentioned two issues and the agent only categorised one. This pattern often correlates with churn risk — customers who get half an answer.'

  const patterns: PatternResult[] = [
    {
      id: 'short-input-hallucination',
      name: 'Short-input hallucinations',
      caughtCount: shortCaught,
      totalCount: shortSlots.length,
      description: shortDescription,
      tier: shortCaught >= 2 ? 'confirmed' : 'spotted',
    },
    {
      id: 'sarcasm-as-neutral',
      name: 'Sarcasm read as neutral',
      caughtCount: sarcasmCaughtWithBonus,
      totalCount: sarcasmTotalWithBonus,
      description: sarcasmDescription,
      tier: sarcasmCaught >= 2 ? 'confirmed' : 'spotted',
    },
    {
      id: 'multi-issue-drop',
      name: 'Multi-issue label drops',
      caughtCount: multiCaught,
      totalCount: multiSlots.length,
      confirmedCount: multiCaught,
      description: multiDescription,
      tier: 'spotted', // always spotted for MVP
    },
  ]

  const totalConfirmedCaught = shortCaught + sarcasmCaughtWithBonus + multiCaught
  const allCaught =
    shortCaught === shortSlots.length &&
    sarcasmCaughtWithBonus === sarcasmTotalWithBonus &&
    multiCaught === multiSlots.length
  const zeroCaught = totalConfirmedCaught === 0

  const revealData: RevealData = {
    ticketsLabelled,
    sessionMinutes: Math.max(1, sessionMinutes),
    patterns,
    subvertedPatternMissed,
    allCaught,
    zeroCaught,
  }

  return NextResponse.json(revealData)
}
