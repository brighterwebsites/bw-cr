import { useCallback, useEffect, useState } from 'react'
import { useData } from '../../lib/data'
import type { Asset, CompetitorInput, CompetitorRunWithSnapshots } from '../../lib/pipeline'

const SEARCH_MARKETS = [
  { code: 2036, name: 'Australia', lang: 'en' },
  { code: 2840, name: 'United States', lang: 'en' },
  { code: 2826, name: 'United Kingdom', lang: 'en' },
] as const

const emptyCompetitor = (): CompetitorInput => ({
  business_name: '',
  url: '',
  location: '',
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtNum(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('en-AU')
}

function competitorsFromRun(run: CompetitorRunWithSnapshots): CompetitorInput[] {
  const raw = run.competitor_inputs
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((c) => {
      const row = c as Record<string, unknown>
      return {
        business_name: String(row.business_name ?? ''),
        url: String(row.url ?? ''),
        location: String(row.location ?? ''),
      }
    })
  }
  return run.competitor_snapshots
    .filter((s) => s.type === 'competitor')
    .map((s) => ({
      business_name: s.business_name,
      url: s.url,
      location: s.location ?? '',
    }))
}

export function CompetitorSnapshotsSection({
  asset,
  onRunPanelChange,
}: {
  asset: Asset
  onRunPanelChange?: (open: boolean) => void
}) {
  const { fetchCompetitorRunsForAsset, createCompetitorRun, executeCompetitorRun } = useData()
  const [open, setOpen] = useState(false)
  const [runs, setRuns] = useState<CompetitorRunWithSnapshots[]>([])
  const [loadingRuns, setLoadingRuns] = useState(false)
  const [runErr, setRunErr] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)

  const [marketIdx, setMarketIdx] = useState(0)
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([
    emptyCompetitor(),
    emptyCompetitor(),
  ])
  const [submitting, setSubmitting] = useState(false)
  const [executingRunId, setExecutingRunId] = useState<number | null>(null)
  const [formErr, setFormErr] = useState<string | null>(null)

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true)
    setRunErr(null)
    try {
      const rows = await fetchCompetitorRunsForAsset(asset.id)
      setRuns(rows)
    } catch (e) {
      setRunErr(e instanceof Error ? e.message : 'Failed to load runs')
    } finally {
      setLoadingRuns(false)
    }
  }, [asset.id, fetchCompetitorRunsForAsset])

  useEffect(() => {
    if (!open) return
    void loadRuns()
  }, [open, loadRuns])

  useEffect(() => {
    setSelectedRunId(null)
    setCompetitors([emptyCompetitor(), emptyCompetitor()])
    setFormErr(null)
    setOpen(false)
  }, [asset.id])

  useEffect(() => {
    onRunPanelChange?.(selectedRunId != null)
  }, [selectedRunId, onRunPanelChange])

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null
  const market = SEARCH_MARKETS[marketIdx] ?? SEARCH_MARKETS[0]

  function setCompetitor(idx: number, patch: Partial<CompetitorInput>) {
    setCompetitors((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  async function runAgain(source: CompetitorRunWithSnapshots) {
    const competitors = competitorsFromRun(source)
    if (competitors.length === 0) {
      setRunErr('No competitors found on this run to copy.')
      return
    }
    setExecutingRunId(source.id)
    setRunErr(null)
    try {
      const run = await createCompetitorRun({
        asset_id: asset.id,
        asset_name: asset.name || 'Target',
        asset_url: asset.asset_url,
        search_location_code: source.search_location_code,
        search_location_name: source.search_location_name,
        search_language_code: source.search_language_code,
        competitors,
      })
      setSelectedRunId(run.id)
      setExecutingRunId(run.id)
      await executeCompetitorRun(run.id)
      await loadRuns()
    } catch (e) {
      setRunErr(e instanceof Error ? e.message : 'Analysis failed')
      await loadRuns()
    } finally {
      setExecutingRunId(null)
    }
  }

  async function runAnalysis(runId: number) {
    setExecutingRunId(runId)
    setRunErr(null)
    try {
      await executeCompetitorRun(runId)
      await loadRuns()
      setSelectedRunId(runId)
    } catch (e) {
      setRunErr(e instanceof Error ? e.message : 'Analysis failed')
      await loadRuns()
    } finally {
      setExecutingRunId(null)
    }
  }

  async function handleRunNew() {
    const filled = competitors.filter((c) => c.business_name.trim() || c.url.trim())
    if (filled.length === 0) {
      setFormErr('Add at least one competitor (name or URL).')
      return
    }
    for (const c of filled) {
      if (!c.business_name.trim() || !c.url.trim()) {
        setFormErr('Each competitor needs both name and URL.')
        return
      }
    }
    if (filled.length > 4) {
      setFormErr('Maximum 4 competitors per run.')
      return
    }
    if (!asset.asset_url.trim()) {
      setFormErr('Asset URL is required as the analysis target.')
      return
    }

    setSubmitting(true)
    setFormErr(null)
    try {
      const run = await createCompetitorRun({
        asset_id: asset.id,
        asset_name: asset.name || 'Target',
        asset_url: asset.asset_url,
        search_location_code: market.code,
        search_location_name: market.name,
        search_language_code: market.lang,
        competitors: filled,
      })
      setCompetitors([emptyCompetitor(), emptyCompetitor()])
      await runAnalysis(run.id)
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Failed to run analysis')
    } finally {
      setSubmitting(false)
    }
  }

  const isBusy = submitting || executingRunId != null

  return (
    <>
      <div className="jdp-section">
        <button
          type="button"
          className={`jdp-accordion-toggle ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span>Competitor snapshots</span>
          <span className="jdp-accordion-chevron">{open ? '▾' : '▸'}</span>
        </button>
        {open && (
          <div className="jdp-accordion-body">
            <div className="jdp-section-title" style={{ marginTop: 0 }}>
              New analysis
            </div>
            <div className="jdp-2col">
              <div className="jdp-field">
                <span className="jdp-label">Target URL</span>
                <div className="jdp-readonly">{asset.asset_url || '—'}</div>
              </div>
              <div className="jdp-field">
                <span className="jdp-label">Search market</span>
                <select
                  className="jdp-input"
                  value={marketIdx}
                  onChange={(e) => setMarketIdx(Number(e.target.value))}
                >
                  {SEARCH_MARKETS.map((m, i) => (
                    <option key={m.code} value={i}>
                      {m.name} ({m.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="competitor-form-grid">
              {competitors.map((c, idx) => (
                <div key={idx} className="competitor-form-row">
                  <span className="competitor-form-label">Competitor {idx + 1}</span>
                  <input
                    className="jdp-input"
                    placeholder="Business name"
                    value={c.business_name}
                    onChange={(e) => setCompetitor(idx, { business_name: e.target.value })}
                  />
                  <input
                    className="jdp-input"
                    placeholder="URL"
                    value={c.url}
                    onChange={(e) => setCompetitor(idx, { url: e.target.value })}
                  />
                  <input
                    className="jdp-input"
                    placeholder="Location (optional)"
                    value={c.location}
                    onChange={(e) => setCompetitor(idx, { location: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {competitors.length < 4 && (
              <button
                type="button"
                className="btn btn-gray btn-sm"
                style={{ marginTop: 8 }}
                onClick={() =>
                  setCompetitors((prev) =>
                    prev.length < 4 ? [...prev, emptyCompetitor()] : prev,
                  )
                }
              >
                + Add competitor
              </button>
            )}

            {formErr && (
              <div className="login-error" style={{ marginTop: 8 }}>
                {formErr}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isBusy}
                onClick={() => void handleRunNew()}
              >
                {submitting
                  ? 'Creating…'
                  : executingRunId != null
                    ? 'Pulling DataForSEO…'
                    : 'Run analysis'}
              </button>
            </div>

            <div className="jdp-section-title" style={{ marginTop: 20 }}>
              Run history
            </div>
            {runErr && <div className="login-error">{runErr}</div>}
            {loadingRuns && <div className="mutedtext">Loading runs…</div>}
            {!loadingRuns && runs.length === 0 && (
              <div className="panel-empty-actions">No competitor runs yet.</div>
            )}
            {!loadingRuns && runs.length > 0 && (
              <table className="table panel-mini-table competitor-runs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Market</th>
                    <th>Competitors</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const compCount = run.competitor_snapshots.filter(
                      (s) => s.type === 'competitor',
                    ).length
                    return (
                      <tr
                        key={run.id}
                        className={
                          selectedRunId === run.id ? 'competitor-run-row-on' : 'competitor-run-row'
                        }
                        onClick={() => setSelectedRunId(run.id)}
                      >
                        <td>{formatDate(run.created_at)}</td>
                        <td>
                          {run.search_location_name} ({run.search_language_code})
                        </td>
                        <td>{compCount}</td>
                        <td>
                          <RunStatusChip status={run.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {selectedRun && (
        <div className="competitor-run-panel">
          <div className="detail-panel">
            <div className="detail-header">
              <button
                type="button"
                className="detail-close"
                onClick={() => setSelectedRunId(null)}
              >
                ×
              </button>
              <h2>Run #{selectedRun.id}</h2>
              <div className="mutedtext">
                {formatDate(selectedRun.created_at)} · {selectedRun.search_location_name} (
                {selectedRun.search_language_code})
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <RunStatusChip status={selectedRun.status} />
                {(selectedRun.status === 'pending' || selectedRun.status === 'failed') && (
                  <button
                    type="button"
                    className="btn btn-gray btn-sm"
                    disabled={isBusy}
                    onClick={() => void runAnalysis(selectedRun.id)}
                  >
                    {executingRunId === selectedRun.id ? 'Pulling…' : 'Run now'}
                  </button>
                )}
                {selectedRun.status === 'done' && (
                  <button
                    type="button"
                    className="btn btn-gray btn-sm"
                    disabled={isBusy}
                    onClick={() => void runAgain(selectedRun)}
                  >
                    {executingRunId === selectedRun.id ? 'Pulling…' : 'Run again'}
                  </button>
                )}
                {selectedRun.error_message && (
                  <span className="login-error" style={{ marginLeft: 8 }}>
                    {selectedRun.error_message}
                  </span>
                )}
              </div>
            </div>

            <table className="table panel-mini-table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Business</th>
                  <th>URL</th>
                  <th>Domain rank</th>
                  <th>Organic traffic</th>
                  <th>Top 10 kw</th>
                  <th>Kw gaps</th>
                  <th>Backlinks</th>
                </tr>
              </thead>
              <tbody>
                {[...selectedRun.competitor_snapshots]
                  .sort((a, b) => {
                    if (a.type === 'target') return -1
                    if (b.type === 'target') return 1
                    return a.business_name.localeCompare(b.business_name)
                  })
                  .map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className={`competitor-type-chip competitor-type-${s.type}`}>
                          {s.type}
                        </span>
                      </td>
                      <td>{s.business_name}</td>
                      <td className="competitor-url-cell">{s.url || '—'}</td>
                      <td>{fmtNum(s.domain_rank)}</td>
                      <td>{fmtNum(s.organic_traffic)}</td>
                      <td>{fmtNum(s.top_10_keywords)}</td>
                      <td>{fmtNum(s.keyword_gaps)}</td>
                      <td>{fmtNum(s.backlinks)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function RunStatusChip({ status }: { status: CompetitorRunWithSnapshots['status'] }) {
  return <span className={`run-status run-status-${status}`}>{status}</span>
}
