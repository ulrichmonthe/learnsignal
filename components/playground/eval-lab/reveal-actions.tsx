'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pushEvalLabProgress } from '@/lib/eval-lab/persist'

export default function RevealActions({ score }: { score: number }) {
  const router = useRouter()

  // Reaching the full reveal = lab completed. Fire-and-forget skill credit.
  useEffect(() => {
    pushEvalLabProgress(score)
  }, [score])

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <button
        onClick={() => router.push('/dashboard')}
        className="font-mono font-medium text-black hover:opacity-90 transition-opacity"
        style={{
          fontSize: '12px',
          letterSpacing: '0.08em',
          background: '#C8F040',
          padding: '14px 22px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        BUILD YOUR DATASET →
      </button>
      <button
        onClick={() => router.push('/dashboard')}
        className="font-mono"
        style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.55)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        SAVE &amp; COME BACK LATER
      </button>
    </div>
  )
}
