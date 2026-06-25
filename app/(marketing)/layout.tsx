import type { Metadata } from 'next'
import './marketing.css'

export const metadata: Metadata = {
  title: 'LearnSignal — Build AI PM judgment by deciding, not watching',
  description:
    'LearnSignal puts the PM inside the decision before revealing the answer. Every module is a real situation; every lesson is earned through judgment, not absorbed through slides.',
}

// All marketing styles are scoped under `.ls-marketing`, so the manifesto/nav/
// footer rules can never leak into the authenticated app.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="ls-marketing">{children}</div>
}
