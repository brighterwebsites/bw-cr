import { useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { fmtDate } from '../lib/format'
import { isClosed, stageOrdinal, stageTheme } from '../lib/pipeline'
import ProjectDetailPanel from '../features/projects/ProjectDetailPanel'

type Filter = 'all' | 'active' | 'stale' | number

const STALE_DAYS = 21

export default function PipelinePage() {
  const { projects, customers, stages, loading, error } = useData()
  const [filter, setFilter] = useState<Filter>('active')
  const [openId, setOpenId] = useState<number | null>(null)

  const columns = stages

  const counts = useMemo(() => {
    const byStage: Record<number, number> = {}
    for (const s of stages) byStage[s.stage] = 0
    for (const p of projects) {
      byStage[p.stage] = (byStage[p.stage] ?? 0) + 1
    }
    return {
      total: projects.length,
      active: projects.filter((p) => !isClosed(p.stage)).length,
      closed: projects.filter((p) => isClosed(p.stage)).length,
      byStage,
    }
  }, [projects, stages])

  const custMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])

  const filtered = useMemo(() => {
    const now = Date.now()
    return projects.filter((p) => {
      if (filter === 'active') return !isClosed(p.stage)
      if (filter === 'all') return true
      if (filter === 'stale') {
        return !isClosed(p.stage) && now - new Date(p.updated_at).getTime() > STALE_DAYS * 864e5
      }
      return p.stage === filter
    })
  }, [projects, filter])

  if (loading) return <div className="page-pad">Loading pipeline…</div>
  if (error) return <div className="page-pad page-error">{error}</div>

  const statItems: { key: Filter; label: string; n: number; color?: string }[] = [
    { key: 'active', label: 'Active', n: counts.active },
    ...stages
      .filter((s) => s.stage !== 7)
      .map((s) => ({
        key: s.stage as Filter,
        label: s.stage_name,
        n: counts.byStage[s.stage] ?? 0,
        color: stageTheme(s.stage).color,
      })),
    { key: 7, label: 'Closed', n: counts.closed, color: stageTheme(7).color },
  ]

  return (
    <div className="pipeline-page">
      <div className="stat-bar">
        {statItems.map(({ key, label, n, color }) => (
          <button
            key={String(key)}
            type="button"
            className={`stat-card ${filter === key ? 'stat-card-on' : ''}`}
            onClick={() => setFilter(key)}
          >
            <span className="stat-number" style={color ? { color } : undefined}>
              {n}
            </span>
            <span className="stat-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="quick-filters">
        <span>Show:</span>
        {(
          [
            ['active', 'Active projects'],
            ['all', 'All'],
            ['stale', '🕐 Stale'],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={String(f)}
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
          {filtered.length === 0 ? (
            <div className="pipeline-empty">
              <p>No projects match this filter.</p>
              <p className="muted">Seed customers and projects in Supabase to populate the board.</p>
            </div>
          ) : (
            <table className="pipeline-table">
              <thead>
                <tr>
                  <th className="p-th-left">
                    {filtered.length} project{filtered.length !== 1 ? 's' : ''}
                  </th>
                  {columns.map((col) => {
                    const theme = stageTheme(col.stage)
                    return (
                      <th
                        key={`${col.stage}-${col.step}`}
                        className="p-stage-header"
                        style={{
                          borderBottom: `2px solid ${theme.color}`,
                          color: theme.text,
                          background: theme.light,
                        }}
                      >
                        {col.stage_name}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const cust = custMap.get(p.customer_id)
                  const closed = isClosed(p.stage)
                  const selected = p.id === openId
                  const dotCol = stageOrdinal(p.stage, p.step, stages)
                  const theme = stageTheme(p.stage)
                  const date = fmtDate(p.deadline) || fmtDate(p.start_on)

                  return (
                    <tr key={p.id} className={`p-row ${closed ? 'p-row-closed' : ''}`}>
                      <td
                        className={`p-job-left ${selected ? 'p-job-left-on' : ''}`}
                        onClick={() => setOpenId(selected ? null : p.id)}
                      >
                        <div className="p-job-name">{p.name}</div>
                        <div className="p-job-loc">{cust?.business_name ?? `Customer #${p.customer_id}`}</div>
                        {p.system_description && (
                          <div className="p-job-desc">{p.system_description}</div>
                        )}
                        {(cust?.phone || cust?.email) && (
                          <div className="p-job-contact">
                            {cust.phone && <span>{cust.phone}</span>}
                            {cust.email && <span>{cust.email}</span>}
                          </div>
                        )}
                      </td>
                      {columns.map((col, colIdx) => {
                        const isThisCol = colIdx === dotCol
                        const colTheme = stageTheme(col.stage)
                        return (
                          <td
                            key={`${p.id}-${col.stage}-${col.step}`}
                            className="p-dot-cell"
                            style={{
                              background: colIdx < dotCol ? `${colTheme.light}80` : undefined,
                            }}
                            onClick={() => isThisCol && setOpenId(selected ? null : p.id)}
                          >
                            {isThisCol && (
                              <div
                                className="p-dot"
                                style={{ background: theme.color }}
                                title={`${p.name} — ${col.stage_name}`}
                              >
                                {date && <span className="p-dot-date">{date}</span>}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={`pipeline-detail-panel ${openId !== null ? 'panel-is-open' : ''}`}>
          {openId !== null && (
            <ProjectDetailPanel projectId={openId} onClose={() => setOpenId(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
