import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  get28DayWindows,
  querySiteMetrics,
  refreshAccessToken,
} from '../_shared/gsc.ts'

type PullResult = {
  asset_id: number
  ok: boolean
  error?: string
}

async function pullOneAsset(
  service: ReturnType<typeof createClient>,
  assetId: number,
): Promise<PullResult> {
  const { data: conn, error: connErr } = await service
    .from('asset_connections')
    .select('id, config')
    .eq('asset_id', assetId)
    .eq('provider', 'gsc')
    .maybeSingle()

  if (connErr || !conn) {
    await service.from('assets').update({ gsc_status: 'disconnected' }).eq('id', assetId)
    return { asset_id: assetId, ok: false, error: 'GSC not connected' }
  }

  const { data: secretRow } = await service
    .from('asset_connection_secrets')
    .select('refresh_token')
    .eq('asset_connection_id', conn.id)
    .maybeSingle()

  const gscProperty = (conn.config as { gsc_property?: string })?.gsc_property ?? ''
  if (!gscProperty) {
    await service
      .from('asset_connections')
      .update({ status: 'error', last_error: 'Missing gsc_property in connection config' })
      .eq('id', conn.id)
    await service.from('assets').update({ gsc_status: 'error' }).eq('id', assetId)
    return { asset_id: assetId, ok: false, error: 'Missing GSC property' }
  }

  const refreshToken = secretRow?.refresh_token
  if (!refreshToken) {
    return { asset_id: assetId, ok: false, error: 'Missing refresh token' }
  }

  try {
    const accessToken = await refreshAccessToken(refreshToken)
    const windows = get28DayWindows()
    const [current, prior] = await Promise.all([
      querySiteMetrics(accessToken, gscProperty, windows.current.start, windows.current.end),
      querySiteMetrics(accessToken, gscProperty, windows.prior.start, windows.prior.end),
    ])

    const { error: insErr } = await service.from('metrics_snapshots').insert({
      asset_id: assetId,
      period_label: 'Last 28 days',
      snapshot_type: 'update',
      clicks: current.clicks,
      clicks_delta: current.clicks - prior.clicks,
      impressions: current.impressions,
      impressions_delta: current.impressions - prior.impressions,
      ctr: current.ctr,
      ctr_delta: current.ctr - prior.ctr,
      avg_rank: current.position,
      avg_rank_delta: current.position - prior.position,
    })

    if (insErr) throw new Error(insErr.message)

    const now = new Date().toISOString()
    await service
      .from('asset_connections')
      .update({ status: 'connected', last_sync_at: now, last_error: '' })
      .eq('id', conn.id)
    await service.from('assets').update({ gsc_status: 'connected' }).eq('id', assetId)

    return { asset_id: assetId, ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Pull failed'
    await service
      .from('asset_connections')
      .update({ status: 'error', last_error: msg })
      .eq('id', conn.id)
    await service.from('assets').update({ gsc_status: 'error' }).eq('id', assetId)
    return { asset_id: assetId, ok: false, error: msg }
  }
}

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

  let body: { asset_id?: number } = {}
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const service = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  let assetIds: number[] = []
  if (body.asset_id) {
    assetIds = [body.asset_id]
  } else {
    const { data: conns } = await service
      .from('asset_connections')
      .select('asset_id')
      .eq('provider', 'gsc')
      .eq('status', 'connected')
    assetIds = (conns ?? []).map((c) => c.asset_id)
  }

  const results: PullResult[] = []
  for (const id of assetIds) {
    results.push(await pullOneAsset(service, id))
  }

  return jsonResponse({ results })
})
