/** WordPress REST helpers — script-only, no LLM. */

export const DEFAULT_WP_META_KEYS = [
  'scos_seo_title',
  'scos_seo_description',
  'scos_seo_breadcrumb_title',
  'scos_seo_tldr',
  'scos_seo_robots',
  'scos_seo_canonical',
  'scos_seo_sitemap_exclude',
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

/** Post types that must never sync into asset_pages, on any site, regardless of asset config. */
export const GLOBAL_EXCLUDED_POST_TYPES = ['bw_reviews'] as const

/** SCOS post-meta flag — when truthy, the page is deliberately kept out of the sitemap/index. */
export const SITEMAP_EXCLUDE_META_KEY = 'scos_seo_sitemap_exclude'

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

export type WpTypeInfo = {
  slug: string
  restBase: string
}

type WpTypesResponse = Record<
  string,
  {
    slug?: string
    rest_base?: string
    visibility?: { public?: boolean; publicly_queryable?: boolean }
  }
>

/** Discover REST-exposed post types via /wp/v2/types (WP only exposes show_in_rest types here). */
export async function fetchPublicPostTypes(
  siteUrl: string,
  username: string,
  appPassword: string,
): Promise<WpTypeInfo[]> {
  const base = normalizeSiteUrl(siteUrl)
  const res = await fetch(`${base}/wp-json/wp/v2/types`, {
    headers: {
      Authorization: basicAuthHeader(username, appPassword),
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch post types (HTTP ${res.status})`)
  }
  const json = (await res.json()) as WpTypesResponse
  const types: WpTypeInfo[] = []
  for (const [slug, info] of Object.entries(json)) {
    // Some plugins register admin-only REST types; skip if explicitly marked non-public.
    if (info.visibility && info.visibility.public === false) continue
    types.push({ slug, restBase: info.rest_base ?? restBaseForPostType(slug) })
  }
  return types
}

/**
 * Resolve which post types to sync for an asset: auto-discovered public REST types by default,
 * narrowed to an explicit per-asset allow-list if provided — always minus the global excludes.
 */
export async function resolvePostTypesToSync(
  siteUrl: string,
  username: string,
  appPassword: string,
  configPostTypes?: string[],
): Promise<WpTypeInfo[]> {
  const excluded = new Set<string>(GLOBAL_EXCLUDED_POST_TYPES)
  const discovered = await fetchPublicPostTypes(siteUrl, username, appPassword)
  const discoveredBySlug = new Map(discovered.map((t) => [t.slug, t]))

  if (configPostTypes?.length) {
    return configPostTypes
      .filter((slug) => !excluded.has(slug))
      .map((slug) => discoveredBySlug.get(slug) ?? { slug, restBase: restBaseForPostType(slug) })
  }

  return discovered.filter((t) => !excluded.has(t.slug))
}

/** True when SCOS has flagged this page to be kept out of the sitemap/index. */
export function isSitemapExcluded(post: WpPostRow): boolean {
  const raw = post.meta?.[SITEMAP_EXCLUDE_META_KEY]
  if (raw == null) return false
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw === 1
  if (typeof raw === 'string') return ['1', 'true', 'yes'].includes(raw.toLowerCase())
  return false
}

export async function fetchAllPublishedPosts(
  siteUrl: string,
  username: string,
  appPassword: string,
  restBase: string,
): Promise<WpPostRow[]> {
  const base = normalizeSiteUrl(siteUrl)
  const auth = basicAuthHeader(username, appPassword)
  const rows: WpPostRow[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
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
