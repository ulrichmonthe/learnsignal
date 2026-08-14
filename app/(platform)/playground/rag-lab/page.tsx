'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MISSIONS } from '@/lib/rag-lab/missions'
import { loadProgress, saveProgress, fetchCloudProgress } from '@/lib/rag-lab/persist'
import { levelFromXP } from '@/lib/rag-lab/score'
import type { GameProgress } from '@/lib/rag-lab/types'

// ── Level XP helper (re-export from score.ts for client use) ──────────────────
function levelInfo(xp: number) {
  let level = 1
  while (100 * level * (level + 1) / 2 <= xp) level++
  const currentThreshold = 100 * (level - 1) * level / 2
  const nextThreshold = 100 * level * (level + 1) / 2
  const progress = (xp - currentThreshold) / (nextThreshold - currentThreshold)
  return { level, progress: Math.max(0, Math.min(1, progress)), xpToNext: nextThreshold - xp }
}

const MODULE_LABELS = {
  1: "Why the Model Doesn't Know Things",
  2: 'Making Retrieval Work',
  3: 'Operating RAG in Production',
  4: 'RAG in the Agentic Era',
}

const MODULE_COLORS: Record<number, string> = {
  1: 'rgba(200,240,64,0.12)',
  2: 'rgba(100,200,255,0.08)',
  3: 'rgba(255,180,80,0.08)',
  4: 'rgba(200,100,255,0.08)',
}

const MODULE_ACCENT: Record<number, string> = {
  1: 'var(--accent)',
  2: 'rgba(100,200,255,0.8)',
  3: 'rgba(255,180,80,0.8)',
  4: 'rgba(200,100,255,0.8)',
}

export default function RAGLabHome() {
  const [progress, setProgress] = useState<GameProgress | null>(null)

  useEffect(() => {
    setProgress(loadProgress())
    // Pull the account's progress (source of truth across devices) and cache it.
    fetchCloudProgress().then((cloud) => {
      if (cloud) {
        setProgress(cloud)
        saveProgress(cloud)
      }
    })
  }, [])

  const totalXP = progress?.totalXP ?? 0
  const { level, progress: lvlProgress, xpToNext } = levelInfo(totalXP)
  const streak = progress?.streak ?? 0
  const badgeCount = Object.values(progress?.badges ?? {}).filter(Boolean).length

  const isMissionUnlocked = (order: number) => {
    if (order === 1) return true
    const prev = MISSIONS.find(m => m.order === order - 1)
    if (!prev) return false
    return progress?.missions[prev.id]?.completed ?? false
  }

  const byModule = [1, 2, 3, 4].map(mod => ({
    mod,
    missions: MISSIONS.filter(m => m.module === mod),
  }))

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link href="/playground/learn/rag"
                className="font-mono hover:opacity-70 transition-opacity"
                style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
                RAG Course
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>›</span>
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em' }}>
                RAG Lab
              </span>
            </div>
            <h1 className="font-display font-medium text-text mb-2"
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontStyle: 'italic' }}>
              RAG Lab
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm-sans)' }}>
              Build Helix's retrieval pipeline across 13 missions. Every knob is a real RAG trade-off.
            </p>
          </div>

          {/* XP / Level / Streak strip */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-right">
              <p className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)' }}>LEVEL</p>
              <p className="font-mono font-medium" style={{ fontSize: '28px', color: 'var(--accent)', lineHeight: 1 }}>{level}</p>
              <div style={{ width: '80px', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', marginTop: '4px' }}>
                <div style={{ width: `${lvlProgress * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '1px', transition: 'width 0.5s' }} />
              </div>
              <p className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '3px' }}>{xpToNext} XP to next</p>
            </div>
            <div className="text-right">
              <p className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)' }}>STREAK</p>
              <p className="font-mono font-medium" style={{ fontSize: '28px', color: streak > 0 ? '#f0c040' : 'rgba(255,255,255,0.25)', lineHeight: 1 }}>{streak}d</p>
            </div>
            <div className="text-right">
              <p className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)' }}>BADGES</p>
              <p className="font-mono font-medium" style={{ fontSize: '28px', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{badgeCount}</p>
            </div>
          </div>
        </div>

        {/* Mission map — 4 module columns */}
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {byModule.map(({ mod, missions }) => (
            <div key={mod} className="rounded-lg p-4"
              style={{ background: MODULE_COLORS[mod], border: `0.5px solid ${MODULE_ACCENT[mod].replace('0.8', '0.2')}` }}>
              <p className="font-mono uppercase mb-4"
                style={{ fontSize: '9px', letterSpacing: '0.16em', color: MODULE_ACCENT[mod] }}>
                Module {mod} · {MODULE_LABELS[mod as 1|2|3|4]}
              </p>

              <div className="space-y-2">
                {missions.map(m => {
                  const mp = progress?.missions[m.id]
                  const unlocked = isMissionUnlocked(m.order)
                  const rating = mp?.rating
                  const score = mp?.bestScore ?? 0

                  return (
                    <div key={m.id}>
                      {unlocked ? (
                        <Link href={`/playground/rag-lab/${m.id}`}
                          className="block rounded-lg transition-all active:scale-[0.99]"
                          style={{
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: rating === 'gold'
                              ? '0.5px solid rgba(200,240,64,0.4)'
                              : rating === 'pass'
                              ? '0.5px solid rgba(255,255,255,0.15)'
                              : '0.5px solid rgba(255,255,255,0.08)',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
                              MISSION {m.order}
                            </span>
                            {rating === 'gold' && <span style={{ fontSize: '10px' }}>⭐</span>}
                            {rating === 'pass' && <span className="font-mono" style={{ fontSize: '9px', color: 'var(--accent)' }}>✓</span>}
                          </div>
                          <p style={{ fontSize: '12px', color: rating ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.65)', lineHeight: '1.3', fontFamily: 'var(--font-dm-sans)' }}>
                            {m.title}
                          </p>
                          {score > 0 && (
                            <p className="font-mono mt-1" style={{ fontSize: '10px', color: rating === 'gold' ? 'var(--accent)' : 'rgba(255,255,255,0.4)' }}>
                              Best: {score}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <div className="rounded-lg" style={{
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.01)',
                          border: '0.5px solid rgba(255,255,255,0.05)',
                          opacity: 0.4,
                        }}>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>🔒</span>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans)' }}>
                              {m.title}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick start CTA */}
        {!progress?.missions['mission-1']?.completed && (
          <div className="mt-10 rounded-lg p-5 flex items-center justify-between"
            style={{ background: 'rgba(200,240,64,0.04)', border: '0.5px solid rgba(200,240,64,0.2)' }}>
            <div>
              <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'var(--accent)' }}>Start here</p>
              <p className="font-display font-medium" style={{ fontSize: '16px', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>
                Mission 1 — Isolate the Failure
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-dm-sans)', marginTop: '4px' }}>
                Diagnose whether retrieval or generation broke first. Anchor lesson: L3.
              </p>
            </div>
            <Link href="/playground/rag-lab/mission-1"
              className="font-mono font-medium hover:opacity-90 transition-opacity flex-shrink-0 ml-6"
              style={{ fontSize: '11px', letterSpacing: '0.1em', background: 'var(--accent)', color: 'black', padding: '10px 18px', borderRadius: '6px' }}>
              BEGIN →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
