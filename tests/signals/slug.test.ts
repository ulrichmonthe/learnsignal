import { describe, expect, it } from 'vitest'
import { slugify, uniqueSlug } from '@/lib/signals/slug'

describe('slugify (AC-1)', () => {
  it('lowercases and hyphenates a title', () => {
    expect(slugify('The model is a depreciating asset')).toBe(
      'the-model-is-a-depreciating-asset',
    )
  })

  it('drops apostrophes rather than splitting the word', () => {
    expect(slugify("Don't ship it")).toBe('dont-ship-it')
    expect(slugify('Don’t ship it')).toBe('dont-ship-it')
  })

  it('strips punctuation and collapses separators', () => {
    expect(slugify('Evals: from "vibe check" — to production!!')).toBe(
      'evals-from-vibe-check-to-production',
    )
  })

  it('strips diacritics to stay ASCII', () => {
    expect(slugify('Café résumé naïve')).toBe('cafe-resume-naive')
  })

  it('never leaves a leading or trailing hyphen', () => {
    const s = slugify('  ---Hello, world---  ')
    expect(s).toBe('hello-world')
    expect(s.startsWith('-')).toBe(false)
    expect(s.endsWith('-')).toBe(false)
  })

  it('truncates long titles without a trailing hyphen', () => {
    const s = slugify('a'.repeat(40) + ' ' + 'b'.repeat(60))
    expect(s.length).toBeLessThanOrEqual(70)
    expect(s.endsWith('-')).toBe(false)
  })

  it.each(['', '   ', '!!!', '???', '—'])(
    'falls back to a usable slug for unusable title %p',
    (title) => {
      expect(slugify(title)).toBe('weekly-signal')
    },
  )

  it('does not shadow a reserved route segment', () => {
    expect(slugify('feed')).toBe('feed-signal')
    expect(slugify('RSS')).toBe('rss-signal')
  })

  it('is idempotent — slugifying a slug returns it unchanged', () => {
    const once = slugify('The decision it changes')
    expect(slugify(once)).toBe(once)
  })

  it('produces only URL-safe characters', () => {
    expect(slugify('Ship it? 100% — now/later (maybe)')).toMatch(/^[a-z0-9-]+$/)
  })
})

describe('uniqueSlug (AC-2, AC-3)', () => {
  it('returns the plain slug when free', () => {
    expect(uniqueSlug('Hello world', [])).toBe('hello-world')
  })

  it('suffixes rather than colliding', () => {
    expect(uniqueSlug('Hello world', ['hello-world'])).toBe('hello-world-2')
  })

  it('keeps counting past an existing suffix', () => {
    expect(uniqueSlug('Hello world', ['hello-world', 'hello-world-2'])).toBe('hello-world-3')
  })

  it('never returns a slug already taken', () => {
    const taken = ['hello-world', 'hello-world-2', 'hello-world-3', 'hello-world-4']
    expect(taken).not.toContain(uniqueSlug('Hello world', taken))
  })

  it('is unaffected by unrelated taken slugs', () => {
    expect(uniqueSlug('Fresh title', ['hello-world', 'something-else'])).toBe('fresh-title')
  })
})
