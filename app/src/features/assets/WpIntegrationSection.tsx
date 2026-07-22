import { useEffect, useMemo, useState } from 'react'
import { useData } from '../../lib/data'
import type { Asset } from '../../lib/pipeline'
import type { WpConnectionConfig } from '../../lib/seo'

type Props = {
  asset: Asset
}

function configFromConn(
  conn: { config: Record<string, unknown> } | undefined,
  asset: Asset,
) {
  const config = (conn?.config ?? {}) as WpConnectionConfig
  return {
    siteUrl: config.site_url ?? asset.asset_url ?? '',
    username: config.wp_username ?? '',
    postTypes: config.post_types?.length ? config.post_types.join(', ') : '',
  }
}

export function WpIntegrationSection({ asset }: Props) {
  const { assetConnections, connectWordPress, saveWordPressConfig, syncWpPages } = useData()

  const conn = assetConnections.find(
    (c) => c.asset_id === asset.id && c.provider === 'wordpress',
  )
  const config = (conn?.config ?? {}) as WpConnectionConfig
  const [siteUrl, setSiteUrl] = useState(() => configFromConn(conn, asset).siteUrl)
  const [username, setUsername] = useState(() => configFromConn(conn, asset).username)
  const [postTypes, setPostTypes] = useState(() => configFromConn(conn, asset).postTypes)
  const [appPassword, setAppPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const next = configFromConn(conn, asset)
    setSiteUrl(next.siteUrl)
    setUsername(next.username)
    setPostTypes(next.postTypes)
  }, [conn?.id, conn?.config, asset.id, asset.asset_url])

  const hasStoredCredentials = conn?.status === 'connected'
  const isConnected = hasStoredCredentials && Boolean(config.site_url)

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
    () => (config.post_types?.length ? config.post_types.join(', ') : 'all public types (auto-detected)'),
    [config.post_types],
  )

  const canSaveConfig = Boolean(siteUrl.trim() && username.trim())
  const canConnect =
    canSaveConfig && (Boolean(appPassword.trim()) || hasStoredCredentials)

  return (
    <div className="gsc-integration wp-integration">
      <div className="gsc-integration-head">
        <strong>WordPress</strong>
        <span className={`conn-status conn-status-${asset.wp_cli_status}`}>
          {asset.wp_cli_status}
        </span>
      </div>

      <p className="mutedtext" style={{ fontSize: 12, margin: '0 0 12px' }}>
        Managed pages registry — syncs published <strong>{postTypesLabel}</strong>. Always
        excludes <code>bw_reviews</code> and any page flagged{' '}
        <code>scos_seo_sitemap_exclude</code>. GSC metrics attach in the next phase.
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

      <div className="jdp-field jdp-full">
        <span className="jdp-label">Post types to sync (optional)</span>
        <input
          className="jdp-input"
          value={postTypes}
          onChange={(e) => setPostTypes(e.target.value)}
          placeholder="Leave blank to auto-detect all public post types"
        />
        <span className="mutedtext" style={{ fontSize: 11 }}>
          Comma-separated slugs (e.g. <code>post, page, service</code>). Restricts sync to
          these types only — <code>bw_reviews</code> is excluded either way.
        </span>
      </div>

      <div className="jdp-2col">
        <div className="jdp-field">
          <span className="jdp-label">WP username</span>
          <input
            className="jdp-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="api-user"
            autoComplete="username"
          />
        </div>
        <div className="jdp-field">
          <span className="jdp-label">Application password</span>
          <input
            className="jdp-input"
            type="password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder={
              hasStoredCredentials
                ? 'Leave blank to keep saved password'
                : 'xxxx xxxx xxxx xxxx'
            }
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
          className="btn btn-gray"
          disabled={Boolean(busy) || !canSaveConfig}
          onClick={() =>
            void run('save', async () => {
              const parsedPostTypes = postTypes
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
              await saveWordPressConfig(asset.id, {
                siteUrl: siteUrl.trim(),
                wpUsername: username.trim(),
                postTypes: parsedPostTypes,
              })
              setMsg('Settings saved')
            })
          }
        >
          {busy === 'save' ? 'Saving…' : 'Save settings'}
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={Boolean(busy) || !canConnect}
          onClick={() =>
            void run('connect', async () => {
              await connectWordPress({
                assetId: asset.id,
                siteUrl: siteUrl.trim(),
                wpUsername: username.trim(),
                wpAppPassword: appPassword.trim() || undefined,
              })
              setAppPassword('')
              setMsg(hasStoredCredentials ? 'Credentials verified' : 'WordPress connected')
            })
          }
        >
          {busy === 'connect'
            ? 'Connecting…'
            : hasStoredCredentials
              ? 'Verify / update credentials'
              : 'Connect WordPress'}
        </button>

        {isConnected && (
          <button
            type="button"
            className="btn btn-gray"
            disabled={Boolean(busy)}
            onClick={() =>
              void run('sync', async () => {
                const { upserted, skipped, postTypes } = await syncWpPages(asset.id)
                const skippedText = skipped ? `, skipped ${skipped}` : ''
                const typesText = postTypes.length ? ` (${postTypes.join(', ')})` : ''
                setMsg(`Synced ${upserted} page(s)${skippedText}${typesText}`)
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
