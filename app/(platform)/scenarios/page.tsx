import { ScenarioSubmitForm } from '@/components/scenario/scenario-submit-form'

export default function ScenariosPage() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-16">
      <p className="font-mono text-xs text-text3 tracking-wide uppercase mb-3">In development</p>
      <h1 className="font-display text-3xl font-black text-text mb-4">Step inside the decision</h1>
      <p className="text-text2 text-sm leading-relaxed mb-3 max-w-xl">
        Scenarios put you in the meeting — a real situation where an AI PM has to make the call
        before the answer is obvious. We&apos;re hand-writing the first set with practitioners,
        and they&apos;ll land here as they&apos;re ready.
      </p>
      <p className="text-text2 text-sm leading-relaxed mb-12 max-w-xl">
        The same muscle is live today in the labs:{' '}
        <a href="/playground/rag-lab" className="text-accent hover:opacity-70 transition-opacity">RAG Lab</a>{' '}
        and{' '}
        <a href="/playground/pce-lab" className="text-accent hover:opacity-70 transition-opacity">PCE Lab</a>{' '}
        are decision environments where every choice is scored — and every course lesson now ends
        with a decision you have to commit to before the answer is revealed.
      </p>

      <div className="pt-10" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
        <p className="font-mono text-xs text-accent tracking-wide uppercase mb-2">Have one to suggest?</p>
        <h2 className="font-display text-xl font-black text-text mb-2">Submit a scenario</h2>
        <p className="text-text3 text-sm mb-6 max-w-xl leading-relaxed">
          Lived through a decision worth turning into a scenario? Send it our way — the strongest
          ones get built into the platform.
        </p>
        <ScenarioSubmitForm />
      </div>
    </div>
  )
}
