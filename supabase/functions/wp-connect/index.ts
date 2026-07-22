import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  DEFAULT_WP_META_KEYS,
  DEFAULT_WP_TAXONOMIES,
  normalizeSiteUrl,
  testWpConnection,
  type WpConnectionConfig,
} from '../_shared/wp.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: {
    asset_id?: number
    site_url?: string
    wp_username?: string
    wp_app_password?: string
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const assetId = body.asset_id
  const siteUrl = body.site_url?.trim()
  const wpUsername = body.wp_username?.trim()
  const wpAppPassword = body.wp_app_password?.trim()

  if (!assetId || !siteUrl || !wpUsername) {
    return jsonResponse({ error: 'asset_id, site_url, wp_username required' }, 400)
  }

  const service = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: existingConn } = await service
    .from('asset_connections')
    .select('id, config')
    .eq('asset_id', assetId)
    .eq('provider', 'wordpress')
    .maybeSingle()

  let appPassword = wpAppPassword ?? ''
  if (!appPassword) {
    if (!existingConn) {
      return jsonResponse({ error: 'wp_app_password required for first connect' }, 400)
    }
    const { data: secretRow } = await service
      .from('asset_connection_secrets')
      .select('wp_app_password')
      .eq('asset_connection_id', existingConn.id)
      .maybeSingle()
    appPassword = secretRow?.wp_app_password ?? ''
    if (!appPassword) {
      return jsonResponse({ error: 'wp_app_password required — no stored credentials' }, 400)
    }
  }

  const test = await testWpConnection(siteUrl, wpUsername, appPassword)
  if (!test.ok) {
    return jsonResponse({ error: test.error }, 400)
  }

  const priorConfig = (existingConn?.config ?? {}) as WpConnectionConfig
  const config: WpConnectionConfig = {
    ...priorConfig,
    site_url: normalizeSiteUrl(siteUrl),
    wp_username: wpUsername,
    post_types: priorConfig.post_types?.length ? priorConfig.post_types : ['post'],
    meta_keys: priorConfig.meta_keys?.length ? priorConfig.meta_keys : [...DEFAULT_WP_META_KEYS],
    taxonomies: priorConfig.taxonomies?.length
      ? priorConfig.taxonomies
      : [...DEFAULT_WP_TAXONOMIES],
  }

  const { data: conn, error: connErr } = await service
    .from('asset_connections')
    .upsert(
      {
        asset_id: assetId,
        provider: 'wordpress',
        status: 'connected',
        config,
        secret_ref: '',
        last_error: '',
      },
      { onConflict: 'asset_id,provider' },
    )
    .select('id')
    .single()

  if (connErr || !conn) {
    return jsonResponse({ error: connErr?.message ?? 'Failed to save connection' }, 500)
  }

  const { error: secErr } = await service.from('asset_connection_secrets').upsert({
    asset_connection_id: conn.id,
    refresh_token: null,
    wp_username: wpUsername,
    wp_app_password: appPassword,
  })
  if (secErr) {
    return jsonResponse({ error: secErr.message }, 500)
  }

  await service.from('assets').update({ wp_cli_status: 'connected' }).eq('id', assetId)

  return jsonResponse({ ok: true, wp_user: test.name })
})
