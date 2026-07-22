import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  DEFAULT_WP_META_KEYS,
  fetchAllPublishedPosts,
  isSitemapExcluded,
  parseWpPost,
  resolvePostTypesToSync,
  type WpConnectionConfig,
} from '../_shared/wp.ts'

type SyncResult = {
  asset_id: number
  ok: boolean
  pages_upserted?: number
  pages_skipped?: number
  post_types?: string[]
  error?: string
}

async function syncOneAsset(
  service: ReturnType<typeof createClient>,
  assetId: number,
): Promise<SyncResult> {
  const { data: conn, error: connErr } = await service
    .from('asset_connections')
    .select('id, config')
    .eq('asset_id', assetId)
    .eq('provider', 'wordpress')
    .maybeSingle()

  if (connErr || !conn) {
    await service.from('assets').update({ wp_cli_status: 'disconnected' }).eq('id', assetId)
    return { asset_id: assetId, ok: false, error: 'WordPress not connected' }
  }

  const { data: secretRow } = await service
    .from('asset_connection_secrets')
    .select('wp_username, wp_app_password')
    .eq('asset_connection_id', conn.id)
    .maybeSingle()

  const config = (conn.config ?? {}) as WpConnectionConfig
  const siteUrl = config.site_url ?? ''
  const username = secretRow?.wp_username ?? ''
  const appPassword = secretRow?.wp_app_password ?? ''
  const metaKeys = config.meta_keys?.length ? config.meta_keys : [...DEFAULT_WP_META_KEYS]

  if (!siteUrl || !username || !appPassword) {
    return { asset_id: assetId, ok: false, error: 'Missing WordPress credentials' }
  }

  try {
    const now = new Date().toISOString()
    let upserted = 0
    let skipped = 0

    const typeInfos = await resolvePostTypesToSync(siteUrl, username, appPassword, config.post_types)

    for (const { restBase } of typeInfos) {
      const posts = await fetchAllPublishedPosts(siteUrl, username, appPassword, restBase)
      for (const post of posts) {
        if (isSitemapExcluded(post)) {
          skipped += 1
          continue
        }
        const parsed = parseWpPost(post, metaKeys)
        const { error: upErr } = await service.from('asset_pages').upsert(
          {
            asset_id: assetId,
            url_path: parsed.url_path,
            canonical_url: parsed.canonical_url,
            wp_post_id: parsed.wp_post_id,
            wp_post_type: parsed.wp_post_type,
            title: parsed.title,
            scos_next_step: parsed.scos_next_step,
            scos_index_status: parsed.scos_index_status,
            topic_slug: parsed.topic_slug,
            cluster_slug: parsed.cluster_slug,
            wp_meta_snapshot: parsed.wp_meta_snapshot,
            meta_synced_at: now,
          },
          { onConflict: 'asset_id,url_path' },
        )
        if (upErr) throw new Error(upErr.message)
        upserted += 1
      }
    }

    await service
      .from('asset_connections')
      .update({ status: 'connected', last_sync_at: now, last_error: '' })
      .eq('id', conn.id)
    await service.from('assets').update({ wp_cli_status: 'connected' }).eq('id', assetId)

    return {
      asset_id: assetId,
      ok: true,
      pages_upserted: upserted,
      pages_skipped: skipped,
      post_types: typeInfos.map((t) => t.slug),
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    await service
      .from('asset_connections')
      .update({ status: 'error', last_error: msg })
      .eq('id', conn.id)
    await service.from('assets').update({ wp_cli_status: 'error' }).eq('id', assetId)
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
      .eq('provider', 'wordpress')
      .eq('status', 'connected')
    assetIds = (conns ?? []).map((c) => c.asset_id)
  }

  const results: SyncResult[] = []
  for (const id of assetIds) {
    results.push(await syncOneAsset(service, id))
  }

  return jsonResponse({ results })
})
