import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type OrganicMetrics = {
  pos_1?: number
  pos_2_3?: number
  pos_4_10?: number
  pos_11_20?: number
  pos_21_30?: number
  pos_31_40?: number
  pos_41_50?: number
  pos_51_60?: number
  pos_61_70?: number
  pos_71_80?: number
  pos_81_90?: number
  pos_91_100?: number
  etv?: number
  count?: number
  estimated_paid_traffic_cost?: number
}

type SnapshotMetrics = {
  total_keywords: number | null
  organic_traffic: number | null
  traffic_value: number | null
  paid_traffic: number | null
  top_3_keywords: number | null
  top_10_keywords: number | null
  top_100_keywords: number | null
  position_1: number | null
  position_2_3: number | null
  position_4_10: number | null
  position_11_20: number | null
  position_21_50: number | null
  position_51_100: number | null
  domain_rank: number | null
  backlinks: number | null
  referring_domains: number | null
  spam_score: number | null
  keyword_gaps: number | null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

function sum(...vals: Array<number | undefined>): number | null {
  let total = 0
  let any = false
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      total += v
      any = true
    }
  }
  return any ? total : null
}

function extractDomain(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const host = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).hostname
    return host.replace(/^www\./i, '').toLowerCase()
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase()
  }
}

function organicFromOverview(organic: OrganicMetrics | undefined): Omit<
  SnapshotMetrics,
  'domain_rank' | 'backlinks' | 'referring_domains' | 'spam_score' | 'keyword_gaps'
> {
  const pos1 = num(organic?.pos_1)
  const pos23 = num(organic?.pos_2_3)
  const pos410 = num(organic?.pos_4_10)
  const pos1120 = num(organic?.pos_11_20)
  const pos2150 = sum(
    organic?.pos_21_30,
    organic?.pos_31_40,
    organic?.pos_41_50,
  )
  const pos51100 = sum(
    organic?.pos_51_60,
    organic?.pos_61_70,
    organic?.pos_71_80,
    organic?.pos_81_90,
    organic?.pos_91_100,
  )
  const top3 = sum(pos1 ?? undefined, pos23 ?? undefined)
  const top10 = sum(top3 ?? undefined, pos410 ?? undefined)
  const total = num(organic?.count)

  return {
    total_keywords: total,
    organic_traffic: num(organic?.etv),
    traffic_value: num(organic?.estimated_paid_traffic_cost),
    paid_traffic: null,
    top_3_keywords: top3,
    top_10_keywords: top10,
    top_100_keywords: total,
    position_1: pos1,
    position_2_3: pos23,
    position_4_10: pos410,
    position_11_20: pos1120,
    position_21_50: pos2150,
    position_51_100: pos51100,
  }
}

async function dfsPost(path: string, body: unknown[]) {
  const login = Deno.env.get('DATAFORSEO_LOGIN')
  const password = Deno.env.get('DATAFORSEO_PASSWORD')
  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured in Edge Function secrets')
  }

  const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${login}:${password}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`DataForSEO HTTP ${res.status}`)
  }

  const json = await res.json()
  if (json.status_code !== 20000) {
    throw new Error(json.status_message ?? `DataForSEO error ${json.status_code}`)
  }
  return json
}

async function fetchDomainRankOverviews(
  domains: string[],
  locationCode: number,
  languageCode: string,
): Promise<Map<string, ReturnType<typeof organicFromOverview> & { paid_traffic: number | null }>> {
  const out = new Map<string, ReturnType<typeof organicFromOverview> & { paid_traffic: number | null }>()
  if (domains.length === 0) return out

  const json = await dfsPost(
    'dataforseo_labs/google/domain_rank_overview/live',
    domains.map((target) => ({
      target,
      location_code: locationCode,
      language_code: languageCode,
    })),
  )

  const tasks = Array.isArray(json.tasks) ? json.tasks : []
  for (let i = 0; i < tasks.length; i++) {
    const domain = domains[i]
    if (!domain) continue
    const task = tasks[i]
    if (task?.status_code !== 20000) continue
    const item = task?.result?.[0]?.items?.[0]
    const organic = item?.metrics?.organic as OrganicMetrics | undefined
    const paid = item?.metrics?.paid as { etv?: number } | undefined
    const metrics = organicFromOverview(organic)
    out.set(domain, { ...metrics, paid_traffic: num(paid?.etv) })
  }
  return out
}

async function fetchBacklinkSummaries(domains: string[]): Promise<
  Map<string, { domain_rank: number | null; backlinks: number | null; referring_domains: number | null; spam_score: number | null }>
> {
  const out = new Map<
    string,
    { domain_rank: number | null; backlinks: number | null; referring_domains: number | null; spam_score: number | null }
  >()
  if (domains.length === 0) return out

  const json = await dfsPost(
    'backlinks/summary/live',
    domains.map((target) => ({ target })),
  )

  const tasks = Array.isArray(json.tasks) ? json.tasks : []
  for (let i = 0; i < tasks.length; i++) {
    const domain = domains[i]
    if (!domain) continue
    const task = tasks[i]
    if (task?.status_code !== 20000) continue
    const item = task?.result?.[0]
    out.set(domain, {
      domain_rank: num(item?.rank),
      backlinks: num(item?.backlinks),
      referring_domains: num(item?.referring_domains),
      spam_score: num(item?.backlinks_spam_score ?? item?.spam_score),
    })
  }
  return out
}

