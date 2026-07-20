import { useEffect, useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { useAppNav } from '../lib/nav'
import { fmtDate } from '../lib/format'
import type { Task } from '../lib/pipeline'
import TaskDetailPanel from '../features/tasks/TaskDetailPanel'

type TaskStatus = Task['status']
type TaskType = Task['task_type']

type Filter =
  | 'all'
  | 'current'
  | TaskType
  | 'due_today'
  | 'due_week'
  | 'overdue'

const TYPE_ICON: Record<TaskType, string> = {
  task: '✓',
  agent_task: '⚡',
  internal: '⚙',
}

const TYPE_TITLE: Record<TaskType, string> = {
  task: 'Task',
  agent_task: 'Agent task',
  internal: 'Internal',
}

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** End of local calendar week (Sunday), inclusive. */
function endOfWeekIso(from = todayIso()) {
  const [y, m, d] = from.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const day = dt.getDay() // 0 Sun
  const add = day === 0 ? 0 : 7 - day
  dt.setDate(dt.getDate() + add)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function isCompleted(t: Task) {
  return t.status === 'completed'
}

function dueTone(t: Task, today: string): 'none' | 'overdue' | 'today' | 'on_track' {
  if (!t.due_on || isCompleted(t)) return 'none'
  if (t.due_on < today) return 'overdue'
  if (t.due_on === today) return 'today'
  return 'on_track'
}

export default function TasksPage() {
  const { tasks, projects, assets, loading, error, updateTask } = useData()
  const { tasksIntent, consumeTasksIntent } = useAppNav()
  const [filter, setFilter] = useState<Filter>('current')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<number | 'new' | null>(null)

  useEffect(() => {
    if (!tasksIntent) return
    setSearch(tasksIntent.search)
    setFilter(tasksIntent.filter ?? 'all')
    setOpenId(null)
    consumeTasksIntent()
  }, [tasksIntent, consumeTasksIntent])

  const today = todayIso()
  const weekEnd = endOfWeekIso(today)

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks
      .filter((t) => {
        if (filter === 'current') return !isCompleted(t)
        if (filter === 'all') return true
        if (filter === 'task' || filter === 'agent_task' || filter === 'internal') {
          return t.task_type === filter
        }
        if (filter === 'due_today') {
          return !isCompleted(t) && t.due_on === today
        }
        if (filter === 'due_week') {
          return !isCompleted(t) && !!t.due_on && t.due_on >= today && t.due_on <= weekEnd
        }
        if (filter === 'overdue') {
          return !isCompleted(t) && !!t.due_on && t.due_on < today
        }
        return true
      })
      .filter((t) => {
        if (!q) return true
        const asset = t.asset_id != null ? assetById.get(t.asset_id) : undefined
        const project = t.project_id != null ? projectById.get(t.project_id) : undefined
        const hay = `${t.title} ${t.assigned_to} ${asset?.name ?? ''} ${asset?.asset_url ?? ''} ${project?.name ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => {
        const ad = a.due_on ?? '9999'
        const bd = b.due_on ?? '9999'
        if (ad !== bd) return ad.localeCompare(bd)
        return a.title.localeCompare(b.title)
      })
  }, [tasks, filter, search, today, weekEnd, assetById, projectById])

  async function onStatusChange(id: number, status: TaskStatus) {
    try {
      await updateTask(id, { status })
    } catch {
      /* refresh will leave prior state; panel can show errors on full save */
    }
  }

  if (loading) return <div className="page-pad">Loading tasks…</div>
  if (error) return <div className="page-pad page-error">{error}</div>

  const scopeFilters: [Filter, string][] = [
    ['all', 'All'],
    ['current', 'Current'],
    ['task', 'Task'],
    ['agent_task', 'Agent'],
    ['internal', 'Internal'],
  ]

  const dueFilters: [Filter, string][] = [
    ['due_today', 'Due today'],
    ['due_week', 'This week'],
    ['overdue', 'Overdue'],
  ]

  return (
    <div className="pipeline-page">
      <div className="filter-row">
        <input
          placeholder="Search title, asset, project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={() => setOpenId('new')}>
          + Add new
        </button>
      </div>

      <div className="quick-filters">
        <span>Show:</span>
        {scopeFilters.map(([f, label]) => (
          <button
            key={f}
            type="button"
            className={`fbtn ${filter === f ? 'fbtn-on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {label}
          </button>
        ))}
        <span className="filter-gap" aria-hidden />
        {dueFilters.map(([f, label]) => (
          <button
            key={f}
            type="button"
            className={`fbtn ${filter === f ? 'fbtn-on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pipeline-content">
        <div className="pipeline-grid-wrap">
          <div className="card table-wrap">
            <table className="table tasks-table">
              <thead>
                <tr>
                  <th className="th-left">Task</th>
                  <th className="th-left">Asset / Project</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const asset = t.asset_id != null ? assetById.get(t.asset_id) : undefined
                  const project = t.project_id != null ? projectById.get(t.project_id) : undefined
                  const selected = t.id === openId
                  const tone = dueTone(t, today)
                  return (
                    <tr
                      key={t.id}
                      className={`p-row ${selected ? 'task-row-on' : ''} ${isCompleted(t) ? 'task-row-done' : ''}`}
                      onClick={() => setOpenId(selected ? null : t.id)}
                    >
                      <td className="td-left">
                        <strong>{t.title}</strong>
                        {t.assigned_to && (
                          <div className="mutedtext">{t.assigned_to}</div>
                        )}
                      </td>
                      <td className="td-left">
                        <div className="stack-cell">
                          <span>{asset?.name || asset?.asset_url || '—'}</span>
                          {project && <span className="mutedtext">{project.name}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="type-icon" title={TYPE_TITLE[t.task_type]}>
                          {TYPE_ICON[t.task_type]}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="table-inline-select"
                          value={t.status}
                          onChange={(e) => void onStatusChange(t.id, e.target.value as TaskStatus)}
                        >
                          <option value="not_started">not started</option>
                          <option value="in_progress">in progress</option>
                          <option value="blocked">blocked</option>
                          <option value="completed">completed</option>
                        </select>
                      </td>
                      <td>
                        <div className="due-cell">
                          <span>{t.due_on ? fmtDate(t.due_on) : '—'}</span>
                          {tone === 'overdue' && <span className="due-badge due-overdue">overdue</span>}
                          {tone === 'today' && <span className="due-badge due-today">today</span>}
                          {tone === 'on_track' && <span className="due-badge due-on-track">on track</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      No tasks match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`pipeline-detail-panel ${openId !== null ? 'panel-is-open' : ''}`}>
          {openId !== null && (
            <TaskDetailPanel
              taskId={openId}
              onClose={() => setOpenId(null)}
              onCreated={(id) => setOpenId(id)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
