/** Google Search Console helpers — script-only, no LLM. */

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export type GscSiteMetrics = {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function get28DayWindows(): {
  current: { start: string; end: string }
  prior: { start: string; end: string }
} {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 1)
  const currentStart = new Date(end)
  currentStart.setUTCDate(currentStart.getUTCDate() - 27)
  const priorEnd = new Date(currentStart)
  priorEnd.setUTCDate(priorEnd.getUTCDate() - 1)
  const priorStart = new Date(priorEnd)
  priorStart.setUTCDate(priorStart.getUTCDate() - 27)
  return {
    current: { start: formatDate(currentStart), end: formatDate(end) },
    prior: { start: formatDate(priorStart), end: formatDate(priorEnd) },
  }
}

export function extractDomain(url: string): string {
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

export function siteMatchesDomain(siteUrl: string, domain: string): boolean {
  if (!domain) return false
  const decoded = decodeURIComponent(siteUrl).toLowerCase()
  const d = domain.toLowerCase()
  if (decoded === `sc-domain:${d}`) return true
  try {
    const host = new URL(decoded.endsWith('/') ? decoded : `${decoded}/`).hostname.replace(/^www\./, '')
    return host === d
  } catch {
    return decoded.includes(d)
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set on Edge Functions')
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error_description ?? json.error ?? 'Token refresh failed')
  }
  return json.access_token as string
}

export async function listGscSites(accessToken: string): Promise<string[]> {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'Failed to list GSC sites')
  }
  const entries = (json.siteEntry ?? []) as Array<{ siteUrl?: string }>
  return entries.map((e) => e.siteUrl).filter(Boolean) as string[]
}

export async function querySiteMetrics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<GscSiteMetrics> {
  const encoded = encodeURIComponent(siteUrl)
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      }),
    },
  )
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'GSC searchAnalytics query failed')
  }
  const row = (json.rows ?? [])[0] as
    | { clicks?: number; impressions?: number; ctr?: number; position?: number }
    | undefined
  if (!row) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  }
  return {
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: (row.ctr ?? 0) * 100,
    position: row.position ?? 0,
  }
}

export function pickSiteForDomain(sites: string[], assetUrl: string, preferred?: string): string | null {
  if (preferred && sites.includes(preferred)) return preferred
  const domain = extractDomain(assetUrl)
  const match = sites.find((s) => siteMatchesDomain(s, domain))
  return match ?? null
}