async function fetchIntersectionCount(
  competitorDomain: string,
  targetDomain: string,
  locationCode: number,
  languageCode: string,
): Promise<number | null> {
  const json = await dfsPost('dataforseo_labs/google/domain_intersection/live', [
    {
      target1: competitorDomain,
      target2: targetDomain,
      location_code: locationCode,
      language_code: languageCode,
      limit: 1,
    },
  ])

  const task = json.tasks?.[0]
  if (task?.status_code !== 20000) return null
  return num(task?.result?.[0]?.total_count)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let runId: number | null = null

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const body = await req.json()
    runId = typeof body?.run_id === 'number' ? body.run_id : null
    if (!runId) {
      return jsonResponse({ error: 'run_id is required' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: 'Supabase service configuration missing' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: run, error: runErr } = await supabase
      .from('competitor_analysis_runs')
      .select('*')
      .eq('id', runId)
      .single()
    if (runErr || !run) {
      return jsonResponse({ error: runErr?.message ?? 'Run not found' }, 404)
    }

    if (run.status === 'running') {
      return jsonResponse({ error: 'Run is already in progress' }, 409)
    }

    const { data: snapshots, error: snapErr } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .eq('run_id', runId)
    if (snapErr) throw new Error(snapErr.message)
    if (!snapshots?.length) throw new Error('No snapshots found for this run')

    await supabase
      .from('competitor_analysis_runs')
      .update({ status: 'running', error_message: '' })
      .eq('id', runId)

    const targetSnapshot = snapshots.find((s) => s.type === 'target')
    const targetDomain = extractDomain(targetSnapshot?.url ?? '')
    if (!targetDomain) throw new Error('Target domain is missing or invalid')

    const domainBySnapshotId = new Map<number, string>()
    const uniqueDomains: string[] = []
    for (const snap of snapshots) {
      const domain = extractDomain(snap.url)
      if (!domain) continue
      domainBySnapshotId.set(snap.id, domain)
      if (!uniqueDomains.includes(domain)) uniqueDomains.push(domain)
    }

    const [overviewMap, backlinkMap] = await Promise.all([
      fetchDomainRankOverviews(uniqueDomains, run.search_location_code, run.search_language_code),
      fetchBacklinkSummaries(uniqueDomains),
    ])

    const competitorDomains = snapshots
      .filter((s) => s.type === 'competitor')
      .map((s) => domainBySnapshotId.get(s.id))
      .filter((d): d is string => Boolean(d))

    const intersectionByDomain = new Map<string, number | null>()
    await Promise.all(
      competitorDomains.map(async (domain) => {
        const count = await fetchIntersectionCount(
          domain,
          targetDomain,
          run.search_location_code,
          run.search_language_code,
        )
        intersectionByDomain.set(domain, count)
      }),
    )

    for (const snap of snapshots) {
      const domain = domainBySnapshotId.get(snap.id)
      if (!domain) continue

      const overview = overviewMap.get(domain)
      const backlinks = backlinkMap.get(domain)
      let keyword_gaps: number | null = null

      if (snap.type === 'competitor') {
        const shared = intersectionByDomain.get(domain)
        const competitorTotal = overview?.total_keywords
        if (shared != null && competitorTotal != null) {
          keyword_gaps = Math.max(0, competitorTotal - shared)
        }
      }

      const patch: SnapshotMetrics = {
        total_keywords: overview?.total_keywords ?? null,
        organic_traffic: overview?.organic_traffic ?? null,
        traffic_value: overview?.traffic_value ?? null,
        paid_traffic: overview?.paid_traffic ?? null,
        top_3_keywords: overview?.top_3_keywords ?? null,
        top_10_keywords: overview?.top_10_keywords ?? null,
        top_100_keywords: overview?.top_100_keywords ?? null,
        position_1: overview?.position_1 ?? null,
        position_2_3: overview?.position_2_3 ?? null,
        position_4_10: overview?.position_4_10 ?? null,
        position_11_20: overview?.position_11_20 ?? null,
        position_21_50: overview?.position_21_50 ?? null,
        position_51_100: overview?.position_51_100 ?? null,
        domain_rank: backlinks?.domain_rank ?? null,
        backlinks: backlinks?.backlinks ?? null,
        referring_domains: backlinks?.referring_domains ?? null,
        spam_score: backlinks?.spam_score ?? null,
        keyword_gaps,
      }

      const { error: updErr } = await supabase.from('competitor_snapshots').update(patch).eq('id', snap.id)
      if (updErr) throw new Error(updErr.message)
    }

    await supabase
      .from('competitor_analysis_runs')
      .update({ status: 'done', error_message: '' })
      .eq('id', runId)

    return jsonResponse({ ok: true, run_id: runId })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'

    if (runId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (supabaseUrl && serviceKey) {
          const supabase = createClient(supabaseUrl, serviceKey)
          await supabase
            .from('competitor_analysis_runs')
            .update({ status: 'failed', error_message: message })
            .eq('id', runId)
        }
      } catch {
        // best-effort failure status update
      }
    }

    return jsonResponse({ error: message }, 500)
  }
})
