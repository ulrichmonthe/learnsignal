import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/marketing/Nav'
import { getPublishedSignals } from '@/lib/signals/published'
import { WEEKLY_SIGNAL_CSS } from './styles'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "The Week's Signal — one AI research finding, one decision · LearnSignal",
  description:
    'Each week: one piece of AI research or one model release, stripped of hype and translated into the decision it changes for an AI product manager.',
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function WeeklySignalIndex() {
  const issues = await getPublishedSignals()

  return (
    <>
      <Nav />
      <div className="ws">
        <style dangerouslySetInnerHTML={{ __html: WEEKLY_SIGNAL_CSS }} />
        <div className="ws-inner">
          <header className="ws-head">
            <p className="ws-eyebrow">The Week&apos;s Signal</p>
            <h1 className="ws-title">
              One finding a week. <em>The decision it changes.</em>
            </h1>
            <p className="ws-frame">
              The field moves too fast for a monthly digest. Each issue takes one piece of
              research or one release, strips the academic and launch framing, and says what an
              AI PM should do differently — or that nothing has changed, which is also an answer.
            </p>
          </header>

          {issues.length === 0 ? (
            <div className="ws-empty">
              <p className="ws-empty-title">The first issue is being written.</p>
              <p className="ws-empty-body">
                Issues are published weekly. In the meantime, the{' '}
                <Link href="/signals">Signals essays</Link> cover the same ground at length.
              </p>
            </div>
          ) : (
            <ul className="ws-list-issues">
              {issues.map((s) => (
                <li key={s.slug}>
                  <Link href={`/weekly-signal/${s.slug}`} className="ws-card">
                    <div className="ws-card-meta">
                      {s.category && <span className="ws-cat">{s.category}</span>}
                      <span className="ws-date">
                        {s.weekOf ? `Week of ${fmtDate(s.weekOf)}` : fmtDate(s.publishedAt)}
                      </span>
                    </div>
                    <h2 className="ws-card-title">{s.title}</h2>
                    {s.dek && <p className="ws-card-dek">{s.dek}</p>}
                    {s.decisionFraming && (
                      <p className="ws-card-decision">
                        <span>The decision it changes — </span>
                        {s.decisionFraming}
                      </p>
                    )}
                    <span className="ws-card-more">Read this issue →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
