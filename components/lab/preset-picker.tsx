'use client'

import { PRESET_LIST } from '@/lib/lab/presets'
import { Badge } from './lab-ui'

// Landing surface: cards from PRESET_LIST. Selecting one loads its Graph in the
// parent and reveals the three modes. The active card stays highlighted so the
// picker doubles as a switcher across modes.
export function PresetPicker({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <div className="lab-seclabel">Pick a graph</div>
      <div className="lab-presets">
        {PRESET_LIST.map((p) => (
          <button
            key={p.id}
            type="button"
            className="lab-preset"
            aria-pressed={p.id === selected}
            onClick={() => onSelect(p.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="lab-preset-name">{p.name}</span>
              <Badge tone={p.id === selected ? 'acc' : 'neutral'}>{p.pattern}</Badge>
            </div>
            <div className="lab-preset-blurb">{p.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
