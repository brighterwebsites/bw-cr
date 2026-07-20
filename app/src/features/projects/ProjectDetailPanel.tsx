import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import { useAppNav } from '../../lib/nav'
import { fmtDate } from '../../lib/format'
import { stageLabel, stageTheme } from '../../lib/pipeline'
import type { Project, Task } from '../../lib/pipeline'

type ProjectForm = {
  name: string
  customer_id: number | ''
  system_description: string
  notes: string
  proposal: string
  stage: number
  step: number
  start_on: string
  deadline: string
  completed_on: string
}

type MvpForm = {
  business_name: string
  contact_first_name: string
  email: string
  phone: string
}

const BLANK_PROJECT = (stage = 1, step = 0): ProjectForm => ({
  name: '',
  customer_id: '',
  system_description: '',
  notes: '',
  proposal: '',
  stage,
  step,
  start_on: '',
  deadline: '',
  completed_on: '',
})

const BLANK_MVP: MvpForm = {
  business_name: '',
  contact_first_name: '',
  email: '',
  phone: '',
}

function formFromProject(p: Project): ProjectForm {
  return {
    name: p.name,
    customer_id: p.customer_id,
    system_description: p.system_description,
    notes: p.notes,
    proposal: p.proposal,
    stage: p.stage,
    step: p.step,
    start_on: p.start_on ?? '',
    deadline: p.deadline ?? '',
    completed_on: p.completed_on ?? '',
  }
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dueTone(t: Task, today: string): 'none' | 'overdue' | 'today' | 'on_track' {
  if (!t.due_on || t.status === 'completed') return 'none'
  if (t.due_on < today) return 'overdue'
  if (t.due_on === today) return 'today'
  return 'on_track'
}

function urlHref(url: string) {
  if (!url.trim()) return ''
  return url.startsWith('http') ? url : `https://${url}`
}

export default function ProjectDetailPanel({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: number | 'new'
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const {
    projects,
    customers,
    stages,
    tasks,
    assets,
    updateProject,
    createProject,
    createCustomer,
    updateTask,
  } = useData()
  const { openTasksForProject, openAssetRecord } = useAppNav()

  const project = projectId === 'new' ? undefined : projects.find((p) => p.id === projectId)
  const firstStage = stages[0]

  const [form, setForm] = useState<ProjectForm>(() =>
    BLANK_PROJECT(firstStage?.stage ?? 1, firstStage?.step ?? 0),
  )
  const [customerMode, setCustomerMode] = useState<'existing' | 'mvp'>('existing')
  const [mvp, setMvp] = useState<MvpForm>(BLANK_MVP)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [integrationsOpen, setIntegrationsOpen] = useState(false)

  useEffect(() => {
    if (projectId === 'new') {
      setForm(BLANK_PROJECT(firstStage?.stage ?? 1, firstStage?.step ?? 0))
      setCustomerMode('existing')
      setMvp(BLANK_MVP)
    } else if (project) {
      setForm(formFromProject(project))
    }
    setErr(null)
    setOk(false)
    setIntegrationsOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const projectTasks = useMemo(
    () =>
      projectId === 'new'
        ? []
        : tasks
            .filter((t) => t.project_id === projectId)
            .sort((a, b) => {
              const ad = a.due_on ?? '9999'
              const bd = b.due_on ?? '9999'
              return ad.localeCompare(bd)
            }),
    [tasks, projectId],
  )

  const projectAssets = useMemo(
    () => (projectId === 'new' ? [] : assets.filter((a) => a.project_id === projectId)),
    [assets, projectId],
  )

  const today = todayIso()
  const theme = stageTheme(form.stage)

  function set<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onStagePick(stageKey: string) {
    const [stageStr, stepStr] = stageKey.split(':')
    const stage = Number(stageStr)
    const step = Number(stepStr)
    setForm((prev) => ({
      ...prev,
      stage,
      step,
      completed_on: stage === 7 ? prev.completed_on || today : prev.completed_on,
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setErr('Project name is required.')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      if (projectId === 'new') {
        let customerId = form.customer_id
        if (customerMode === 'mvp') {
          if (!mvp.business_name.trim()) {
            setErr('Customer business name is required.')
            setSaving(false)
            return
          }
          const cust = await createCustomer({
            business_name: mvp.business_name.trim(),
            contact_first_name: mvp.contact_first_name,
            email: mvp.email,
            phone: mvp.phone,
            lifecycle: 'lead',
          })
          customerId = cust.id
        } else if (customerId === '') {
          setErr('Select a customer or create an MVP customer.')
          setSaving(false)
          return
        }

        const row = await createProject({
          name: form.name.trim(),
          customer_id: customerId as number,
          system_description: form.system_description,
          notes: form.notes,
          proposal: form.proposal,
          stage: form.stage,
          step: form.step,
          start_on: form.start_on || null,
          deadline: form.deadline || null,
          completed_on: form.stage === 7 ? form.completed_on || today : form.completed_on || null,
        })
        onCreated(row.id)
      } else {
        if (form.customer_id === '') {
          setErr('Customer is required.')
          setSaving(false)
          return
        }
        await updateProject(projectId, {
          name: form.name.trim(),
          customer_id: form.customer_id,
          system_description: form.system_description,
          notes: form.notes,
          proposal: form.proposal,
          stage: form.stage,
          step: form.step,
          start_on: form.start_on || null,
          deadline: form.deadline || null,
          completed_on:
            form.stage === 7 ? form.completed_on || today : form.completed_on || null,
        })
        setOk(true)
        setTimeout(() => setOk(false), 2000)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onTaskStatus(id: number, status: Task['status']) {
    try {
      await updateTask(id, { status })
    } catch {
      /* ignore — list will refresh on next load */
    }
  }

  if (projectId !== 'new' && !project) {
    return (
      <div className="jdp">
        <div className="jdp-header">
          <div className="jdp-title">
            <div className="jdp-name">Project not found</div>
          </div>
          <button type="button" className="jdp-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    )
  }

  const stageKey = `${form.stage}:${form.step}`

  return (
    <div className="jdp">
      <div className="jdp-header">
        <div className="jdp-title">
          <div className="jdp-name">{projectId === 'new' ? 'New project' : form.name || 'Project'}</div>
          {projectId !== 'new' && (
            <span
              className="stage-chip"
              style={{ background: theme.light, color: theme.text, marginTop: 6 }}
            >
              {stageLabel(form.stage, form.step, stages)}
            </span>
          )}
        </div>
        <button type="button" className="jdp-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {err && <div className="login-error" style={{ marginBottom: 8 }}>{err}</div>}
      {ok && <div className="login-ok" style={{ marginBottom: 8 }}>Saved</div>}

      <div className="jdp-section">
        <div className="jdp-section-title">Project</div>
        <div className="jdp-2col">
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Name</span>
            <input
              className="jdp-input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          {projectId === 'new' && (
            <div className="jdp-field jdp-full">
              <span className="jdp-label">Customer</span>
              <div className="seg-toggle">
                <button
                  type="button"
                  className={`seg-btn ${customerMode === 'existing' ? 'seg-btn-on' : ''}`}
                  onClick={() => setCustomerMode('existing')}
                >
                  Assign existing
                </button>
                <button
                  type="button"
                  className={`seg-btn ${customerMode === 'mvp' ? 'seg-btn-on' : ''}`}
                  onClick={() => setCustomerMode('mvp')}
                >
                  Create MVP
                </button>
              </div>
            </div>
          )}

          {(projectId !== 'new' || customerMode === 'existing') && (
            <div className="jdp-field jdp-full">
              <span className="jdp-label">{projectId === 'new' ? 'Select customer' : 'Customer'}</span>
              <select
                className="jdp-input"
                value={form.customer_id === '' ? '' : String(form.customer_id)}
                onChange={(e) =>
                  set('customer_id', e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {projectId === 'new' && customerMode === 'mvp' && (
            <>
              <div className="jdp-field jdp-full">
                <span className="jdp-label">Business name</span>
                <input
                  className="jdp-input"
                  value={mvp.business_name}
                  onChange={(e) => setMvp((m) => ({ ...m, business_name: e.target.value }))}
                />
              </div>
              <div className="jdp-field">
                <span className="jdp-label">Contact first name</span>
                <input
                  className="jdp-input"
                  value={mvp.contact_first_name}
                  onChange={(e) => setMvp((m) => ({ ...m, contact_first_name: e.target.value }))}
                />
              </div>
              <div className="jdp-field">
                <span className="jdp-label">Email</span>
                <input
                  className="jdp-input"
                  value={mvp.email}
                  onChange={(e) => setMvp((m) => ({ ...m, email: e.target.value }))}
                />
              </div>
              <div className="jdp-field">
                <span className="jdp-label">Phone</span>
                <input
                  className="jdp-input"
                  value={mvp.phone}
                  onChange={(e) => setMvp((m) => ({ ...m, phone: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="jdp-field jdp-full">
            <span className="jdp-label">Pipeline stage</span>
            <select
              className="jdp-input"
              value={stageKey}
              onChange={(e) => onStagePick(e.target.value)}
            >
              {stages.map((s) => (
                <option key={`${s.stage}-${s.step}`} value={`${s.stage}:${s.step}`}>
                  {s.stage_name}
                  {s.step_name && s.step_name !== 'Active' ? ` — ${s.step_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="jdp-field">
            <span className="jdp-label">Start</span>
            <input
              className="jdp-input"
              type="date"
              value={form.start_on}
              onChange={(e) => set('start_on', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Deadline</span>
            <input
              className="jdp-input"
              type="date"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />
          </div>
          {form.stage === 7 && (
            <div className="jdp-field">
              <span className="jdp-label">Completed</span>
              <input
                className="jdp-input"
                type="date"
                value={form.completed_on}
                onChange={(e) => set('completed_on', e.target.value)}
              />
            </div>
          )}
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Scope / description</span>
            <textarea
              className="jdp-input jdp-textarea"
              rows={3}
              value={form.system_description}
              onChange={(e) => set('system_description', e.target.value)}
            />
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Proposal</span>
            <textarea
              className="jdp-input jdp-textarea"
              rows={3}
              value={form.proposal}
              onChange={(e) => set('proposal', e.target.value)}
            />
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Notes</span>
            <textarea
              className="jdp-input jdp-textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
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
          {saving ? 'Saving…' : projectId === 'new' ? 'Create project' : 'Save'}
        </button>
      </div>

      {projectId !== 'new' && (
        <>
          <div className="jdp-section">
            <div className="jdp-section-title-row">
              <div className="jdp-section-title" style={{ marginBottom: 0 }}>
                Tasks ({projectTasks.length})
              </div>
              <button
                type="button"
                className="btn btn-gray"
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => openTasksForProject(form.name)}
              >
                Open in Tasks
              </button>
            </div>
            {projectTasks.length === 0 ? (
              <div className="mutedtext" style={{ marginTop: 8 }}>
                No tasks on this project.
              </div>
            ) : (
              <table className="table panel-mini-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="th-left">Title</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((t) => {
                    const tone = dueTone(t, today)
                    return (
                      <tr key={t.id}>
                        <td>
                          <select
                            className="table-inline-select"
                            value={t.status}
                            onChange={(e) =>
                              void onTaskStatus(t.id, e.target.value as Task['status'])
                            }
                          >
                            <option value="not_started">not started</option>
                            <option value="in_progress">in progress</option>
                            <option value="blocked">blocked</option>
                            <option value="completed">completed</option>
                          </select>
                        </td>
                        <td className="td-left">{t.title}</td>
                        <td>
                          <div className="due-cell">
                            <span>{t.due_on ? fmtDate(t.due_on) : '—'}</span>
                            {tone === 'overdue' && (
                              <span className="due-badge due-overdue">overdue</span>
                            )}
                            {tone === 'today' && (
                              <span className="due-badge due-today">today</span>
                            )}
                            {tone === 'on_track' && (
                              <span className="due-badge due-on-track">on track</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="jdp-section">
            <div className="jdp-section-title">Assets ({projectAssets.length})</div>
            {projectAssets.length === 0 ? (
              <div className="mutedtext">No assets with this as current project.</div>
            ) : (
              <table className="table panel-mini-table">
                <thead>
                  <tr>
                    <th className="th-left">Name</th>
                    <th className="th-left">URL</th>
                    <th>Open URL</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {projectAssets.map((a) => (
                    <tr key={a.id}>
                      <td className="td-left">{a.name || '—'}</td>
                      <td className="td-left mutedtext">{a.asset_url || '—'}</td>
                      <td>
                        {a.asset_url ? (
                          <a
                            className="btn-link"
                            href={urlHref(a.asset_url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => openAssetRecord(a.id)}
                        >
                          Open record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="jdp-section">
            <button
              type="button"
              className={`jdp-accordion-toggle ${integrationsOpen ? 'is-open' : ''}`}
              onClick={() => setIntegrationsOpen((o) => !o)}
            >
              <span>Integrations</span>
              <span className="jdp-accordion-chevron">{integrationsOpen ? '▾' : '▸'}</span>
            </button>
            {integrationsOpen && (
              <div className="jdp-accordion-body">
                {projectAssets.length === 0 ? (
                  <div className="mutedtext">
                    Link an asset (set current project) to see connection status here.
                  </div>
                ) : (
                  projectAssets.map((a) => (
                    <div key={a.id} className="integration-asset-block">
                      <div className="integration-asset-name">{a.name || a.asset_url || `Asset #${a.id}`}</div>
                      <div className="jdp-2col">
                        <div className="jdp-field">
                          <span className="jdp-label">Health</span>
                          <div className="jdp-readonly">{a.health_score ?? '—'}</div>
                        </div>
                        <div className="jdp-field">
                          <span className="jdp-label">GSC</span>
                          <div className="jdp-readonly">
                            <span className={`conn-status conn-status-${a.gsc_status}`}>
                              {a.gsc_status}
                            </span>
                          </div>
                        </div>
                        <div className="jdp-field">
                          <span className="jdp-label">GA4</span>
                          <div className="jdp-readonly">
                            <span className={`conn-status conn-status-${a.ga4_status}`}>
                              {a.ga4_status}
                            </span>
                          </div>
                        </div>
                        <div className="jdp-field">
                          <span className="jdp-label">WP CLI</span>
                          <div className="jdp-readonly">
                            <span className={`conn-status conn-status-${a.wp_cli_status}`}>
                              {a.wp_cli_status}
                            </span>
                          </div>
                        </div>
                        <div className="jdp-field">
                          <span className="jdp-label">Hermes</span>
                          <div className="jdp-readonly">{a.hermes_profile || '—'}</div>
                        </div>
                        <div className="jdp-field">
                          <span className="jdp-label">Telegram</span>
                          <div className="jdp-readonly">{a.telegram_topic || '—'}</div>
                        </div>
                        <div className="jdp-field">
                          <span className="jdp-label">Workspace</span>
                          <div className="jdp-readonly">{a.workspace || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
