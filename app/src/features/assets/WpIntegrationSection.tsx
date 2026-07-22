import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import type { Asset } from '../../lib/pipeline'
import type { WpConnectionConfig } from '../../lib/seo'

type Props = {
  asset: Asset
}

export function WpIntegrationSection({ asset }: Props) {
  const { assetConnections, connectWordPress, syncWpPages } = useData()

  const conn = assetConnections.find(
    (c) => c.asset_id === asset.id && c.provider === 'wordpress',
  )
  const config = (conn?.config ?? {}) as WpConnectionConfig
  const [siteUrl, setSiteUrl] = useState(config.site_url ?? asset.asset_url ?? '')
  const [username, setUsername] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setSiteUrl((conn?.config as WpConnectionConfig)?.site_url ?? asset.asset_url ?? '')
  }, [conn?.id, conn?.config, asset.asset_url])

  const isConnected = conn?.status === 'connected' && Boolean(config.site_url)

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

  const postTypesLabel = useMemo(
    () => (config.post_types?.length ? config.post_types.join(', ') : 'post'),
    [config.post_types],
  )

  return (
    <div className="gsc-integration wp-integration">
      <div className="gsc-integration-head">
        <strong>WordPress</strong>
        <span className={`conn-status conn-status-${asset.wp_cli_status}`}>
          {asset.wp_cli_status}
        </span>
      </div>

      <p className="mutedtext" style={{ fontSize: 12, margin: '0 0 12px' }}>
        Managed pages registry — syncs published <strong>{postTypesLabel}</strong> only. GSC
        metrics attach in the next phase.
      </p>

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
        <span className="jdp-label">Site URL</span>
        <input
          className="jdp-input"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://example.com.au"
        />
      </div>

      <div className="jdp-2col">
        <div className="jdp-field">
          <span className="jdp-label">WP username</span>
          <input
            className="jdp-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="api-user"
            autoComplete="off"
          />
        </div>
        <div className="jdp-field">
          <span className="jdp-label">Application password</span>
          <input
            className="jdp-input"
            type="password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder={isConnected ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
            autoComplete="new-password"
          />
        </div>
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
          disabled={Boolean(busy) || !siteUrl.trim() || !username.trim() || !appPassword.trim()}
          onClick={() =>
            void run('connect', async () => {
              await connectWordPress({
                assetId: asset.id,
                siteUrl: siteUrl.trim(),
                wpUsername: username.trim(),
                wpAppPassword: appPassword.trim(),
              })
              setAppPassword('')
              setMsg('WordPress connected')
            })
          }
        >
          {busy === 'connect' ? 'Connecting…' : isConnected ? 'Update connection' : 'Connect WordPress'}
        </button>

        {isConnected && (
          <button
            type="button"
            className="btn btn-gray"
            disabled={Boolean(busy)}
            onClick={() =>
              void run('sync', async () => {
                const count = await syncWpPages(asset.id)
                setMsg(`Synced ${count} page(s)`)
              })
            }
          >
            {busy === 'sync' ? 'Syncing…' : 'Sync pages'}
          </button>
        )}
      </div>
    </div>
  )
}
