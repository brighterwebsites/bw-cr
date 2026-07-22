/** Rule-based SEO opportunity detection — no LLM. */

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

export function detectLowCtr(page: PageMetricsInput): DetectedOpportunity | null {
  const minImpressions = 1000
  if (page.impressions < minImpressions) return null

  const expected = expectedCtr(page.avg_position)
  const threshold = expected * 0.65
  if (page.ctr >= threshold) return null

  const lost = estimateLostClicks(page.impressions, page.ctr, expected)

  return {
    opportunity_type: 'low_ctr',
    problem: `CTR ${page.ctr.toFixed(2)}% on ${Math.round(page.impressions).toLocaleString('en-US')} impr — ~${lost.toLocaleString('en-US')} clicks/mo lost`,
    priority: page.impressions >= 5000 ? 'high' : 'medium',
    recommended_workflow: 'Low-CTR title/meta update',
    impressions: page.impressions,
    clicks: page.clicks,
    ctr: page.ctr,
    avg_position: page.avg_position,
    impact_score: lost,
    evidence_json: {
      rule: 'low_ctr',
      min_impressions: minImpressions,
      expected_ctr: expected,
      threshold_ctr: threshold,
      lost_clicks_estimate: lost,
      url_path: page.url_path,
    },
  }
}

export function detectStrikingDistance(page: PageMetricsInput): DetectedOpportunity | null {
  const minImpressions = 500
  if (page.impressions < minImpressions) return null
  if (page.avg_position < 11 || page.avg_position > 20) return null

  return {
    opportunity_type: 'striking_distance',
    problem: `Position ${page.avg_position.toFixed(1)} with ${Math.round(page.impressions).toLocaleString('en-US')} impr — page 2 upgrade candidate`,
    priority: page.impressions >= 2000 ? 'high' : 'medium',
    recommended_workflow: 'Striking distance content refresh',
    impressions: page.impressions,
    clicks: page.clicks,
    ctr: page.ctr,
    avg_position: page.avg_position,
    impact_score: page.impressions,
    evidence_json: {
      rule: 'striking_distance',
      min_impressions: minImpressions,
      position_min: 11,
      position_max: 20,
      url_path: page.url_path,
    },
  }
}

export function detectOpportunities(page: PageMetricsInput): DetectedOpportunity[] {
  const results: DetectedOpportunity[] = []
  const lowCtr = detectLowCtr(page)
  if (lowCtr) results.push(lowCtr)
  const striking = detectStrikingDistance(page)
  if (striking) results.push(striking)
  return results
}
