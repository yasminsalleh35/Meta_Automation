
import { useState, useEffect } from 'react';

interface DashboardMetrics {
  totalInvested: number;
  totalRevenue: number;
  leadsGenerated: number;
  activeCampaigns: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpa: number;
  roas: number;
  reach: number;
  conversions: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

export const useMetrics = (dateRange: DateRange) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvested: 3409.34,
    totalRevenue: 8950.30,
    leadsGenerated: 247,
    activeCampaigns: 8,
    impressions: 353435,
    clicks: 1200,
    ctr: 1.90,
    cpa: 9.92,
    roas: 3.65,
    reach: 130342,
    conversions: 90
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      
      // Simular chamada de API com base no período selecionado
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      // Simular dados diferentes baseados no período
      let multiplier = 1;
      if (daysDiff <= 1) {
        multiplier = 0.1; // Dados do dia
      } else if (daysDiff <= 15) {
        multiplier = 0.5; // 15 dias
      } else if (daysDiff <= 30) {
        multiplier = 1; // 30 dias
      } else {
        multiplier = 1.5; // Período maior
      }

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));

      setMetrics({
        totalInvested: Math.round(3409.34 * multiplier * 100) / 100,
        totalRevenue: Math.round(8950.30 * multiplier * 100) / 100,
        leadsGenerated: Math.round(247 * multiplier),
        activeCampaigns: 8,
        impressions: Math.round(353435 * multiplier),
        clicks: Math.round(1200 * multiplier),
        ctr: Math.round(1.90 * (0.8 + Math.random() * 0.4) * 100) / 100,
        cpa: Math.round(9.92 * (0.8 + Math.random() * 0.4) * 100) / 100,
        roas: Math.round(3.65 * (0.8 + Math.random() * 0.4) * 100) / 100,
        reach: Math.round(130342 * multiplier),
        conversions: Math.round(90 * multiplier)
      });

      setLoading(false);
    };

    fetchMetrics();
  }, [dateRange]);

  return { metrics, loading };
};
