import { useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import { useAppNav } from '../../lib/nav'
import { AssetFilterBar } from './AssetFilterBar'
import {
  assetDotColor,
  fmtCtr,
  fmtCtrDelta,
  fmtDelta,
  fmtInt,
  fmtRank,
  fmtRankDelta,
  isSeoMonitoredAsset,
  latestSnapshotByAsset,
  type MetricsSnapshot,
} from '../../lib/seo'
import type { Asset } from '../../lib/pipeline'

export function SeoPerformanceView() {
  const { assets, metricsSnapshots, loading, refreshMetrics, pullGscMetrics } = useData()
  const { openAssetRecord } = useAppNav()
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const monitored = useMemo(
    () => assets.filter(isSeoMonitoredAsset).sort((a, b) => a.name.localeCompare(b.name)),
    [assets],
  )
  const monitoredIds = useMemo(() => monitored.map((a) => a.id), [monitored])

  const snapshotMap = useMemo(
    () => latestSnapshotByAsset(metricsSnapshots),
    [metricsSnapshots],
  )

  const visible = useMemo(() => {
    if (filter === 'all') return monitored
    return monitored.filter((a) => a.id === filter)
  }, [monitored, filter])

  const cards = visible.filter((a) => {
    const snap = snapshotMap.get(a.id)
    return snap && Number(snap.impressions ?? 0) > 0
  })

  async function handleRefreshAll() {
    setRefreshing(true)
    setErr(null)
    try {
      await pullGscMetrics()
      await refreshMetrics()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) return <div className="page-pad">Loading performance…</div>

  return (
    <div className="seo-page">
      <div className="seo-page-head">
        <div>
          <h1 className="seo-page-title">Performance</h1>
          <p className="seo-page-sub">GSC snapshot vs previous 28 days</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={refreshing}
          onClick={() => void handleRefreshAll()}
        >
          {refreshing ? 'Refreshing…' : 'Refresh GSC'}
        </button>
      </div>

      {err && <div className="login-error seo-page-error">{err}</div>}

      <AssetFilterBar
        assets={monitored}
        selected={filter}
        onSelect={setFilter}
        monitoredIds={monitoredIds}
      />

      {cards.length > 0 ? (
        <div
          className="seo-perf-grid"
          style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, 1fr)` }}
        >
          {cards.map((a) => (
            <PerfCard
              key={a.id}
              asset={a}
              snapshot={snapshotMap.get(a.id)!}
              dotColor={assetDotColor(a.id, monitoredIds)}
              onOpen={() => openAssetRecord(a.id)}
            />
          ))}
        </div>
      ) : (
        <div className="seo-empty card">
          <p>No 28-day GSC snapshots yet for this view.</p>
          <ul className="seo-empty-list">
            <li>Connect GSC on each asset under <strong>Assets → Integrations</strong></li>
            <li>Click <strong>Refresh GSC</strong> above (or refresh per asset)</li>
          </ul>
          {visible.some((a) => a.gsc_status === 'connected') && (
            <p className="mutedtext">Connected sites may need a manual refresh to populate data.</p>
          )}
        </div>
      )}

      {visible.length > cards.length && cards.length > 0 && (
        <p className="seo-perf-hint mutedtext">
          {visible.length - cards.length} site(s) hidden — no impression data or not connected.
        </p>
      )}
    </div>
  )
}

function PerfCard({
  asset,
  snapshot,
  dotColor,
  onOpen,
}: {
  asset: Asset
  snapshot: MetricsSnapshot
  dotColor: string
  onOpen: () => void
}) {
  const metrics = [
    {
      label: 'Clicks',
      value: fmtInt(snapshot.clicks),
      delta: fmtDelta(snapshot.clicks_delta),
      good: Number(snapshot.clicks_delta ?? 0) >= 0,
    },
    {
      label: 'Impressions',
      value: fmtInt(snapshot.impressions),
      delta: fmtDelta(snapshot.impressions_delta),
      good: Number(snapshot.impressions_delta ?? 0) >= 0,
    },
    {
      label: 'CTR',
      value: fmtCtr(snapshot.ctr),
      delta: fmtCtrDelta(snapshot.ctr_delta),
      good: Number(snapshot.ctr_delta ?? 0) >= 0,
    },
    {
      label: 'Avg rank',
      value: fmtRank(snapshot.avg_rank),
      delta: fmtRankDelta(snapshot.avg_rank_delta),
      good: Number(snapshot.avg_rank_delta ?? 0) <= 0,
    },
  ]

  return (
    <button type="button" className="seo-perf-card card" onClick={onOpen}>
      <h3 className="seo-perf-card-title">
        <span className="seo-dot" style={{ background: dotColor }} />
        {asset.name}
      </h3>
      <div className="seo-perf-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="seo-perf-metric">
            <div className="seo-perf-label">{m.label}</div>
            <div className="seo-perf-value">{m.value}</div>
            <div className={`seo-perf-delta${m.good ? ' good' : ' bad'}`}>{m.delta}</div>
          </div>
        ))}
      </div>
      <div className="seo-perf-period mutedtext">{snapshot.period_label}</div>
    </button>
  )
}
