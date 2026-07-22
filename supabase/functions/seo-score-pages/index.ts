import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { computeSiteThresholds, detectOpportunities, type PageMetricsInput } from '../_shared/seo-rules.ts'

type ScoreResult = {
  asset_id: number
  ok: boolean
  created?: number
  updated?: number
  error?: string
}

async function scoreAsset(
  service: ReturnType<typeof createClient>,
  assetId: number,
): Promise<ScoreResult> {
  const { data: pages, error: pagesErr } = await service
    .from('asset_pages')
    .select('id, asset_id, url_path')
    .eq('asset_id', assetId)

  if (pagesErr) {
    return { asset_id: assetId, ok: false, error: pagesErr.message }
  }
  if (!pages?.length) {
    return { asset_id: assetId, ok: true, created: 0, updated: 0 }
  }

  const pageIds = pages.map((p) => p.id)
  const { data: metricsRows, error: metricsErr } = await service
    .from('page_metrics_current')
    .select('asset_page_id, impressions, clicks, ctr, avg_position')
    .in('asset_page_id', pageIds)

  if (metricsErr) {
    return { asset_id: assetId, ok: false, error: metricsErr.message }
  }

  const metricsByPage = new Map(
    (metricsRows ?? []).map((m) => [m.asset_page_id, m]),
  )

  const thresholds = computeSiteThresholds(
    (metricsRows ?? []).map((m) => Number(m.impressions ?? 0)),
  )

  let created = 0
  let updated = 0

  for (const page of pages) {
    const row = metricsByPage.get(page.id)
    if (!row) continue

    const input: PageMetricsInput = {
      asset_page_id: page.id,
      asset_id: page.asset_id,
      url_path: page.url_path,
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      ctr: Number(row.ctr ?? 0),
      avg_position: Number(row.avg_position ?? 0),
    }

    for (const opp of detectOpportunities(input, thresholds)) {
      const { data: existing } = await service
        .from('seo_opportunities')
        .select('id')
        .eq('asset_page_id', page.id)
        .eq('opportunity_type', opp.opportunity_type)
        .eq('status', 'open')
        .maybeSingle()

      const payload = {
        asset_id: page.asset_id,
        asset_page_id: page.id,
        opportunity_type: opp.opportunity_type,
        problem: opp.problem,
        priority: opp.priority,
        recommended_workflow: opp.recommended_workflow,
        status: 'open' as const,
        impressions: opp.impressions,
        clicks: opp.clicks,
        ctr: opp.ctr,
        avg_position: opp.avg_position,
        impact_score: opp.impact_score,
        evidence_json: opp.evidence_json,
        detected_at: new Date().toISOString(),
      }

      if (existing) {
        const { error: updErr } = await service
          .from('seo_opportunities')
          .update(payload)
          .eq('id', existing.id)
        if (updErr) return { asset_id: assetId, ok: false, error: updErr.message }
        updated += 1
      } else {
        const { error: insErr } = await service.from('seo_opportunities').insert(payload)
        if (insErr) return { asset_id: assetId, ok: false, error: insErr.message }
        created += 1
      }
    }
  }

  return { asset_id: assetId, ok: true, created, updated }
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
    const { data: pages } = await service.from('asset_pages').select('asset_id')
    assetIds = [...new Set((pages ?? []).map((p) => p.asset_id))]
  }

  const results: ScoreResult[] = []
  for (const id of assetIds) {
    results.push(await scoreAsset(service, id))
  }

  return jsonResponse({ results })
})
