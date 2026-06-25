'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Option {
  id: string
  text: string
  consequence: string
  isExpertPath: boolean
}

interface Props {
  content: string
  decisions: Record<string, string>
  options: Option[]
  onContinue: () => void
}

export function ConsequencesAct({ content, decisions, options, onContinue }: Props) {
  const [showOthers, setShowOthers] = useState(false)

  const chosenId = Object.values(decisions)[0]
  const chosen = options.find(o => o.id === chosenId)
  const expertOption = options.find(o => o.isExpertPath)
  const others = options.filter(o => o.id !== chosenId)

  return (
    <div>
      <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-4">
        Act 03 — Consequences
      </p>

      {/* Chosen path result */}
      {chosen && (
        <div className="border border-border2 p-5 mb-4">
          <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-2">You chose</p>
          <p className="text-text text-sm font-medium mb-3">{chosen.text}</p>
          <p className="text-text2 text-sm leading-relaxed">{chosen.consequence}</p>
        </div>
      )}

      {/* Expert comparison */}
      {expertOption && expertOption.id !== chosenId && (
        <div className="border border-accent px-5 py-4 mb-4">
          <p className="font-mono text-xs text-accent uppercase tracking-wide mb-2">
            Expert path
          </p>
          <p className="text-text text-sm font-medium mb-1">{expertOption.text}</p>
          <p className="text-text2 text-xs leading-relaxed">{expertOption.consequence}</p>
        </div>
      )}

      {expertOption?.id === chosenId && (
        <div className="border border-teal px-5 py-4 mb-4">
          <p className="font-mono text-xs text-teal uppercase tracking-wide">
            You chose the expert path
          </p>
        </div>
      )}

      {/* Other paths (collapsed) */}
      <button
        onClick={() => setShowOthers(v => !v)}
        className="font-mono text-xs text-text3 mb-4 hover:text-text2 transition-colors"
      >
        {showOthers ? '▾' : '▸'} Other paths ({others.length})
      </button>

      {showOthers && (
        <div className="space-y-3 mb-4">
          {others.map(opt => (
            <div key={opt.id} className={cn('border px-5 py-4', 'border-border')}>
              <p className="text-text text-sm font-medium mb-1">{opt.text}</p>
              <p className="text-text3 text-xs leading-relaxed">{opt.consequence}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={onContinue}
          className="bg-accent text-bg font-mono text-sm font-medium px-6 py-3 hover:bg-accent-dk transition-colors"
        >
          Understand the framework →
        </button>
      </div>
    </div>
  )
}
