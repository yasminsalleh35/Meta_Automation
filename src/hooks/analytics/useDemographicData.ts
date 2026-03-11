
import { useState, useEffect } from 'react';

interface DemographicData {
  ageGroups: Array<{
    age: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
  }>;
  genderDistribution: Array<{
    gender: string;
    spend: number;
    percentage: number;
    color: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  topLocations: Array<{
    location: string;
    spend: number;
    clicks: number;
    impressions: number;
    ctr: number;
    conversions: number;
  }>;
  timeOfDay: Array<{
    hour: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  dayOfWeek: Array<{
    day: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

export const useDemographicData = (campaignIds: string[], dateRange: { from: Date; to: Date }) => {
  const [data, setData] = useState<DemographicData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (campaignIds.length === 0) {
      setData(null);
      return;
    }

    setIsLoading(true);
    
    // Simular dados demográficos mais detalhados
    const generateDemographicData = (): DemographicData => ({
      ageGroups: [
        { age: '18-24', spend: 1200, impressions: 15000, clicks: 320, ctr: 2.13, conversions: 12 },
        { age: '25-34', spend: 2800, impressions: 35000, clicks: 890, ctr: 2.54, conversions: 32 },
        { age: '35-44', spend: 2100, impressions: 28000, clicks: 670, ctr: 2.39, conversions: 28 },
        { age: '45-54', spend: 1600, impressions: 22000, clicks: 450, ctr: 2.05, conversions: 18 },
        { age: '55-64', spend: 800, impressions: 12000, clicks: 210, ctr: 1.75, conversions: 8 },
        { age: '65+', spend: 400, impressions: 8000, clicks: 120, ctr: 1.50, conversions: 4 }
      ],
      genderDistribution: [
        { gender: 'Feminino', spend: 4500, percentage: 52.3, color: '#F97316', impressions: 58000, clicks: 1520, ctr: 2.62 },
        { gender: 'Masculino', spend: 3800, percentage: 44.2, color: '#3B82F6', impressions: 48000, clicks: 1180, ctr: 2.46 },
        { gender: 'Não informado', spend: 300, percentage: 3.5, color: '#6B7280', impressions: 4000, clicks: 60, ctr: 1.50 }
      ],
      topLocations: [
        { location: 'São Paulo, SP', spend: 2800, clicks: 650, impressions: 28000, ctr: 2.32, conversions: 28 },
        { location: 'Rio de Janeiro, RJ', spend: 1900, clicks: 420, impressions: 19000, ctr: 2.21, conversions: 19 },
        { location: 'Belo Horizonte, MG', spend: 1200, clicks: 290, impressions: 12500, ctr: 2.32, conversions: 14 },
        { location: 'Brasília, DF', spend: 980, clicks: 230, impressions: 9800, ctr: 2.35, conversions: 12 },
        { location: 'Salvador, BA', spend: 850, clicks: 195, impressions: 8200, ctr: 2.38, conversions: 9 }
      ],
      timeOfDay: [
        { hour: '6h', spend: 180, impressions: 2400, clicks: 45, ctr: 1.88 },
        { hour: '9h', spend: 420, impressions: 5200, clicks: 128, ctr: 2.46 },
        { hour: '12h', spend: 580, impressions: 7800, clicks: 195, ctr: 2.50 },
        { hour: '15h', spend: 650, impressions: 8900, clicks: 220, ctr: 2.47 },
        { hour: '18h', spend: 720, impressions: 9200, clicks: 238, ctr: 2.59 },
        { hour: '21h', spend: 890, impressions: 11500, clicks: 295, ctr: 2.57 },
        { hour: '0h', spend: 320, impressions: 4200, clicks: 98, ctr: 2.33 }
      ],
      dayOfWeek: [
        { day: 'Segunda', spend: 1200, impressions: 15000, clicks: 380, ctr: 2.53 },
        { day: 'Terça', spend: 1180, impressions: 14800, clicks: 365, ctr: 2.47 },
        { day: 'Quarta', spend: 1250, impressions: 15200, clicks: 390, ctr: 2.57 },
        { day: 'Quinta', spend: 1320, impressions: 16000, clicks: 415, ctr: 2.59 },
        { day: 'Sexta', spend: 1450, impressions: 17500, clicks: 460, ctr: 2.63 },
        { day: 'Sábado', spend: 980, impressions: 12800, clicks: 320, ctr: 2.50 },
        { day: 'Domingo', spend: 820, impressions: 11200, clicks: 275, ctr: 2.46 }
      ]
    });

    // Simular delay de API
    setTimeout(() => {
      setData(generateDemographicData());
      setIsLoading(false);
    }, 800);

  }, [campaignIds, dateRange]);

  return {
    data,
    isLoading
  };
};
