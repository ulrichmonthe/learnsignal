'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { getMissionById } from '@/lib/pce-lab/missions'
import { scoreState, isMissionComplete } from '@/lib/pce-lab/scoring'
import {
  loadProgress,
  saveProgress,
  recordMissionComplete,
  fetchCloudProgress,
  pushCloudProgress,
  type PCEProgress,
} from '@/lib/pce-lab/persist'
import type {
  AtlasPromptState,
  FewShotExample,
  ContextBlueprintRow,
  MissionState,
  SavedVersion,
  Mission,
} from '@/lib/pce-lab/types'

import PromptEditor from '@/components/pce-lab/prompt-editor'
import FewShotManager from '@/components/pce-lab/few-shot-manager'
import ContextBlueprint from '@/components/pce-lab/context-blueprint'
import TestBench from '@/components/pce-lab/test-bench'
import ScoreDashboard from '@/components/pce-lab/score-dashboard'

const TIER_COLORS: Record<string, string> = {
  'the-shift': 'rgba(200,240,64,0.8)',
  'the-prompt': '#60a5fa',
  'the-context': '#a78bfa',
  production: '#f59e0b',
}

// ── Guard component (no hooks) ───────────────────────────────────────────────
interface Props {
  missionId: string
}

export default function PCELabClient({ missionId }: Props) {
  const mission = getMissionById(missionId)
  if (!mission) return null
  return <MissionWorkspace mission={mission} />
}

