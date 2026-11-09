
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

// audit DATA-01: os números daqui eram inventados (estáticos). Até o rebuild com
// breakdowns reais da Meta, o hook não devolve dados e o componente mostra o estado vazio.
export const useBreakdownAnalysis = (_campaignIds: string[], _dateRange: { from: Date; to: Date }) => {
  return {
    data: null as BreakdownData | null,
    isLoading: false
  };
};
