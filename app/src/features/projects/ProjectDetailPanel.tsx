import { useEffect, useState } from 'react'
import { useData } from '../../lib/data'
import { fmtDate } from '../../lib/format'
import { isClosed, stageLabel, stageTheme } from '../../lib/pipeline'
import type { Project } from '../../lib/pipeline'

export default function ProjectDetailPanel({
  projectId,
  onClose,
}: {
  projectId: number
  onClose: () => void
}) {
  const { projects, customers, stages, tasks, updateProject } = useData()
  const project = projects.find((p) => p.id === projectId)
  const customer = project ? customers.find((c) => c.id === project.customer_id) : undefined
  const projectTasks = tasks.filter((t) => t.project_id === projectId)

  const [notes, setNotes] = useState('')
  const [stageVal, setStageVal] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  useEffect(() => {
    if (!project) return
    setNotes(project.notes)
    setStageVal(project.stage)
  }, [project])

  if (!project) {
    return (
      <div className="detail-panel">
        <p>Project not found.</p>
      </div>
    )
  }

  const theme = stageTheme(project.stage)

  async function save(patch: Partial<Project>) {
    setSaving(true)
    setSaveErr(null)
    try {
      await updateProject(project!.id, patch)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleStageChange(nextStage: number) {
    setStageVal(nextStage)
    const stageRow = stages.find((s) => s.stage === nextStage)
    await save({
      stage: nextStage,
      step: stageRow?.step ?? 0,
      completed_on: nextStage === 7 ? new Date().toISOString().slice(0, 10) : null,
    })
  }

  return (
    <div className="detail-panel">
      <header className="detail-header">
        <button type="button" className="btn-link detail-close" onClick={onClose}>
          ✕ Close
        </button>
        <h2>{project.name}</h2>
        <div className="detail-meta">
          <span className="stage-chip" style={{ background: theme.light, color: theme.text }}>
            {stageLabel(project.stage, project.step, stages)}
          </span>
          {customer && <span>{customer.business_name}</span>}
        </div>
      </header>

      <section className="detail-section">
        <label className="field-label">Pipeline stage</label>
        <select
          className="field-input"
          value={stageVal}
          disabled={saving}
          onChange={(e) => void handleStageChange(Number(e.target.value))}
        >
          {stages.map((s) => (
            <option key={`${s.stage}-${s.step}`} value={s.stage}>
              {s.stage_name}
            </option>
          ))}
        </select>
      </section>

      {project.system_description && (
        <section className="detail-section">
          <h3>Scope</h3>
          <p className="detail-text">{project.system_description}</p>
        </section>
      )}

      <section className="detail-section detail-grid">
        <div>
          <span className="field-label">Start</span>
          <span>{fmtDate(project.start_on) || '—'}</span>
        </div>
        <div>
          <span className="field-label">Deadline</span>
          <span>{fmtDate(project.deadline) || '—'}</span>
        </div>
        {isClosed(project.stage) && (
          <div>
            <span className="field-label">Completed</span>
            <span>{fmtDate(project.completed_on) || '—'}</span>
          </div>
        )}
      </section>

      <section className="detail-section">
        <label className="field-label" htmlFor="project-notes">
          Notes
        </label>
        <textarea
          id="project-notes"
          className="field-textarea"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving || notes === project.notes}
          onClick={() => void save({ notes })}
        >
          {saving ? 'Saving…' : 'Save notes'}
        </button>
      </section>

      {projectTasks.length > 0 && (
        <section className="detail-section">
          <h3>Tasks ({projectTasks.length})</h3>
          <ul className="task-list">
            {projectTasks.map((t) => (
              <li key={t.id}>
                <span className={`task-status task-status-${t.status}`}>{t.status.replace('_', ' ')}</span>
                {t.title}
                {t.due_on && <span className="cell-sub"> due {fmtDate(t.due_on)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {saveErr && <div className="login-error">{saveErr}</div>}
    </div>
  )
}
