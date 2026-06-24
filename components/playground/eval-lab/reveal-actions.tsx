'use client'

import { useRouter } from 'next/navigation'

export default function RevealActions() {
  const router = useRouter()

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
