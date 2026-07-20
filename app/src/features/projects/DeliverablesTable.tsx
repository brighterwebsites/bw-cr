import { useState } from 'react'
import { useData } from '../../lib/data'
import type { ProjectDeliverable } from '../../lib/pipeline'

type DelType = ProjectDeliverable['type']
type DelStatus = ProjectDeliverable['status']

const TYPE_LABEL: Record<DelType, string> = {
  goal_target: 'Goal / target',
  collection_of_work: 'Collection of work',
  guaranteed_outcome: 'Guaranteed outcome',
}

export default function DeliverablesTable({
  projectId,
  readOnly = false,
}: {
  projectId: number
  readOnly?: boolean
}) {
  const { deliverables, createDeliverable, updateDeliverable, deleteDeliverable } = useData()
  const rows = deliverables.filter((d) => d.project_id === projectId)

  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<DelType>('goal_target')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleAdd() {
    if (!title.trim()) {
      setErr('Title required')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await createDeliverable({
        project_id: projectId,
        title: title.trim(),
        type,
        status: 'planned',
      })
      setTitle('')
      setType('goal_target')
      setAdding(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  async function onStatus(id: number, status: DelStatus) {
    try {
      await updateDeliverable(id, { status })
    } catch {
      /* ignore */
    }
  }

  async function onType(id: number, next: DelType) {
    try {
      await updateDeliverable(id, { type: next })
    } catch {
      /* ignore */
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Delete this deliverable?')) return
    try {
      await deleteDeliverable(id)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="deliverables-block">
      <div className="deliverables-head">
        <span className="jdp-label">Deliverables</span>
        {!readOnly && !adding && (
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setAdding(true)
              setErr(null)
            }}
          >
            + Add
          </button>
        )}
      </div>

      {err && <div className="login-error" style={{ marginBottom: 6 }}>{err}</div>}

      {!readOnly && adding && (
        <div className="deliverables-add-row">
          <input
            className="jdp-input"
            placeholder="Deliverable title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="jdp-input"
            value={type}
            onChange={(e) => setType(e.target.value as DelType)}
          >
            {(Object.keys(TYPE_LABEL) as DelType[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABEL[k]}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void handleAdd()}>
            {busy ? '…' : 'Add'}
          </button>
          <button
            type="button"
            className="btn btn-gray"
            onClick={() => {
              setAdding(false)
              setErr(null)
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {rows.length === 0 && !adding ? (
        <div className="mutedtext deliverables-empty">No deliverables yet.</div>
      ) : rows.length > 0 ? (
        <table className="table panel-mini-table">
          <thead>
            <tr>
              <th className="th-left">Title</th>
              <th>Type</th>
              <th>Status</th>
              {!readOnly && <th />}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="td-left">{d.title}</td>
                <td>
                  {readOnly ? (
                    <span className="mutedtext">{TYPE_LABEL[d.type]}</span>
                  ) : (
                    <select
                      className="table-inline-select"
                      value={d.type}
                      onChange={(e) => void onType(d.id, e.target.value as DelType)}
                    >
                      {(Object.keys(TYPE_LABEL) as DelType[]).map((k) => (
                        <option key={k} value={k}>
                          {TYPE_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>
                  {readOnly ? (
                    <span className={`del-status del-status-${d.status}`}>{d.status}</span>
                  ) : (
                    <select
                      className="table-inline-select"
                      value={d.status}
                      onChange={(e) => void onStatus(d.id, e.target.value as DelStatus)}
                    >
                      <option value="planned">planned</option>
                      <option value="in_progress">in_progress</option>
                      <option value="done">done</option>
                      <option value="dropped">dropped</option>
                    </select>
                  )}
                </td>
                {!readOnly && (
                  <td>
                    <button type="button" className="btn-link" onClick={() => void onDelete(d.id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}
