import type { Asset } from './pipeline'

export type MetricsSnapshot = {
  id: number
  asset_id: number
  period_label: string
  snapshot_type: string
  clicks: number | null
  clicks_delta: number | null
  impressions: number | null
  impressions_delta: number | null
  ctr: number | null
  ctr_delta: number | null
  avg_rank: number | null
  avg_rank_delta: number | null
  conversions: number | null
  created_at: string
}

export type AssetConnection = {
  id: number
  asset_id: number
  provider: string
  status: string
  config: Record<string, unknown>
  secret_ref: string
  last_sync_at: string | null
  last_error: string
  version: number
  created_at: string
  updated_at: string
}

export type GscConnectionConfig = {
  site_url?: string
  gsc_property?: string
  domain?: string
}

export type WpConnectionConfig = {
  site_url?: string
  wp_username?: string
  post_types?: string[]
  meta_keys?: string[]
  taxonomies?: string[]
}

export type AssetPage = {
  id: number
  asset_id: number
  url_path: string
  canonical_url: string
  wp_post_id: number | null
  wp_post_type: string
  title: string
  is_priority: boolean
  scos_next_step: string
  scos_index_status: string
  topic_slug: string
  cluster_slug: string
  wp_meta_snapshot: Record<string, unknown>
  meta_synced_at: string | null
  version: number
  created_at: string
  updated_at: string
}

export type PageMetricsCurrent = {
  id: number
  asset_page_id: number
  period_start: string
  period_end: string
  impressions: number
  impressions_delta: number
  clicks: number
  clicks_delta: number
  ctr: number
  ctr_delta: number
  avg_position: number
  avg_position_delta: number
  pulled_at: string
}

export type SeoOpportunity = {
  id: number
  asset_id: number
  asset_page_id: number
  opportunity_type: string
  problem: string
  priority: 'high' | 'medium' | 'low'
  recommended_workflow: string
  status: string
  impressions: number
  clicks: number
  ctr: number
  avg_position: number
  impact_score: number | null
  evidence_json: Record<string, unknown>
  task_id: number | null
  detected_at: string
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export function pageMetricsMap(
  rows: PageMetricsCurrent[],
): Map<number, PageMetricsCurrent> {
  return new Map(rows.map((r) => [r.asset_page_id, r]))
}

export const OPPORTUNITY_TYPE_LABEL: Record<string, string> = {
  low_ctr: 'Low CTR',
  striking_distance: 'Striking distance',
}

/** Managed sites for SEO views — include website until seed uses managed_website. */
export function isSeoMonitoredAsset(a: Asset): boolean {
  return (
    (a.asset_type === 'managed_website' || a.asset_type === 'website') &&
    Boolean(a.asset_url.trim())
  )
}

export function latestSnapshotByAsset(
  snapshots: MetricsSnapshot[],
): Map<number, MetricsSnapshot> {
  const map = new Map<number, MetricsSnapshot>()
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  for (const row of sorted) {
    if (!map.has(row.asset_id)) map.set(row.asset_id, row)
  }
  return map
}

export const ASSET_DOT_COLORS = [
  '#1F7A43',
  '#2563EB',
  '#7C3AED',
  '#C0392B',
  '#54636B',
  '#D9A021',
] as const

export function assetDotColor(assetId: number, ids: number[]): string {
  const idx = ids.indexOf(assetId)
  return ASSET_DOT_COLORS[(idx < 0 ? 0 : idx) % ASSET_DOT_COLORS.length]
}

export function fmtInt(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString('en-US')
}

export function fmtCtr(n: number | null | undefined): string {
  return `${Number(n ?? 0).toFixed(2)}%`
}

export function fmtRank(n: number | null | undefined): string {
  return Number(n ?? 0).toFixed(1)
}

export function fmtDelta(n: number | null | undefined, suffix = ''): string {
  const v = Number(n ?? 0)
  const sign = v >= 0 ? '+' : ''
  return `${sign}${fmtInt(v)}${suffix}`
}

export function fmtCtrDelta(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2)} pts`
}

export function fmtRankDelta(n: number | null | undefined): string {
  const v = Math.abs(Number(n ?? 0))
  const better = Number(n ?? 0) <= 0
  return `${v.toFixed(1)} ${better ? 'better' : 'worse'}`
}
