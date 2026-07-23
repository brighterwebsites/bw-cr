import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import { useAppNav } from '../../lib/nav'
import { AssetFilterBar } from './AssetFilterBar'
import type { AssetPage } from '../../lib/seo'
import {
  assetDotColor,
  fmtCtr,
  fmtInt,
  fmtRank,
  isSeoMonitoredAsset,
  OPPORTUNITY_TYPE_LABEL,
  type SeoOpportunity,
} from '../../lib/seo'

type PriorityFilter = 'all' | 'high' | 'medium' | 'low'

const PRIORITY_FILTERS: { id: PriorityFilter; label: string }[] = [
  { id: 'all', label: 'All priorities' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

export function SeoOpportunitiesView() {
  const {
    assets,
    assetPages,
    seoOpportunities,
    loading,
    runSeoScan,
    dismissSeoOpportunity,
    createTasksFromOpportunities,
  } = useData()
  const { openAssetRecord } = useAppNav()
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [scanning, setScanning] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [batching, setBatching] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const monitored = useMemo(
    () => assets.filter(isSeoMonitoredAsset).sort((a, b) => a.name.localeCompare(b.name)),
    [assets],
  )
  const monitoredIds = useMemo(() => monitored.map((a) => a.id), [monitored])
  const assetNameById = useMemo(
    () => new Map(monitored.map((a) => [a.id, a.name])),
    [monitored],
  )
  const pageById = useMemo(
    () => new Map(assetPages.map((p) => [p.id, p])),
    [assetPages],
  )

  const visible = useMemo(() => {
    let rows = seoOpportunities.filter((o) => o.status === 'open' || o.status === 'task_created')
    if (filter !== 'all') rows = rows.filter((o) => o.asset_id === filter)
    if (priorityFilter !== 'all') rows = rows.filter((o) => o.priority === priorityFilter)
    return [...rows].sort((a, b) => Number(b.impressions) - Number(a.impressions))
  }, [seoOpportunities, filter, priorityFilter])

  const openVisible = useMemo(() => visible.filter((o) => o.status === 'open'), [visible])

  // Drop selections that scrolled out of view/filter so the count stays accurate.
  useEffect(() => {
    setSelected((prev) => {
      const openIds = new Set(openVisible.map((o) => o.id))
      const next = new Set([...prev].filter((id) => openIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [openVisible])

  const selectedGroupCount = useMemo(() => {
    const groups = new Set<string>()
    for (const opp of visible) {
      if (!selected.has(opp.id)) continue
      const postType = pageById.get(opp.asset_page_id)?.wp_post_type || 'page'
      groups.add(`${opp.asset_id}::${opp.opportunity_type}::${postType}`)
    }
    return groups.size
  }, [visible, selected, pageById])

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === openVisible.length ? new Set() : new Set(openVisible.map((o) => o.id)),
    )
  }

  async function handleCreateTasks() {
    setBatching(true)
    setErr(null)
    setMsg(null)
    try {
      const created = await createTasksFromOpportunities([...selected])
      setMsg(`Created ${created} task${created === 1 ? '' : 's'} from ${selected.size} opportunit${selected.size === 1 ? 'y' : 'ies'}`)
      setSelected(new Set())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Task creation failed')
    } finally {
      setBatching(false)
    }
  }

  async function handleScan() {
    setScanning(true)
    setErr(null)
    setMsg(null)
    try {
      const result = await runSeoScan(filter === 'all' ? undefined : filter)
      setMsg(
        `Scan complete — ${result.pagesUpdated} page metrics, ${result.oppsCreated} new opps, ${result.oppsUpdated} updated`,
      )
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function runRowAction(id: number, fn: () => Promise<void>) {
    setBusyId(id)
    setErr(null)
    try {
      await fn()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="page-pad">Loading opportunities…</div>

  return (
    <div className="seo-page">
      <div className="seo-page-head">
        <div>
          <h1 className="seo-page-title">Opportunities</h1>
          <p className="seo-page-sub">
            Rule-based pipeline from GSC page metrics on managed WordPress pages only.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={scanning}
          onClick={() => void handleScan()}
        >
          {scanning ? 'Scanning…' : 'Scan opportunities'}
        </button>
      </div>

      {err && <div className="login-error seo-page-error">{err}</div>}
      {msg && <div className="login-ok seo-page-error">{msg}</div>}

      <AssetFilterBar
        assets={monitored}
        selected={filter}
        onSelect={setFilter}
        monitoredIds={monitoredIds}
      />

      <div className="seo-opp-priority-bar">
        {PRIORITY_FILTERS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`fbtn${priorityFilter === p.id ? ' fbtn-on' : ''}`}
            onClick={() => setPriorityFilter(p.id)}
          >
            {p.label}
          </button>
        ))}
        <span className="mutedtext seo-pages-count">
          {visible.length} opportunit{visible.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      <div className="seo-opp-batch-bar">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected.size || batching}
          onClick={() => void handleCreateTasks()}
        >
          {batching
            ? 'Creating…'
            : `Create ${selectedGroupCount || ''} task${selectedGroupCount === 1 ? '' : 's'} from ${selected.size} selected`}
        </button>
        {selected.size > 0 && (
          <button type="button" className="btn-link" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="card seo-pages-table-wrap">
          <table className="seo-pages-table seo-opp-table">
            <thead>
              <tr>
                <th className="seo-opp-select-col">
                  <input
                    type="checkbox"
                    aria-label="Select all open opportunities"
                    checked={openVisible.length > 0 && selected.size === openVisible.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Asset</th>
                <th>Page</th>
                <th>Problem</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Impr.</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Pos.</th>
                <th>Workflow</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <OppRow
                  key={o.id}
                  opp={o}
                  page={pageById.get(o.asset_page_id)}
                  assetName={assetNameById.get(o.asset_id) ?? `#${o.asset_id}`}
                  dotColor={assetDotColor(o.asset_id, monitoredIds)}
                  busy={busyId === o.id}
                  selected={selected.has(o.id)}
                  onToggleSelected={() => toggleSelected(o.id)}
                  onOpenAsset={() => openAssetRecord(o.asset_id)}
                  onDismiss={() =>
                    void runRowAction(o.id, () => dismissSeoOpportunity(o.id))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="seo-empty card">
          <p>No open opportunities yet.</p>
          <ul className="seo-empty-list">
            <li>Connect GSC and WordPress on an asset, sync managed pages</li>
            <li>Click <strong>Scan opportunities</strong> to pull GSC metrics and run rules</li>
          </ul>
        </div>
      )}
    </div>
  )
}

function DismissIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function OppRow({
  opp,
  page,
  assetName,
  dotColor,
  busy,
  selected,
  onToggleSelected,
  onOpenAsset,
  onDismiss,
}: {
  opp: SeoOpportunity
  page: AssetPage | undefined
  assetName: string
  dotColor: string
  busy: boolean
  selected: boolean
  onToggleSelected: () => void
  onOpenAsset: () => void
  onDismiss: () => void
}) {
  const isOpen = opp.status === 'open'
  return (
    <tr>
      <td>
        {isOpen && (
          <input
            type="checkbox"
            aria-label={`Select opportunity on ${page?.url_path ?? 'page'}`}
            checked={selected}
            onChange={onToggleSelected}
          />
        )}
      </td>
      <td>
        <button type="button" className="btn-link seo-pages-asset-link" onClick={onOpenAsset}>
          <span className="seo-dot" style={{ background: dotColor }} />
          {assetName}
        </button>
      </td>
      <td>
        <div className="seo-titlepath">
          <span className="seo-titlepath-title">{page?.title || '—'}</span>
          <span className="seo-titlepath-path">
            {page?.canonical_url ? (
              <a href={page.canonical_url} target="_blank" rel="noreferrer">
                {page.url_path}
              </a>
            ) : (
              page?.url_path ?? '—'
            )}
          </span>
        </div>
      </td>
      <td className="seo-opp-problem">{opp.problem}</td>
      <td>{OPPORTUNITY_TYPE_LABEL[opp.opportunity_type] ?? opp.opportunity_type}</td>
      <td>
        <span className={`seo-opp-priority seo-opp-priority-${opp.priority}`}>
          {opp.priority}
        </span>
      </td>
      <td>{fmtInt(opp.impressions)}</td>
      <td>{fmtInt(opp.clicks)}</td>
      <td>{fmtCtr(opp.ctr)}</td>
      <td>{fmtRank(opp.avg_position)}</td>
      <td>{opp.recommended_workflow}</td>
      <td>{opp.status}</td>
      <td className="seo-opp-actions">
        {isOpen && (
          <button
            type="button"
            className="seo-opp-icon-btn"
            disabled={busy}
            title="Dismiss (reappears on next sync if still an issue)"
            onClick={onDismiss}
          >
            <DismissIcon />
          </button>
        )}
        {opp.status === 'task_created' && <span className="mutedtext">Task linked</span>}
      </td>
    </tr>
  )
}
