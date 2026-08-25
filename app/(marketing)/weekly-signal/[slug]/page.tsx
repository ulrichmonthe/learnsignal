import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Nav } from '@/components/marketing/Nav'
import { Markdown } from '@/components/signals/markdown'
import { AuthCta } from '@/components/marketing/auth-cta'
import { getPublishedSignal } from '@/lib/signals/published'
import { WEEKLY_SIGNAL_CSS } from '../styles'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const issue = await getPublishedSignal(slug)
  if (!issue) return { title: 'Not found · LearnSignal' }
  const description =
    issue.dek ?? issue.decisionFraming ?? 'One AI research finding, and the decision it changes.'
  return {
    title: `${issue.title} · The Week's Signal`,
    description,
    openGraph: { title: issue.title, description, type: 'article' },
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function WeeklySignalIssue({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const issue = await getPublishedSignal(slug)
  // Covers unknown slugs and anything not approved — a pending or rejected
  // draft must be indistinguishable from one that never existed.
  if (!issue) notFound()

  return (
    <>
      <Nav />
      <div className="ws">
        <style dangerouslySetInnerHTML={{ __html: WEEKLY_SIGNAL_CSS }} />
        <div className="ws-inner">
          <Link href="/weekly-signal" className="ws-back">
            ← The Week&apos;s Signal
          </Link>

          <header className="ws-head">
            <p className="ws-eyebrow">
              {issue.category ? `${issue.category} · ` : ''}
              {issue.weekOf ? `Week of ${fmtDate(issue.weekOf)}` : fmtDate(issue.publishedAt)}
            </p>
            <h1 className="ws-title">{issue.title}</h1>
            {issue.dek && <p className="ws-frame">{issue.dek}</p>}
          </header>

          {issue.decisionFraming && (
            <div className="ws-decision">
              <p className="ws-decision-label">The decision it changes</p>
              <p className="ws-decision-text">{issue.decisionFraming}</p>
            </div>
          )}

          <article className="ws-body">
            <Markdown source={issue.bodyMd} />
          </article>

          {issue.sources.length > 0 && (
            <div className="ws-sources">
              <p className="ws-sources-label">Sources</p>
              <ul>
                {issue.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="ws-cta">
            <div className="ws-cta-text">
              Reading about the decision is not the same as making it.
            </div>
            <AuthCta
              signedOutHref="/sign-up"
              signedOutLabel="Practise this →"
              signedInHref="/playground"
              signedInLabel="Go to the playground →"
              className="ws-cta-btn"
            />
          </div>
        </div>
      </div>
    </>
  )
}
