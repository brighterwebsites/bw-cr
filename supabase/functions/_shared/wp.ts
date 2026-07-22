/** WordPress REST helpers — script-only, no LLM. */

export const DEFAULT_WP_META_KEYS = [
  'scos_seo_title',
  'scos_seo_description',
  'scos_seo_breadcrumb_title',
  'scos_seo_tldr',
  'scos_seo_robots',
  'scos_seo_canonical',
  'scos_ca_index_status',
  'scos_ca_purpose',
  'scos_ca_intent',
  'scos_ca_maturity',
  'scos_ca_next_step',
  'scos_ca_optimization_progress',
  'scos_ca_word_count',
  'scos_ca_last_analyzed',
] as const

export const DEFAULT_WP_TAXONOMIES = ['scos_topic', 'scos_content_cluster'] as const

export type WpConnectionConfig = {
  site_url?: string
  wp_username?: string
  post_types?: string[]
  meta_keys?: string[]
  taxonomies?: string[]
}

export type WpPostRow = {
  id: number
  link: string
  slug: string
  title: { rendered?: string }
  type: string
  meta?: Record<string, unknown>
  _embedded?: {
    'wp:term'?: Array<Array<{ taxonomy?: string; slug?: string }>>
  }
}

export function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** WP REST collection slug — post type `post` → route `posts`, not `post`. */
export function restBaseForPostType(postType: string): string {
  const known: Record<string, string> = {
    post: 'posts',
    page: 'pages',
  }
  return known[postType] ?? postType
}

export function urlPathFromLink(link: string): string {
  try {
    const path = new URL(link).pathname
    if (path === '/') return '/'
    return path.endsWith('/') ? path : `${path}/`
  } catch {
    return '/'
  }
}

export function basicAuthHeader(username: string, appPassword: string): string {
  const token = btoa(`${username}:${appPassword.replace(/\s+/g, '')}`)
  return `Basic ${token}`
}

export async function testWpConnection(
  siteUrl: string,
  username: string,
  appPassword: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const base = normalizeSiteUrl(siteUrl)
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: basicAuthHeader(username, appPassword),
        Accept: 'application/json',
      },
    })
    const json = await res.json()
    if (!res.ok) {
      const msg =
        (json as { message?: string }).message ??
        (json as { code?: string }).code ??
        `HTTP ${res.status}`
      return { ok: false, error: msg }
    }
    return { ok: true, name: (json as { name?: string }).name ?? username }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' }
  }
}

export async function fetchAllPublishedPosts(
  siteUrl: string,
  username: string,
  appPassword: string,
  postType: string,
): Promise<WpPostRow[]> {
  const base = normalizeSiteUrl(siteUrl)
  const auth = basicAuthHeader(username, appPassword)
  const rows: WpPostRow[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const restBase = restBaseForPostType(postType)
    const url = new URL(`${base}/wp-json/wp/v2/${restBase}`)
    url.searchParams.set('status', 'publish')
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', String(page))
    url.searchParams.set('context', 'edit')
    url.searchParams.set('_embed', 'wp:term')

    const res = await fetch(url.toString(), {
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(
        (json as { message?: string }).message ??
          `Failed to fetch ${restBase} (HTTP ${res.status})`,
      )
    }
    totalPages = Number(res.headers.get('X-WP-TotalPages') ?? '1')
    const batch = (await res.json()) as WpPostRow[]
    rows.push(...batch)
    page += 1
  }

  return rows
}

export function termSlugFromEmbedded(
  post: WpPostRow,
  taxonomy: string,
): string {
  const groups = post._embedded?.['wp:term'] ?? []
  for (const group of groups) {
    for (const term of group) {
      if (term.taxonomy === taxonomy && term.slug) return term.slug
    }
  }
  return ''
}

export function metaString(meta: Record<string, unknown> | undefined, key: string): string {
  const v = meta?.[key]
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

export function buildMetaSnapshot(
  meta: Record<string, unknown> | undefined,
  keys: readonly string[],
): Record<string, unknown> {
  const snap: Record<string, unknown> = {}
  if (!meta) return snap
  for (const key of keys) {
    if (key in meta) snap[key] = meta[key]
  }
  return snap
}

export type ParsedWpPage = {
  url_path: string
  canonical_url: string
  wp_post_id: number
  wp_post_type: string
  title: string
  scos_next_step: string
  scos_index_status: string
  topic_slug: string
  cluster_slug: string
  wp_meta_snapshot: Record<string, unknown>
}

export function parseWpPost(
  post: WpPostRow,
  metaKeys: readonly string[],
): ParsedWpPage {
  const meta = post.meta
  return {
    url_path: urlPathFromLink(post.link),
    canonical_url: post.link,
    wp_post_id: post.id,
    wp_post_type: post.type,
    title: post.title?.rendered?.replace(/<[^>]+>/g, '') ?? post.slug,
    scos_next_step: metaString(meta, 'scos_ca_next_step'),
    scos_index_status: metaString(meta, 'scos_ca_index_status'),
    topic_slug: termSlugFromEmbedded(post, 'scos_topic'),
    cluster_slug: termSlugFromEmbedded(post, 'scos_content_cluster'),
    wp_meta_snapshot: buildMetaSnapshot(meta, metaKeys),
  }
}
