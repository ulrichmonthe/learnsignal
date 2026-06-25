// Interactive scenario teaser used on the marketing landing — makes the
// manifesto's "the scenario comes before the framework" concrete.
import { SlackWindow } from '@/components/ui/slack-window'

const DEMO_MESSAGES = [
  {
    user: 'Sarah (PM)',
    avatar: 'S',
    time: '9:03 AM',
    text: 'Engineering says fine-tuning will take 3 months and $40k. But our retrieval accuracy is at 61% and customers are churning. What do we do?',
  },
  {
    user: 'Devika (ML)',
    avatar: 'D',
    time: '9:07 AM',
    text: 'RAG could get us to 80%+ in 2 weeks. Fine-tuning is overkill for this problem.',
  },
  {
    user: 'James (Eng)',
    avatar: 'J',
    time: '9:09 AM',
    text: 'Disagree. Our data is proprietary and the retrieval latency will kill the UX. We need the model to internalize it.',
  },
  {
    user: 'Sarah (PM)',
    avatar: 'S',
    time: '9:11 AM',
    text: "How do we decide? I don't have a framework for this.",
  },
]

const OPTIONS = [
  'Fine-tune on proprietary data',
  'Build a RAG pipeline',
  'Hybrid — RAG now, fine-tune later',
  'Delay — improve data quality first',
]

export function SlackDemo() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <p className="font-mono text-xs tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted, #888)' }}>
          Scenario 01 — Fine-tune vs RAG
        </p>
        <SlackWindow messages={DEMO_MESSAGES} />
      </div>

      <div className="flex flex-col justify-center">
        <p className="font-mono text-xs tracking-wide uppercase mb-4" style={{ color: 'var(--text-muted, #888)' }}>
          What you decide next
        </p>
        <div className="space-y-3">
          {OPTIONS.map((option, i) => (
            <div
              key={i}
              className="w-full text-left px-4 py-3 text-sm font-mono"
              style={{ border: '1px solid var(--border, #1C1C1A)', color: 'var(--text-secondary, #aaa)' }}
            >
              <span style={{ color: 'var(--text-muted, #666)', marginRight: '12px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {option}
            </div>
          ))}
        </div>
        <a
          href="/playground"
          className="mt-6 inline-block font-mono text-sm font-medium px-6 py-3 text-center"
          style={{ background: 'var(--accent)', color: '#0B0B09' }}
        >
          See how to make this decision →
        </a>
      </div>
    </div>
  )
}
