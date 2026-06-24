// Simulated grounded generation — §6.6.
// No LLM at runtime. Deterministically assembles an answer from fed chunks.
// A goldClaim is SUPPORTED only if a fedChunk FULLY CONTAINS its goldSpan.
// If not supported → emit the distractorText (hallucination). This makes
// bad-retrieval → hallucination mechanical and honest.

import type { Query, Chunk, GeneratedAnswer, GeneratedClaim } from './types'

/** True if chunk fully contains (start ≤ spanStart AND end ≥ spanEnd) the span. */
function chunkFullyContainsSpan(
  chunk: Chunk,
  span: { docId: string; start: number; end: number },
): boolean {
  return (
    chunk.docId === span.docId &&
    chunk.start <= span.start &&
    chunk.end >= span.end
  )
}

export function generate(query: Query, fedChunks: Chunk[]): GeneratedAnswer {
  const claims: GeneratedClaim[] = query.goldClaims.map(goldClaim => {
    // Find the first fedChunk that fully contains the claim's goldSpan
    const supportingChunk = fedChunks.find(c =>
      chunkFullyContainsSpan(c, goldClaim.goldSpan)
    )

    if (supportingChunk) {
      return {
        text: goldClaim.text,
        supportedBySpan: goldClaim.goldSpan,
        isHallucinated: false,
      }
    } else {
      // No chunk fully covers the gold span → hallucinate the distractor version
      return {
        text: goldClaim.distractorText,
        supportedBySpan: null,
        isHallucinated: true,
      }
    }
  })

  // Assemble answer text from claims
  const text = claims.map(c => c.text).join(' ')

  return { text, claims }
}
