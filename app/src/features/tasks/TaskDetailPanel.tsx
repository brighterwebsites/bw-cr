import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import type { Task } from '../../lib/pipeline'

type TaskStatus = Task['status']
type TaskType = Task['task_type']

type TaskForm = {
  title: string
  notes: string
  agent_note: string
  status: TaskStatus
  task_type: TaskType
  due_on: string
  assigned_to: string
  customer_id: number | ''
  project_id: number | ''
  asset_id: number | ''
}

const BLANK: TaskForm = {
  title: '',
  notes: '',
  agent_note: '',
  status: 'not_started',
  task_type: 'task',
  due_on: '',
  assigned_to: '',
  customer_id: '',
  project_id: '',
  asset_id: '',
}

function formFromTask(t: Task): TaskForm {
  return {
    title: t.title,
    notes: t.notes,
    agent_note: t.agent_note ?? '',
    status: t.status,
    task_type: t.task_type,
    due_on: t.due_on ?? '',
    assigned_to: t.assigned_to,
    customer_id: t.customer_id ?? '',
    project_id: t.project_id ?? '',
    asset_id: t.asset_id ?? '',
  }
}

function toPayload(form: TaskForm) {
  return {
    title: form.title.trim(),
    notes: form.notes,
    agent_note: form.agent_note,
    status: form.status,
    task_type: form.task_type,
    due_on: form.due_on || null,
    assigned_to: form.assigned_to,
    customer_id: form.customer_id === '' ? null : form.customer_id,
    project_id: form.project_id === '' ? null : form.project_id,
    asset_id: form.asset_id === '' ? null : form.asset_id,
  }
}

export default function TaskDetailPanel({
  taskId,
  onClose,
  onCreated,
}: {
  taskId: number | 'new'
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const { tasks, customers, projects, assets, updateTask, createTask } = useData()
  const task = taskId === 'new' ? undefined : tasks.find((t) => t.id === taskId)

  const [form, setForm] = useState<TaskForm>(BLANK)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (taskId === 'new') {
      setForm(BLANK)
    } else {
      const row = tasks.find((t) => t.id === taskId)
      if (row) setForm(formFromTask(row))
    }
    setErr(null)
    setOk(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount sync on taskId only
  }, [taskId])

  const projectsForCustomer = useMemo(() => {
    if (form.customer_id === '') return projects
    return projects.filter((p) => p.customer_id === form.customer_id)
  }, [projects, form.customer_id])

  const assetsForCustomer = useMemo(() => {
    if (form.customer_id === '') return assets
    return assets.filter((a) => a.customer_id === form.customer_id)
  }, [assets, form.customer_id])

  function set<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'customer_id') {
        const custId = value as TaskForm['customer_id']
        if (
          next.project_id !== '' &&
          !projects.some((p) => p.id === next.project_id && p.customer_id === custId)
        ) {
          next.project_id = ''
        }
        if (
          next.asset_id !== '' &&
          !assets.some((a) => a.id === next.asset_id && a.customer_id === custId)
        ) {
          next.asset_id = ''
        }
      }
      if (key === 'project_id' && value !== '' && next.customer_id === '') {
        const p = projects.find((x) => x.id === value)
        if (p) next.customer_id = p.customer_id
      }
      if (key === 'asset_id' && value !== '' && next.customer_id === '') {
        const a = assets.find((x) => x.id === value)
        if (a) next.customer_id = a.customer_id
      }
      return next
    })
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setErr('Title is required.')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const payload = toPayload(form)
      if (taskId === 'new') {
        const row = await createTask(payload)
        onCreated(row.id)
      } else {
        await updateTask(taskId, payload)
        setOk(true)
        setTimeout(() => setOk(false), 2000)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (taskId !== 'new' && !task) {
    return (
      <div className="jdp">
        <div className="jdp-header">
          <div className="jdp-title">
            <div className="jdp-name">Task not found</div>
          </div>
          <button type="button" className="jdp-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="jdp">
      <div className="jdp-header">
        <div className="jdp-title">
          <div className="jdp-name">{taskId === 'new' ? 'New task' : form.title || 'Task'}</div>
          {taskId !== 'new' && <span className="mutedtext">#{taskId}</span>}
        </div>
        <button type="button" className="jdp-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {err && <div className="login-error" style={{ marginBottom: 8 }}>{err}</div>}
      {ok && <div className="login-ok" style={{ marginBottom: 8 }}>Saved</div>}

      <div className="jdp-section">
        <div className="jdp-section-title">Task</div>
        <div className="jdp-2col">
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Title</span>
            <input
              className="jdp-input"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Type</span>
            <select
              className="jdp-input"
              value={form.task_type}
              onChange={(e) => set('task_type', e.target.value as TaskType)}
            >
              <option value="task">task</option>
              <option value="agent_task">agent_task</option>
              <option value="internal">internal</option>
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Status</span>
            <select
              className="jdp-input"
              value={form.status}
              onChange={(e) => set('status', e.target.value as TaskStatus)}
            >
              <option value="not_started">not_started</option>
              <option value="in_progress">in_progress</option>
              <option value="blocked">blocked</option>
              <option value="completed">completed</option>
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Due</span>
            <input
              className="jdp-input"
              type="date"
              value={form.due_on}
              onChange={(e) => set('due_on', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Assigned to</span>
            <input
              className="jdp-input"
              value={form.assigned_to}
              onChange={(e) => set('assigned_to', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Customer</span>
            <select
              className="jdp-input"
              value={form.customer_id === '' ? '' : String(form.customer_id)}
              onChange={(e) =>
                set('customer_id', e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">None</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business_name}
                </option>
              ))}
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Project</span>
            <select
              className="jdp-input"
              value={form.project_id === '' ? '' : String(form.project_id)}
              onChange={(e) =>
                set('project_id', e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">None</option>
              {projectsForCustomer.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Asset</span>
            <select
              className="jdp-input"
              value={form.asset_id === '' ? '' : String(form.asset_id)}
              onChange={(e) =>
                set('asset_id', e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">None</option>
              {assetsForCustomer.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.asset_url || `Asset #${a.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Notes</span>
            <textarea
              className="jdp-input jdp-textarea"
              rows={4}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Agent note</span>
            <textarea
              className="jdp-input jdp-textarea"
              rows={3}
              placeholder="Context for whoever/whatever executes this — post IDs, skill hints, constraints…"
              value={form.agent_note}
              onChange={(e) => set('agent_note', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="jdp-save-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? 'Saving…' : taskId === 'new' ? 'Create' : 'Save'}
        </button>
      </div>
    </div>
  )
}
