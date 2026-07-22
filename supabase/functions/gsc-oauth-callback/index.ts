import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  extractDomain,
  listGscSites,
  pickSiteForDomain,
  refreshAccessToken,
} from '../_shared/gsc.ts'

function appRedirect(path: string) {
  const base = Deno.env.get('CRM_APP_URL') ?? 'http://localhost:5173'
  return Response.redirect(`${base.replace(/\/$/, '')}${path}`, 302)
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (oauthError) {
    return appRedirect(`/assets?gsc=error&message=${encodeURIComponent(oauthError)}`)
  }
  if (!code || !stateRaw) {
    return appRedirect('/assets?gsc=error&message=missing_code')
  }

  let state: { asset_id?: number; ts?: number }
  try {
    state = JSON.parse(atob(stateRaw))
  } catch {
    return appRedirect('/assets?gsc=error&message=invalid_state')
  }
  const assetId = state.asset_id
  if (!assetId || !state.ts || Date.now() - state.ts > 15 * 60 * 1000) {
    return appRedirect('/assets?gsc=error&message=expired_state')
  }

  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')
  const redirectUri = Deno.env.get('GSC_OAUTH_REDIRECT_URI')
  if (!clientId || !clientSecret || !redirectUri) {
    return appRedirect('/assets?gsc=error&message=oauth_not_configured')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenJson = await tokenRes.json()
  if (!tokenRes.ok || !tokenJson.refresh_token) {
    const msg = tokenJson.error_description ?? tokenJson.error ?? 'token_exchange_failed'
    return appRedirect(`/assets?gsc=error&asset_id=${assetId}&message=${encodeURIComponent(msg)}`)
  }

  const service = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: asset, error: assetErr } = await service
    .from('assets')
    .select('id, asset_url')
    .eq('id', assetId)
    .single()
  if (assetErr || !asset) {
    return appRedirect('/assets?gsc=error&message=asset_not_found')
  }

  let accessToken: string
  try {
    accessToken = await refreshAccessToken(tokenJson.refresh_token as string)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'refresh_failed'
    return appRedirect(`/assets?gsc=error&asset_id=${assetId}&message=${encodeURIComponent(msg)}`)
  }

  let gscProperty = ''
  try {
    const sites = await listGscSites(accessToken)
    const { data: existingConn } = await service
      .from('asset_connections')
      .select('config')
      .eq('asset_id', assetId)
      .eq('provider', 'gsc')
      .maybeSingle()
    const preferred = (existingConn?.config as { gsc_property?: string } | null)?.gsc_property
    gscProperty = pickSiteForDomain(sites, asset.asset_url, preferred) ?? ''
  } catch {
    // property can be set manually later
  }

  if (gscProperty) {
    const { data: others } = await service
      .from('asset_connections')
      .select('asset_id, config')
      .eq('provider', 'gsc')
      .neq('asset_id', assetId)
    const duplicate = (others ?? []).some(
      (row) =>
        (row.config as { gsc_property?: string })?.gsc_property === gscProperty &&
        gscProperty !== '',
    )
    if (duplicate) {
      return appRedirect(
        `/assets?gsc=error&asset_id=${assetId}&message=${encodeURIComponent('This Search Console property is already linked to another asset')}`,
      )
    }
  }

  const secretRef = `gsc-asset-${assetId}`
  const config = {
    site_url: asset.asset_url,
    gsc_property: gscProperty,
    domain: extractDomain(asset.asset_url),
  }

  const { data: conn, error: connErr } = await service
    .from('asset_connections')
    .upsert(
      {
        asset_id: assetId,
        provider: 'gsc',
        status: gscProperty ? 'connected' : 'unknown',
        config,
        secret_ref: secretRef,
        last_error: gscProperty ? '' : 'Authorize OK — pick GSC property and refresh',
      },
      { onConflict: 'asset_id,provider' },
    )
    .select('id')
    .single()

  if (connErr || !conn) {
    return appRedirect(`/assets?gsc=error&asset_id=${assetId}&message=save_failed`)
  }

  await service.from('asset_connection_secrets').upsert({
    asset_connection_id: conn.id,
    refresh_token: tokenJson.refresh_token as string,
  })

  await service.from('assets').update({ gsc_status: gscProperty ? 'connected' : 'unknown' }).eq('id', assetId)

  return appRedirect(`/assets?gsc=connected&asset_id=${assetId}`)
})
