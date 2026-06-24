'use client'

import Link from 'next/link'
import { MISSIONS } from '@/lib/pce-lab/missions'
import type { MissionTier } from '@/lib/pce-lab/types'

const TIER_META: Record<MissionTier, { label: string; color: string; description: string }> = {
  'the-shift': {
    label: 'The Shift',
    color: 'rgba(200,240,64,0.8)',
    description: 'Get oriented. Understand what changes when you engineer AI context, not just prompts.',
  },
  'the-prompt': {
    label: 'The Prompt',
    color: '#60a5fa',
    description: 'Build the six-section system prompt that becomes the structural spine of Atlas.',
  },
  'the-context': {
    label: 'The Context',
    color: '#a78bfa',
    description: 'Control what goes in the context window, in what order, and at what cost.',
  },
  production: {
    label: 'Production',
    color: '#f59e0b',
    description: 'Handle adversarial inputs, model upgrades, and everything production throws at you.',
  },
}

const TIER_ORDER: MissionTier[] = ['the-shift', 'the-prompt', 'the-context', 'production']

const CHARACTER_INITIAL: Record<string, string> = { jordan: 'J', dev: 'D', sara: 'S' }
const CHARACTER_COLOR: Record<string, string> = {
  jordan: 'var(--accent)',
  dev: '#60a5fa',
  sara: '#f59e0b',
}
const CHARACTER_LABEL: Record<string, string> = {
  jordan: 'Jordan · Support',
  dev: 'Dev · Engineering',
  sara: 'Sara · CEO',
}

export default function PCELabPage() {
  const grouped = TIER_ORDER.map(tier => ({
    tier,
    meta: TIER_META[tier],
    missions: MISSIONS.filter(m => m.tier === tier),
  }))

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[860px] mx-auto px-6 py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/playground"
              className="font-mono hover:opacity-70 transition-opacity"
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}
            >
              Playground
            </Link>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>/</span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              PCE Lab
            </span>
          </div>

          <p className="font-mono uppercase mb-3" style={{ fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)' }}>
            Prompt & Context Engineering Lab
          </p>
          <h1
            className="font-display font-medium leading-tight mb-4"
            style={{ fontSize: 'clamp(26px, 4vw, 36px)', color: 'rgba(255,255,255,0.92)' }}
          >
            Build Atlas.
            <br />
            <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>
              The support agent that doesn&apos;t hallucinate.
            </span>
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.7',
              fontFamily: 'var(--font-dm-sans)',
              maxWidth: '560px',
            }}
          >
            Ten missions. Each one gives you a broken or incomplete version of Atlas and a test suite of real customer tickets.
            Fix the prompt, tune the context assembly, and hit the target Signal Score to advance.
          </p>
        </div>

        {/* Stat bar */}
        <div
          className="flex items-center gap-6 rounded-lg px-5 py-3 mb-10"
          style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)' }}
        >
          {[
            { label: 'Missions', value: '10' },
            { label: 'Tiers', value: '4' },
            { label: 'Test tickets', value: String(MISSIONS.reduce((s, m) => s + m.tickets.length, 0)) },
            { label: 'Eval criteria', value: '20' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-display font-medium" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.85)' }}>
                {value}
              </p>
              <p className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Tier sections */}
        {grouped.map(({ tier, meta, missions }) => (
          <div key={tier} className="mb-10">
            {/* Tier header */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-1 rounded-full mt-1 flex-shrink-0"
                style={{ height: '40px', background: meta.color, opacity: 0.7 }}
              />
              <div>
                <p
                  className="font-mono uppercase mb-0.5"
                  style={{ fontSize: '9px', letterSpacing: '0.18em', color: meta.color }}
                >
                  {meta.label}
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)', lineHeight: '1.5' }}>
                  {meta.description}
                </p>
              </div>
            </div>

            {/* Mission cards */}
            <div className="space-y-2 pl-4">
              {missions.map(mission => (
                <Link
                  key={mission.id}
                  href={`/playground/pce-lab/${mission.id}`}
                  className="block rounded-lg transition-all group"
                  style={{
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.01)',
                    padding: '14px 16px',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = `${meta.color}40`
                    ;(e.currentTarget as HTMLAnchorElement).style.background = `${meta.color}06`
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.07)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.01)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Mission number */}
                    <div
                      className="flex-shrink-0 font-display font-medium leading-none"
                      style={{ fontSize: '28px', color: meta.color, opacity: 0.35, minWidth: '32px', marginTop: '-2px' }}
                    >
                      {mission.number}
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          style={{
                            fontSize: '14px',
                            color: 'rgba(255,255,255,0.82)',
                            fontFamily: 'var(--font-dm-sans)',
                            fontWeight: 500,
                          }}
                        >
                          {mission.title}
                        </h3>
                        {mission.attemptsAllowed !== 'unlimited' && (
                          <span
                            className="font-mono rounded px-1.5"
                            style={{ fontSize: '8px', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.2)' }}
                          >
                            {mission.attemptsAllowed} attempts
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.4)',
                          fontFamily: 'var(--font-dm-sans)',
                          lineHeight: '1.55',
                          marginBottom: '8px',
                        }}
                      >
                        {mission.teachingConcept}
                      </p>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.35)',
                          fontFamily: 'var(--font-dm-sans)',
                          lineHeight: '1.5',
                          fontStyle: 'italic',
                          borderLeft: `1.5px solid ${meta.color}30`,
                          paddingLeft: '8px',
                        }}
                      >
                        &ldquo;{mission.brief}&rdquo;
                      </p>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* Character badge */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-mono flex-shrink-0"
                          style={{
                            background: `${CHARACTER_COLOR[mission.character]}15`,
                            fontSize: '9px',
                            color: CHARACTER_COLOR[mission.character],
                          }}
                        >
                          {CHARACTER_INITIAL[mission.character]}
                        </div>
                        <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
                          {CHARACTER_LABEL[mission.character]}
                        </span>
                      </div>

                      {/* Target score */}
                      <div className="text-right">
                        <p className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>target</p>
                        <p className="font-display font-medium" style={{ fontSize: '18px', color: meta.color, opacity: 0.8 }}>
                          {mission.targetScore}
                        </p>
                      </div>

                      {/* Tickets */}
                      <p className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                        {mission.tickets.length} tickets
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Footer note */}
        <div className="mt-4 pt-6" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-sans)', lineHeight: '1.6' }}>
            Scoring is deterministic — no LLM calls in Phase A. The eval engine checks structural properties of your
            prompt and context blueprint against 20 criteria. Real LLM evaluation is Phase B.
          </p>
        </div>

      </div>
    </div>
  )
}
