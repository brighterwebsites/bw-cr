import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import type { Asset } from '../../lib/pipeline'
import type { GscConnectionConfig } from '../../lib/seo'

type Props = {
  asset: Asset
  allAssets: Asset[]
}

export function GscIntegrationSection({ asset, allAssets }: Props) {
  const {
    assetConnections,
    startGscOAuth,
    duplicateGscSetup,
    pullGscMetrics,
    refreshMetrics,
    saveGscProperty,
  } = useData()

  const conn = assetConnections.find(
    (c) => c.asset_id === asset.id && c.provider === 'gsc',
  )
  const config = (conn?.config ?? {}) as GscConnectionConfig
  const [property, setProperty] = useState(config.gsc_property ?? '')
  const [dupFrom, setDupFrom] = useState<number | ''>('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setProperty((conn?.config as GscConnectionConfig)?.gsc_property ?? '')
  }, [conn?.id, conn?.config])

  const dupSources = useMemo(
    () =>
      allAssets.filter(
        (a) =>
          a.id !== asset.id &&
          assetConnections.some(
            (c) => c.asset_id === a.id && c.provider === 'gsc' && c.status !== 'disconnected',
          ),
      ),
    [allAssets, asset.id, assetConnections],
  )

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label)
    setErr(null)
    setMsg(null)
    try {
      await fn()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="gsc-integration">
      <div className="gsc-integration-head">
        <strong>Google Search Console</strong>
        <span className={`conn-status conn-status-${asset.gsc_status}`}>{asset.gsc_status}</span>
      </div>

      {conn?.last_error && (
        <div className="login-error" style={{ marginBottom: 8, fontSize: 12 }}>
          {conn.last_error}
        </div>
      )}
      {msg && (
        <div className="login-ok" style={{ marginBottom: 8, fontSize: 12 }}>
          {msg}
        </div>
      )}
      {err && (
        <div className="login-error" style={{ marginBottom: 8, fontSize: 12 }}>
          {err}
        </div>
      )}

      <div className="jdp-field jdp-full">
        <span className="jdp-label">GSC property URL</span>
        <input
          className="jdp-input"
          value={property}
          onChange={(e) => setProperty(e.target.value)}
          placeholder="sc-domain:example.com.au or https://example.com/"
        />
        <span className="mutedtext" style={{ fontSize: 11 }}>
          Auto-detected on connect when possible. Edit if the wrong property was chosen.
        </span>
      </div>

      {conn?.last_sync_at && (
        <p className="mutedtext" style={{ fontSize: 12, margin: '0 0 12px' }}>
          Last sync: {new Date(conn.last_sync_at).toLocaleString()}
        </p>
      )}

      <div className="gsc-integration-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={Boolean(busy)}
          onClick={() =>
            void run('oauth', async () => {
              const url = await startGscOAuth(asset.id)
              window.location.href = url
            })
          }
        >
          {busy === 'oauth' ? 'Redirecting…' : conn ? 'Re-connect GSC' : 'Connect GSC'}
        </button>

        {conn && (
          <button
            type="button"
            className="btn btn-gray"
            disabled={Boolean(busy) || !property.trim()}
            onClick={() =>
              void run('save', async () => {
                await saveGscProperty(asset.id, property.trim())
                setMsg('Property saved')
              })
            }
          >
            Save property
          </button>
        )}

        {conn && (
          <button
            type="button"
            className="btn btn-gray"
            disabled={Boolean(busy)}
            onClick={() =>
              void run('pull', async () => {
                await pullGscMetrics(asset.id)
                await refreshMetrics()
                setMsg('Metrics refreshed')
              })
            }
          >
            {busy === 'pull' ? 'Pulling…' : 'Refresh metrics'}
          </button>
        )}
      </div>

      {dupSources.length > 0 && (
        <div className="gsc-dup-setup">
          <span className="jdp-label">Duplicate setup from…</span>
          <div className="gsc-dup-row">
            <select
              className="jdp-input"
              value={dupFrom === '' ? '' : String(dupFrom)}
              onChange={(e) =>
                setDupFrom(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Select asset…</option>
              {dupSources.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-gray"
              disabled={Boolean(busy) || dupFrom === ''}
              onClick={() =>
                void run('dup', async () => {
                  await duplicateGscSetup(dupFrom as number, asset.id)
                  setMsg('Settings copied — complete Connect GSC to authorize this site.')
                  setDupFrom('')
                })
              }
            >
              Copy config
            </button>
          </div>
          <p className="mutedtext" style={{ fontSize: 11, margin: '6px 0 0' }}>
            Copies property URL pattern only. You still need to authorize this site separately.
          </p>
        </div>
      )}
    </div>
  )
}
