'use client'

interface Props {
  content: string
  onContinue: () => void
}

export function SituationAct({ content, onContinue }: Props) {
  return (
    <div>
      <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-4">
        Act 01 — The situation
      </p>
      <div className="bg-surface border border-border2 p-6 mb-8">
        <p className="text-text2 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
      <button
        onClick={onContinue}
        className="bg-accent text-bg font-mono text-sm font-medium px-6 py-3 hover:bg-accent-dk transition-colors"
      >
        What would you do? →
      </button>
    </div>
  )
}
