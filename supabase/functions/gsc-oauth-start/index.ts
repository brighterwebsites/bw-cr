import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { GSC_SCOPE } from '../_shared/gsc.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
  const redirectUri = Deno.env.get('GSC_OAUTH_REDIRECT_URI')
  if (!clientId || !redirectUri) {
    return jsonResponse(
      { error: 'Google OAuth is not configured (GOOGLE_OAUTH_CLIENT_ID, GSC_OAUTH_REDIRECT_URI)' },
      503,
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: { asset_id?: number }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  const assetId = body.asset_id
  if (!assetId || !Number.isFinite(assetId)) {
    return jsonResponse({ error: 'asset_id is required' }, 400)
  }

  const { data: asset, error: assetErr } = await supabase
    .from('assets')
    .select('id, asset_url')
    .eq('id', assetId)
    .single()
  if (assetErr || !asset) {
    return jsonResponse({ error: 'Asset not found' }, 404)
  }

  const state = btoa(
    JSON.stringify({
      asset_id: assetId,
      uid: user.id,
      ts: Date.now(),
    }),
  )

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GSC_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return jsonResponse({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  })
})
