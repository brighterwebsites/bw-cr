import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  get28DayWindows,
  lookupPageMetrics,
  queryAllPageMetrics,
  refreshAccessToken,
} from '../_shared/gsc.ts'

type PullResult = {
  asset_id: number
  ok: boolean
  pages_updated?: number
  error?: string
}

async function pullPagesForAsset(
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
    return { asset_id: assetId, ok: false, error: 'GSC not connected' }
  }

  const gscProperty = (conn.config as { gsc_property?: string })?.gsc_property ?? ''
  if (!gscProperty) {
    return { asset_id: assetId, ok: false, error: 'Missing GSC property' }
  }

  const { data: secretRow } = await service
    .from('asset_connection_secrets')
    .select('refresh_token')
    .eq('asset_connection_id', conn.id)
    .maybeSingle()

  const refreshToken = secretRow?.refresh_token
  if (!refreshToken) {
    return { asset_id: assetId, ok: false, error: 'Missing refresh token' }
  }

  const { data: pages, error: pagesErr } = await service
    .from('asset_pages')
    .select('id, url_path, canonical_url')
    .eq('asset_id', assetId)

  if (pagesErr) return { asset_id: assetId, ok: false, error: pagesErr.message }
  if (!pages?.length) {
    return { asset_id: assetId, ok: true, pages_updated: 0 }
  }

  try {
    const accessToken = await refreshAccessToken(refreshToken)
    const windows = get28DayWindows()
    const [currentMap, priorMap] = await Promise.all([
      queryAllPageMetrics(accessToken, gscProperty, windows.current.start, windows.current.end),
      queryAllPageMetrics(accessToken, gscProperty, windows.prior.start, windows.prior.end),
    ])

    let updated = 0
    for (const page of pages) {
      const current = lookupPageMetrics(currentMap, page.url_path, page.canonical_url)
      const prior = lookupPageMetrics(priorMap, page.url_path, page.canonical_url)

      const { error: upErr } = await service.from('page_metrics_current').upsert(
        {
          asset_page_id: page.id,
          period_start: windows.current.start,
          period_end: windows.current.end,
          prior_period_start: windows.prior.start,
          prior_period_end: windows.prior.end,
          impressions: current.impressions,
          impressions_delta: current.impressions - prior.impressions,
          clicks: current.clicks,
          clicks_delta: current.clicks - prior.clicks,
          ctr: current.ctr,
          ctr_delta: current.ctr - prior.ctr,
          avg_position: current.position,
          avg_position_delta: current.position - prior.position,
          pulled_at: new Date().toISOString(),
        },
        { onConflict: 'asset_page_id' },
      )
      if (upErr) throw new Error(upErr.message)
      updated += 1
    }

    return { asset_id: assetId, ok: true, pages_updated: updated }
  } catch (e) {
    return {
      asset_id: assetId,
      ok: false,
      error: e instanceof Error ? e.message : 'Page pull failed',
    }
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
    const gscIds = (conns ?? []).map((c) => c.asset_id)
    if (gscIds.length) {
      const { data: pageAssets } = await service
        .from('asset_pages')
        .select('asset_id')
        .in('asset_id', gscIds)
      assetIds = [...new Set((pageAssets ?? []).map((p) => p.asset_id))]
    }
  }

  const results: PullResult[] = []
  for (const id of assetIds) {
    results.push(await pullPagesForAsset(service, id))
  }

  return jsonResponse({ results })
})
