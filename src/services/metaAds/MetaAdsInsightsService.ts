
export class MetaAdsInsightsService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  // Get campaign insights with advanced metrics
  async getCampaignInsights(adId: string, accessToken: string, options?: {
    dateRange?: { since: string; until: string };
    breakdown?: string[];
    level?: 'account' | 'campaign' | 'adset' | 'ad';
  }): Promise<any> {
    const defaultFields = [
      'impressions',
      'clicks',
      'spend',
      'actions',
      'cost_per_action_type',
      'cpm',
      'cpc',
      'ctr',
      'reach',
      'frequency',
      'conversion_rate_ranking',
      'engagement_rate_ranking',
      'quality_ranking',
      'video_play_actions',
      'video_play_curve_actions',
      'website_ctr'
    ];

    const params = new URLSearchParams({
      access_token: accessToken,
      fields: defaultFields.join(','),
      level: options?.level || 'ad'
    });

    // Add date range if specified
    if (options?.dateRange) {
      params.append('time_range', JSON.stringify({
        since: options.dateRange.since,
        until: options.dateRange.until
      }));
    }

    // Add breakdown if specified
    if (options?.breakdown && options.breakdown.length > 0) {
      params.append('breakdowns', options.breakdown.join(','));
    }

    const url = `${this.baseUrl}/${adId}/insights?${params.toString()}`;
    console.log('Fetching insights from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch campaign insights');
    }

    const data = await response.json();
    return data.data || [];
  }

  // Get demographic insights
  async getDemographicInsights(adId: string, accessToken: string): Promise<any> {
    return this.getCampaignInsights(adId, accessToken, {
      breakdown: ['age', 'gender']
    });
  }

  // Get placement insights
  async getPlacementInsights(adId: string, accessToken: string): Promise<any> {
    return this.getCampaignInsights(adId, accessToken, {
      breakdown: ['publisher_platform', 'platform_position']
    });
  }

  // Get device insights
  async getDeviceInsights(adId: string, accessToken: string): Promise<any> {
    return this.getCampaignInsights(adId, accessToken, {
      breakdown: ['device_platform']
    });
  }

  // Get conversion insights
  async getConversionInsights(adId: string, accessToken: string): Promise<any> {
    const fields = [
      'actions',
      'action_values',
      'conversions',
      'conversion_values',
      'cost_per_action_type',
      'cost_per_conversion'
    ];

    const params = new URLSearchParams({
      access_token: accessToken,
      fields: fields.join(','),
      level: 'ad'
    });

    const response = await fetch(`${this.baseUrl}/${adId}/insights?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch conversion insights');
    }

    const data = await response.json();
    return data.data?.[0] || {};
  }
}

export const metaAdsInsightsService = new MetaAdsInsightsService();
