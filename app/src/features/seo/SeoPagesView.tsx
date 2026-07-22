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
  pageMetricsMap,
} from '../../lib/seo'

type SortKey = 'impressions' | 'clicks' | 'ctr' | 'avg_position'

export function SeoPagesView() {
  const {
    assets,
    assetPages,
    pageMetrics,
    loading,
    syncWpPages,
    pullGscPageMetrics,
    updateAssetPagePriority,
  } = useData()
  const { openAssetRecord } = useAppNav()
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null)

  const monitored = useMemo(
    () => assets.filter(isSeoMonitoredAsset).sort((a, b) => a.name.localeCompare(b.name)),
    [assets],
  )
  const monitoredIds = useMemo(() => monitored.map((a) => a.id), [monitored])
  const assetNameById = useMemo(
    () => new Map(monitored.map((a) => [a.id, a.name])),
    [monitored],
  )

  const metricsByPage = useMemo(() => pageMetricsMap(pageMetrics), [pageMetrics])

  const visible = useMemo(() => {
    let rows = assetPages
    if (filter !== 'all') rows = rows.filter((p) => p.asset_id === filter)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (p) =>
          p.url_path.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.topic_slug.toLowerCase().includes(q) ||
          p.cluster_slug.toLowerCase().includes(q),
      )
    }

    if (!sort) {
      return [...rows].sort((a, b) => {
        const assetCmp = (assetNameById.get(a.asset_id) ?? '').localeCompare(
          assetNameById.get(b.asset_id) ?? '',
        )
        if (assetCmp !== 0) return assetCmp
        return a.url_path.localeCompare(b.url_path)
      })
    }

    const metricKey = sort.key
    return [...rows].sort((a, b) => {
      const av = Number(metricsByPage.get(a.id)?.[metricKey] ?? -1)
      const bv = Number(metricsByPage.get(b.id)?.[metricKey] ?? -1)
      return sort.dir === 'asc' ? av - bv : bv - av
    })
  }, [assetPages, filter, search, assetNameById, sort, metricsByPage])

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) {
        // Position: lower is better, so default ascending; others default descending.
        return { key, dir: key === 'avg_position' ? 'asc' : 'desc' }
      }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  function sortIndicator(key: SortKey) {
    if (!sort || sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  const connectedCount = useMemo(
    () =>
      monitored.filter((a) => a.wp_cli_status === 'connected').length,
    [monitored],
  )

  async function handleSync() {
    setSyncing(true)
    setErr(null)
    setMsg(null)
    try {
      const count = await syncWpPages(filter === 'all' ? undefined : filter)
      setMsg(`Synced ${count} page(s) from WordPress`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className="page-pad">Loading pages…</div>

  return (
    <div className="seo-page">
      <div className="seo-page-head">
        <div>
          <h1 className="seo-page-title">Pages</h1>
          <p className="seo-page-sub">
            Managed pages from WordPress. GSC metrics attach on opportunity scan (managed URLs only).
          </p>
        </div>
        <div className="seo-page-head-actions">
          <button
            type="button"
            className="btn btn-gray"
            disabled={syncing || connectedCount === 0}
            onClick={() => void handleSync()}
          >
            {syncing ? 'Syncing…' : 'Sync from WordPress'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={syncing}
            onClick={() =>
              void (async () => {
                setSyncing(true)
                setErr(null)
                setMsg(null)
                try {
                  const count = await pullGscPageMetrics(filter === 'all' ? undefined : filter)
                  setMsg(`GSC metrics pulled for ${count} page(s)`)
                } catch (e) {
                  setErr(e instanceof Error ? e.message : 'GSC pull failed')
                } finally {
                  setSyncing(false)
                }
              })()
            }
          >
            {syncing ? 'Working…' : 'Pull GSC metrics'}
          </button>
        </div>
      </div>

      {err && <div className="login-error seo-page-error">{err}</div>}
      {msg && <div className="login-ok seo-page-error">{msg}</div>}

      <AssetFilterBar
        assets={monitored}
        selected={filter}
        onSelect={setFilter}
        monitoredIds={monitoredIds}
      />

      <div className="seo-pages-toolbar">
        <input
          className="jdp-input seo-pages-search"
          placeholder="Search path, title, topic, cluster…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="mutedtext seo-pages-count">
          {visible.length} page{visible.length === 1 ? '' : 's'}
        </span>
      </div>

      {visible.length > 0 ? (
        <div className="card seo-pages-table-wrap">
          <table className="seo-pages-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Path</th>
                <th>Title</th>
                <th className="seo-th-sortable" onClick={() => toggleSort('impressions')}>
                  Impr.{sortIndicator('impressions')}
                </th>
                <th className="seo-th-sortable" onClick={() => toggleSort('clicks')}>
                  Clicks{sortIndicator('clicks')}
                </th>
                <th className="seo-th-sortable" onClick={() => toggleSort('ctr')}>
                  CTR{sortIndicator('ctr')}
                </th>
                <th className="seo-th-sortable" onClick={() => toggleSort('avg_position')}>
                  Pos.{sortIndicator('avg_position')}
                </th>
                <th>Pri.</th>
                <th>Next step</th>
                <th>Index</th>
                <th>Topic</th>
                <th>Cluster</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const m = metricsByPage.get(p.id)
                return (
                <tr key={p.id}>
                  <td>
                    <button
                      type="button"
                      className="btn-link seo-pages-asset-link"
                      onClick={() => openAssetRecord(p.asset_id)}
                    >
                      <span
                        className="seo-dot"
                        style={{
                          background: assetDotColor(p.asset_id, monitoredIds),
                        }}
                      />
                      {assetNameById.get(p.asset_id) ?? `#${p.asset_id}`}
                    </button>
                  </td>
                  <td className="seo-pages-path">{p.url_path}</td>
                  <td>{p.title || '—'}</td>
                  <td>{m ? fmtInt(m.impressions) : '—'}</td>
                  <td>{m ? fmtInt(m.clicks) : '—'}</td>
                  <td>{m ? fmtCtr(m.ctr) : '—'}</td>
                  <td>{m ? fmtRank(m.avg_position) : '—'}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={p.is_priority}
                      aria-label={`Priority: ${p.title}`}
                      onChange={(e) =>
                        void updateAssetPagePriority(p.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{p.scos_next_step || '—'}</td>
                  <td>{p.scos_index_status || '—'}</td>
                  <td>{p.topic_slug || '—'}</td>
                  <td>{p.cluster_slug || '—'}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="seo-empty card">
          <p>No managed pages yet.</p>
          <ul className="seo-empty-list">
            <li>
              Connect WordPress on each asset under <strong>Assets → Integrations</strong>
            </li>
            <li>
              Click <strong>Sync pages</strong> on the asset, or{' '}
              <strong>Sync from WordPress</strong> above
            </li>
          </ul>
          {connectedCount === 0 && (
            <p className="mutedtext">No WordPress connections yet ({monitored.length} managed sites).</p>
          )}
        </div>
      )}
    </div>
  )
}
