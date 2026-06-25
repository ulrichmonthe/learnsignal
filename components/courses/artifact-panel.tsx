// Persistent artifact panel — shows artifacts the learner has built.
// Phase A: empty state only. Phase B+: pulls from user_artifacts table.

interface ArtifactPreview {
  label: string
  lesson: number
  icon?: string
}

interface ArtifactPanelProps {
  artifacts?: {
    type: string
    title: string
    createdAt: string
  }[]
  previewArtifacts?: ArtifactPreview[]
}

const ARTIFACT_ICONS: Record<string, string> = {
  rubric: '◈',
  evaluator_architecture: '⬡',
  judge_prompt: '◎',
  monitoring_plan: '◉',
  debugging_playbook: '◇',
  test_input_set: '◫',
  failure_patterns_doc: '◆',
}

const ARTIFACT_LABELS: Record<string, string> = {
  rubric: 'Rubric',
  evaluator_architecture: 'Evaluator Architecture',
  judge_prompt: 'Judge Prompt',
  monitoring_plan: 'Monitoring Plan',
  debugging_playbook: 'Debugging Playbook',
  test_input_set: 'Test Input Set',
  failure_patterns_doc: 'Failure Patterns',
}

const DEFAULT_EVALS_PREVIEWS: ArtifactPreview[] = [
  { label: 'Rubric for the Triage Agent', lesson: 4, icon: '◈' },
  { label: 'Evaluator architecture', lesson: 6, icon: '⬡' },
  { label: 'Calibrated judge prompt', lesson: 7, icon: '◎' },
  { label: 'Production monitoring plan', lesson: 9, icon: '◉' },
  { label: 'Failure-tracing playbook', lesson: 10, icon: '◇' },
]

export default function ArtifactPanel({ artifacts = [], previewArtifacts }: ArtifactPanelProps) {
  const previews = previewArtifacts ?? DEFAULT_EVALS_PREVIEWS
  return (
    <div
      className="rounded-lg p-5"
      style={{
        border: '0.5px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.015)',
        position: 'sticky',
        top: '80px',
      }}
    >
      <p
        className="font-mono uppercase mb-4"
        style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.3)' }}
      >
        Your Artifacts
      </p>

      {artifacts.length === 0 ? (
        <div>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
              lineHeight: '1.6',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Your artifacts from this course will appear here as you complete exercises.
          </p>

          {/* Preview of artifacts to come */}
          <div className="mt-5 space-y-3">
            {previews.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{ opacity: 0.3 }}
              >
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                  {item.icon ?? '◈'}
                </span>
                <div>
                  <p
                    className="font-mono"
                    style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.3' }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="font-mono"
                    style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}
                  >
                    Unlocks in Lesson {item.lesson}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {artifacts.map((artifact, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded"
              style={{
                background: 'rgba(200,240,64,0.05)',
                border: '0.5px solid rgba(200,240,64,0.15)',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--accent)', opacity: 0.7 }}>
                {ARTIFACT_ICONS[artifact.type] ?? '◈'}
              </span>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                  {artifact.title || ARTIFACT_LABELS[artifact.type] || artifact.type}
                </p>
                <p
                  className="font-mono"
                  style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}
                >
                  Built in this course
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
