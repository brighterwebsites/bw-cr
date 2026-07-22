import { useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import { useAppNav } from '../../lib/nav'
import { AssetFilterBar } from './AssetFilterBar'
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
    promoteSeoOpportunityToTask,
  } = useData()
  const { openAssetRecord } = useAppNav()
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [scanning, setScanning] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
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

      {visible.length > 0 ? (
        <div className="card seo-pages-table-wrap">
          <table className="seo-pages-table seo-opp-table">
            <thead>
              <tr>
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
                  assetName={assetNameById.get(o.asset_id) ?? `#${o.asset_id}`}
                  pagePath={pageById.get(o.asset_page_id)?.url_path ?? '—'}
                  dotColor={assetDotColor(o.asset_id, monitoredIds)}
                  busy={busyId === o.id}
                  onOpenAsset={() => openAssetRecord(o.asset_id)}
                  onCreateTask={() =>
                    void runRowAction(o.id, () => promoteSeoOpportunityToTask(o.id))
                  }
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

function OppRow({
  opp,
  assetName,
  pagePath,
  dotColor,
  busy,
  onOpenAsset,
  onCreateTask,
  onDismiss,
}: {
  opp: SeoOpportunity
  assetName: string
  pagePath: string
  dotColor: string
  busy: boolean
  onOpenAsset: () => void
  onCreateTask: () => void
  onDismiss: () => void
}) {
  return (
    <tr>
      <td>
        <button type="button" className="btn-link seo-pages-asset-link" onClick={onOpenAsset}>
          <span className="seo-dot" style={{ background: dotColor }} />
          {assetName}
        </button>
      </td>
      <td className="seo-pages-path">{pagePath}</td>
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
        {opp.status === 'open' && (
          <>
            <button type="button" className="btn-link" disabled={busy} onClick={onCreateTask}>
              Create task
            </button>
            <button type="button" className="btn-link" disabled={busy} onClick={onDismiss}>
              Dismiss
            </button>
          </>
        )}
        {opp.status === 'task_created' && <span className="mutedtext">Task linked</span>}
      </td>
    </tr>
  )
}
