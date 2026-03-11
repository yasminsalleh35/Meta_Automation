
import { useState, useEffect } from 'react';

interface BreakdownData {
  deviceBreakdown: Array<{
    device: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    percentage: number;
    color: string;
  }>;
  platformBreakdown: Array<{
    platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    percentage: number;
    color: string;
  }>;
  placementBreakdown: Array<{
    placement: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    percentage: number;
  }>;
  timeComparison: {
    currentPeriod: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      cpc: number;
    };
    previousPeriod: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      cpc: number;
    };
    changes: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      cpc: number;
    };
  };
}

export const useBreakdownAnalysis = (campaignIds: string[], dateRange: { from: Date; to: Date }) => {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (campaignIds.length === 0) {
      setData(null);
      return;
    }

    setIsLoading(true);

    const generateBreakdownData = (): BreakdownData => {
      const currentPeriod = {
        spend: 8900,
        impressions: 125000,
        clicks: 3200,
        conversions: 102,
        ctr: 2.56,
        cpc: 2.78
      };

      const previousPeriod = {
        spend: 7200,
        impressions: 98000,
        clicks: 2450,
        conversions: 78,
        ctr: 2.50,
        cpc: 2.94
      };

      return {
        deviceBreakdown: [
          {
            device: 'Mobile',
            spend: 5340,
            impressions: 78000,
            clicks: 2080,
            ctr: 2.67,
            cpc: 2.57,
            conversions: 68,
            percentage: 60.0,
            color: '#3B82F6'
          },
          {
            device: 'Desktop',
            spend: 2670,
            impressions: 35000,
            clicks: 840,
            ctr: 2.40,
            cpc: 3.18,
            conversions: 24,
            percentage: 30.0,
            color: '#10B981'
          },
          {
            device: 'Tablet',
            spend: 890,
            impressions: 12000,
            clicks: 280,
            ctr: 2.33,
            cpc: 3.18,
            conversions: 10,
            percentage: 10.0,
            color: '#F59E0B'
          }
        ],
        platformBreakdown: [
          {
            platform: 'Facebook',
            spend: 4450,
            impressions: 62500,
            clicks: 1600,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 51,
            percentage: 50.0,
            color: '#1877F2'
          },
          {
            platform: 'Instagram',
            spend: 3560,
            impressions: 50000,
            clicks: 1280,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 41,
            percentage: 40.0,
            color: '#E4405F'
          },
          {
            platform: 'Audience Network',
            spend: 890,
            impressions: 12500,
            clicks: 320,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 10,
            percentage: 10.0,
            color: '#42B883'
          }
        ],
        placementBreakdown: [
          {
            placement: 'Feed',
            spend: 3560,
            impressions: 50000,
            clicks: 1280,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 41,
            percentage: 40.0
          },
          {
            placement: 'Stories',
            spend: 2670,
            impressions: 37500,
            clicks: 960,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 31,
            percentage: 30.0
          },
          {
            placement: 'Reels',
            spend: 1780,
            impressions: 25000,
            clicks: 640,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 20,
            percentage: 20.0
          },
          {
            placement: 'In-stream Video',
            spend: 890,
            impressions: 12500,
            clicks: 320,
            ctr: 2.56,
            cpc: 2.78,
            conversions: 10,
            percentage: 10.0
          }
        ],
        timeComparison: {
          currentPeriod,
          previousPeriod,
          changes: {
            spend: ((currentPeriod.spend - previousPeriod.spend) / previousPeriod.spend) * 100,
            impressions: ((currentPeriod.impressions - previousPeriod.impressions) / previousPeriod.impressions) * 100,
            clicks: ((currentPeriod.clicks - previousPeriod.clicks) / previousPeriod.clicks) * 100,
            conversions: ((currentPeriod.conversions - previousPeriod.conversions) / previousPeriod.conversions) * 100,
            ctr: ((currentPeriod.ctr - previousPeriod.ctr) / previousPeriod.ctr) * 100,
            cpc: ((currentPeriod.cpc - previousPeriod.cpc) / previousPeriod.cpc) * 100
          }
        }
      };
    };

    // Simular delay de API
    setTimeout(() => {
      setData(generateBreakdownData());
      setIsLoading(false);
    }, 1000);

  }, [campaignIds, dateRange]);

  return {
    data,
    isLoading
  };
};