// ── Inner component that holds all stateful logic ────────────────────────────
function MissionWorkspace({ mission }: { mission: Mission }) {
  const tierColor = TIER_COLORS[mission.tier] ?? 'var(--accent)'

  // ── Editable state ──────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState<AtlasPromptState>(() => ({
    ...mission.startingState.prompt,
  }))
  const [fewShots, setFewShots] = useState<FewShotExample[]>(() =>
    mission.startingState.fewShots.map(f => ({ ...f }))
  )
  const [blueprint, setBlueprint] = useState<ContextBlueprintRow[]>(() =>
    mission.startingState.contextBlueprint.map(r => ({ ...r }))
  )

  // ── Versions ─────────────────────────────────────────────────────────────────
  const [versions, setVersions] = useState<SavedVersion[]>([])

  // ── Persisted progress (localStorage + cloud) ────────────────────────────────
  const [progress, setProgress] = useState<PCEProgress | null>(null)

  useEffect(() => {
    setProgress(loadProgress())
    // Pull the account's progress (source of truth across devices) and cache it.
    fetchCloudProgress().then(cloud => {
      if (cloud) {
        setProgress(cloud)
        saveProgress(cloud)
      }
    })
  }, [])

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [leftTab, setLeftTab] = useState<'prompt' | 'few-shots' | 'context'>('prompt')
  const [saveLabel, setSaveLabel] = useState<'SAVE VERSION' | 'SAVED ✓'>('SAVE VERSION')

  // ── Live score (derived) ─────────────────────────────────────────────────────
  const currentState: MissionState = useMemo(
    () => ({ prompt, fewShots, contextBlueprint: blueprint }),
    [prompt, fewShots, blueprint]
  )

  const score = useMemo(
    () => scoreState(currentState, mission),
    [currentState, mission]
  )

  const missionComplete = isMissionComplete(score, mission, versions.length)

  // Record completion once progress is hydrated; keep the best score ratcheted.
  useEffect(() => {
    if (!missionComplete || progress === null) return
    const existing = progress.missions[mission.id]
    if (existing?.completed && existing.bestScore >= score.composite) return
    const next = recordMissionComplete(progress, mission.id, score.composite)
    setProgress(next)
    saveProgress(next)
    pushCloudProgress(next)
  }, [missionComplete, progress, mission.id, score.composite])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const updatePromptField = useCallback(
    (field: keyof AtlasPromptState, value: string) => {
      setPrompt(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  function saveVersion() {
    const versionNum = versions.length + 1
    const newVersion: SavedVersion = {
      id: `v-${Date.now()}`,
      name: `v${versionNum} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toISOString(),
      state: {
        prompt: { ...prompt },
        fewShots: fewShots.map(f => ({ ...f })),
        contextBlueprint: blueprint.map(r => ({ ...r })),
      },
      score: { ...score, ticketResults: [...score.ticketResults] },
    }

    setVersions(prev => [...prev, newVersion])
    setSaveLabel('SAVED ✓')
    setTimeout(() => setSaveLabel('SAVE VERSION'), 1800)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 57px)' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 flex items-center gap-4 px-4 border-b"
        style={{
          height: '48px',
          borderColor: 'rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        {/* Back + breadcrumb */}
        <Link
          href="/playground/pce-lab"
          className="font-mono hover:opacity-70 transition-opacity flex-shrink-0"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}
        >
          ← Missions
        </Link>

        <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '12px' }}>|</span>

        {/* Tier badge */}
        <span
          className="font-mono rounded px-2 py-0.5 flex-shrink-0"
          style={{
            fontSize: '8px',
            letterSpacing: '0.12em',
            color: tierColor,
            background: `${tierColor}10`,
            border: `0.5px solid ${tierColor}30`,
            textTransform: 'uppercase',
          }}
        >
          {mission.tierLabel}
        </span>

        {/* Mission title */}
        <h1
          className="font-display font-medium flex-1 min-w-0 truncate"
          style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}
        >
          #{mission.number} — {mission.title}
        </h1>

        {/* Target score display */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            TARGET
          </span>
          <span className="font-mono" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {mission.targetScore}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '12px' }}>·</span>
          <span
            className="font-mono"
            style={{
              fontSize: '13px',
              color:
                score.composite >= mission.targetScore
                  ? 'var(--accent)'
                  : score.composite >= mission.targetScore - 10
                  ? '#f59e0b'
                  : 'rgba(255,255,255,0.5)',
              transition: 'color 0.3s',
            }}
          >
            {score.composite}
          </span>
        </div>

        {/* Mission complete chip */}
        {missionComplete && (
          <div
            className="flex-shrink-0 font-mono rounded px-2 py-0.5"
            style={{
              fontSize: '9px',
              color: 'var(--accent)',
              background: 'rgba(200,240,64,0.08)',
              border: '0.5px solid rgba(200,240,64,0.3)',
              letterSpacing: '0.1em',
            }}
          >
            COMPLETE ✓
          </div>
        )}

        {/* Save version button */}
        <button
          onClick={saveVersion}
          className="flex-shrink-0 font-mono rounded px-3 py-1 transition-all"
          style={{
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: saveLabel === 'SAVED ✓' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
            background:
              saveLabel === 'SAVED ✓' ? 'rgba(200,240,64,0.08)' : 'rgba(255,255,255,0.04)',
            border: `0.5px solid ${
              saveLabel === 'SAVED ✓' ? 'rgba(200,240,64,0.25)' : 'rgba(255,255,255,0.12)'
            }`,
            cursor: 'pointer',
          }}
        >
          {saveLabel}
        </button>
      </div>

      {/* ── Three-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Workshop ── */}
        <div
          className="flex flex-col border-r overflow-hidden"
          style={{ width: '340px', borderColor: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
        >
          {/* Tab switcher */}
          <div
            className="flex-shrink-0 flex border-b"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            {(
              [
                { key: 'prompt', label: 'Prompt' },
                { key: 'few-shots', label: 'Few-Shots' },
                { key: 'context', label: 'Blueprint' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setLeftTab(tab.key)}
                className="flex-1 font-mono transition-colors"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '10px 0',
                  color: leftTab === tab.key ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                  background: 'none',
                  border: 'none',
                  borderBottom:
                    leftTab === tab.key
                      ? '1.5px solid var(--accent)'
                      : '1.5px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {leftTab === 'prompt' && (
              <PromptEditor value={prompt} onChange={updatePromptField} />
            )}
            {leftTab === 'few-shots' && (
              <FewShotManager examples={fewShots} onChange={setFewShots} />
            )}
            {leftTab === 'context' && (
              <ContextBlueprint rows={blueprint} onChange={setBlueprint} />
            )}
          </div>
        </div>

        {/* ── CENTER: Test bench ── */}
        <div className="flex-1 overflow-hidden">
          <TestBench
            brief={mission.brief}
            character={mission.character}
            devNote={mission.devNote}
            tickets={mission.tickets}
            ticketResults={score.ticketResults}
            activeTicketId={activeTicketId}
            onSelectTicket={setActiveTicketId}
          />
        </div>

        {/* ── RIGHT: Score dashboard ── */}
        <div
          className="border-l overflow-hidden"
          style={{ width: '260px', borderColor: 'rgba(255,255,255,0.07)', flexShrink: 0 }}
        >
          <ScoreDashboard
            score={score}
            targetScore={mission.targetScore}
            versions={versions}
            missionComplete={missionComplete}
            completionSynthesis={mission.completionSynthesis}
          />
        </div>
      </div>
    </div>
  )
}
