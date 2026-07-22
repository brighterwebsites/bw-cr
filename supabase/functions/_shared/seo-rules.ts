/** Rule-based SEO opportunity detection — no LLM.
 *
 * Thresholds are SITE-RELATIVE: each asset's own impression distribution
 * sets the bar for what counts as "meaningful traffic" on that site, so a
 * 40-post local site and a 500-page site both surface real opportunities
 * instead of one absolute number favouring whichever site is bigger.
 */

export type OpportunityType = 'low_ctr' | 'striking_distance'
export type OpportunityPriority = 'high' | 'medium' | 'low'

export type PageMetricsInput = {
  asset_page_id: number
  asset_id: number
  url_path: string
  impressions: number
  clicks: number
  ctr: number
  avg_position: number
}

export type DetectedOpportunity = {
  opportunity_type: OpportunityType
  problem: string
  priority: OpportunityPriority
  recommended_workflow: string
  impressions: number
  clicks: number
  ctr: number
  avg_position: number
  impact_score: number
  evidence_json: Record<string, unknown>
}

export type RuleThresholds = {
  /** Below this, a page's traffic is too thin to score reliably (absolute floor). */
  minImpressionsLowCtr: number
  minImpressionsStriking: number
  /** Above this, an opportunity is upgraded to high priority (site-relative). */
  highImpressionsLowCtr: number
  highImpressionsStriking: number
  /** Diagnostics — what the thresholds were derived from. */
  sampleSize: number
  medianImpressions: number
  p75Impressions: number
}

const ABSOLUTE_FLOOR_LOW_CTR = 100
const ABSOLUTE_FLOOR_STRIKING = 50

function percentile(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return 0
  if (sortedAsc.length === 1) return sortedAsc[0]
  const idx = p * (sortedAsc.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sortedAsc[lower]
  const frac = idx - lower
  return sortedAsc[lower] + (sortedAsc[upper] - sortedAsc[lower]) * frac
}

/**
 * Derive per-site thresholds from that site's own page impressions.
 * Median sets the "meaningful traffic" floor (min); p75 sets the
 * "clearly significant traffic" floor (high priority upgrade).
 * Absolute floors prevent noise on near-zero-traffic pages regardless
 * of how small the rest of the site is.
 */
export function computeSiteThresholds(allImpressions: number[]): RuleThresholds {
  const positive = allImpressions.filter((n) => n > 0).sort((a, b) => a - b)
  const median = percentile(positive, 0.5)
  const p75 = percentile(positive, 0.75)

  return {
    minImpressionsLowCtr: Math.max(ABSOLUTE_FLOOR_LOW_CTR, Math.round(median)),
    minImpressionsStriking: Math.max(ABSOLUTE_FLOOR_STRIKING, Math.round(median / 2)),
    highImpressionsLowCtr: Math.max(
      ABSOLUTE_FLOOR_LOW_CTR * 2,
      Math.round(p75 * 2),
    ),
    highImpressionsStriking: Math.max(
      ABSOLUTE_FLOOR_STRIKING * 2,
      Math.round(p75),
    ),
    sampleSize: positive.length,
    medianImpressions: Math.round(median),
    p75Impressions: Math.round(p75),
  }
}

/** Expected CTR (%) by average position band — industry rough curve. */
export function expectedCtr(position: number): number {
  if (position <= 1) return 28
  if (position <= 2) return 15
  if (position <= 3) return 11
  if (position <= 4) return 8
  if (position <= 5) return 6
  if (position <= 7) return 4
  if (position <= 10) return 2.5
  if (position <= 15) return 1.5
  if (position <= 20) return 1
  return 0.5
}

function estimateLostClicks(impressions: number, actualCtr: number, expected: number): number {
  const gap = Math.max(0, expected - actualCtr)
  return Math.round((impressions * gap) / 100)
}

export function detectLowCtr(
  page: PageMetricsInput,
  thresholds: RuleThresholds,
): DetectedOpportunity | null {
  if (page.impressions < thresholds.minImpressionsLowCtr) return null

  const expected = expectedCtr(page.avg_position)
  const threshold = expected * 0.65
  if (page.ctr >= threshold) return null

  const lost = estimateLostClicks(page.impressions, page.ctr, expected)

  return {
    opportunity_type: 'low_ctr',
    problem: `CTR ${page.ctr.toFixed(2)}% on ${Math.round(page.impressions).toLocaleString('en-US')} impr — ~${lost.toLocaleString('en-US')} clicks/mo lost`,
    priority: page.impressions >= thresholds.highImpressionsLowCtr ? 'high' : 'medium',
    recommended_workflow: 'Low-CTR title/meta update',
    impressions: page.impressions,
    clicks: page.clicks,
    ctr: page.ctr,
    avg_position: page.avg_position,
    impact_score: lost,
    evidence_json: {
      rule: 'low_ctr',
      min_impressions: thresholds.minImpressionsLowCtr,
      high_impressions: thresholds.highImpressionsLowCtr,
      site_median_impressions: thresholds.medianImpressions,
      site_p75_impressions: thresholds.p75Impressions,
      site_sample_size: thresholds.sampleSize,
      expected_ctr: expected,
      threshold_ctr: threshold,
      lost_clicks_estimate: lost,
      url_path: page.url_path,
    },
  }
}

export function detectStrikingDistance(
  page: PageMetricsInput,
  thresholds: RuleThresholds,
): DetectedOpportunity | null {
  if (page.impressions < thresholds.minImpressionsStriking) return null
  if (page.avg_position < 11 || page.avg_position > 20) return null

  return {
    opportunity_type: 'striking_distance',
    problem: `Position ${page.avg_position.toFixed(1)} with ${Math.round(page.impressions).toLocaleString('en-US')} impr — page 2 upgrade candidate`,
    priority: page.impressions >= thresholds.highImpressionsStriking ? 'high' : 'medium',
    recommended_workflow: 'Striking distance content refresh',
    impressions: page.impressions,
    clicks: page.clicks,
    ctr: page.ctr,
    avg_position: page.avg_position,
    impact_score: page.impressions,
    evidence_json: {
      rule: 'striking_distance',
      min_impressions: thresholds.minImpressionsStriking,
      high_impressions: thresholds.highImpressionsStriking,
      site_median_impressions: thresholds.medianImpressions,
      site_p75_impressions: thresholds.p75Impressions,
      site_sample_size: thresholds.sampleSize,
      position_min: 11,
      position_max: 20,
      url_path: page.url_path,
    },
  }
}

export function detectOpportunities(
  page: PageMetricsInput,
  thresholds: RuleThresholds,
): DetectedOpportunity[] {
  const results: DetectedOpportunity[] = []
  const lowCtr = detectLowCtr(page, thresholds)
  if (lowCtr) results.push(lowCtr)
  const striking = detectStrikingDistance(page, thresholds)
  if (striking) results.push(striking)
  return results
}
