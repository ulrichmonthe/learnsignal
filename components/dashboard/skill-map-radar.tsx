'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface ScoreRow {
  dimension: string
  score: number
  decisions_count: number
}

const DIMENSION_LABELS: Record<string, string> = {
  'technical-foundation': 'Technical',
  'product-craft': 'Product Craft',
  'strategic-thinking': 'Strategy',
  'execution': 'Execution',
  'community': 'Community',
  'product-taste': 'Taste',
}

const ALL_DIMENSIONS = Object.keys(DIMENSION_LABELS)

interface Props {
  scores: ScoreRow[]
}

export function SkillMapRadar({ scores }: Props) {
  const data = ALL_DIMENSIONS.map(dim => ({
    dimension: DIMENSION_LABELS[dim],
    score: scores.find(s => s.dimension === dim)?.score ?? 0,
    fullMark: 100,
  }))

  if (scores.length === 0) {
    return (
      <div className="border border-border p-8 flex flex-col items-center justify-center min-h-64">
        <p className="font-mono text-xs text-text3 text-center">
          Complete scenarios and signals to build your skill map.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border p-4">
      <p className="font-mono text-xs text-text3 uppercase tracking-wide mb-4">
        Skill radar
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border2)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'var(--text3)', fontSize: 10, fontFamily: 'var(--font-dm-mono)' }}
          />
          <Radar
            dataKey="score"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
