// Chunking — §6.1. Token ≈ whitespace-split word (documented simplification).
// Chunk id is deterministic: "${docId}:${size}:${overlap}:${index}"

import type { Document, Chunk } from './types'
import { CONFIG } from './config'

export function chunkDocument(doc: Document, size: number, overlap: number): Chunk[] {
  // Clamp to config ranges
  const sz = Math.max(CONFIG.chunking.sizeMin, Math.min(CONFIG.chunking.sizeMax, size))
  const ov = Math.max(CONFIG.chunking.overlapMin, Math.min(Math.min(CONFIG.chunking.overlapMax, sz - 1), overlap))

  // Tokenize with TRUE character positions in the original body so that
  // chunk.start/chunk.end are real offsets (gold spans are calibrated to body).
  // doc.body.slice(chunk.start, chunk.end) === chunk.text holds exactly.
  const tokens: { start: number; end: number }[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(doc.body)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length })
  }

  const chunks: Chunk[] = []
  let wordIndex = 0
  let chunkIndex = 0

  while (wordIndex < tokens.length) {
    const slice = tokens.slice(wordIndex, wordIndex + sz)
    if (slice.length === 0) break

    const start = slice[0].start
    const end = slice[slice.length - 1].end
    const text = doc.body.slice(start, end)

    chunks.push({
      id: `${doc.id}:${sz}:${ov}:${chunkIndex}`,
      docId: doc.id,
      start,
      end,
      text,
      index: chunkIndex,
    })

    chunkIndex++
    // Advance by (size - overlap) words, but at least 1
    wordIndex += Math.max(1, sz - ov)
  }

  return chunks
}

export function chunkCorpus(docs: Document[], size: number, overlap: number): Chunk[] {
  return docs.flatMap(doc => chunkDocument(doc, size, overlap))
}

/** Returns the total token (word) count of a text string. */
export function countTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}
