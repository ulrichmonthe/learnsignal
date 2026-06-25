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
  options: Option[]
  onDecide: (optionId: string) => void
}

export function DecisionAct({ options, onDecide }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div>
      <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-2">
        Act 02 — Decision point
      </p>
      <h2 className="font-display text-2xl font-black italic text-text mb-6">
        What do you do?
      </h2>

      <div className="space-y-3 mb-8">
        {options.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={cn(
              'w-full text-left border px-5 py-4 transition-colors',
              selected === opt.id
                ? 'border-accent bg-surface2 text-text'
                : 'border-border text-text2 hover:border-border2 hover:text-text'
            )}
          >
            <span className="font-mono text-xs text-text3 mr-3">
              {String(i + 1).padStart(2, '0')}
            </span>
            {opt.text}
          </button>
        ))}
      </div>

      {selected && (
        <button
          onClick={() => onDecide(selected)}
          className="bg-accent text-bg font-mono text-sm font-medium px-6 py-3 hover:bg-accent-dk transition-colors"
        >
          See what happens →
        </button>
      )}
    </div>
  )
}
