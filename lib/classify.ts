// Keyword-based classifier (MVP: fast, deterministic, zero cost)
// Shared between the API route and server-side usage

const EVAL_KEYWORDS = [
  'hallucin',
  'making things up',
  'making stuff up',
  'making up',
  'catch it',
  'catch them',
  'catch errors',
  'catch mistake',
  'eval',
  'quality',
  'good look',
  'what good look',
  'score',
  'ready to ship',
  'ship',
  'measure',
  'assess',
  'test',
  'accurate',
  'wrong answer',
  'mistakes',
  'wrong output',
  'fail',
  'benchmark',
  'metric',
  'chatbot',
  'llm',
  'agent',
  'label',
  'golden',
  'dataset',
  'trace',
  'judge',
  'tpr',
  'tnr',
  'precision',
  'recall',
  'f1',
  'false positive',
  'false negative',
]

export type ClassifyResult =
  | { route: 'eval'; confidence: 'high' | 'medium' }
  | { route: 'out-of-scope' }

export function classifyQuery(q: string): ClassifyResult {
  if (!q || q.trim().length === 0) return { route: 'out-of-scope' }
  const lower = q.toLowerCase()
  const matches = EVAL_KEYWORDS.filter(kw => lower.includes(kw))
  if (matches.length >= 2) return { route: 'eval', confidence: 'high' }
  if (matches.length === 1) return { route: 'eval', confidence: 'medium' }
  return { route: 'out-of-scope' }
}
