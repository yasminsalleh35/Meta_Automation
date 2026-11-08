
import { useState, useEffect, useMemo } from 'react';

interface Alert {
  id: string;
  type: 'performance' | 'budget' | 'audience' | 'creative';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  campaignName: string;
  timeAgo?: string;
  value?: number;
  threshold?: number;
}

interface Recommendation {
  id: string;
  type: 'budget' | 'targeting' | 'creative' | 'bidding';
  title: string;
  description: string;
  impact?: string;
  campaignName: string;
}

interface AlertSettings {
  [key: string]: {
    enabled: boolean;
    label: string;
    description: string;
    threshold?: number;
  };
}

export const usePerformanceAlerts = (data: any) => {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    lowCTR: {
      enabled: true,
      label: 'CTR Baixo',
      description: 'Alertar quando CTR for menor que 1.5%',
      threshold: 1.5
    },
    highCPC: {
      enabled: true,
      label: 'CPC Alto',
      description: 'Alertar quando CPC for maior que R$ 5.00',
      threshold: 5.0
    },
    // audit DATA-01: lowConversions / budgetDepletion / audienceOverlap were
    // removed — no real conversion, budget-consumption or overlap data reaches
    // this hook, so those alerts could only ever be fabricated.
  });

  // Gerar alertas baseado nos dados e configurações
  // audit DATA-01: only campaigns with real delivery (impressions > 0) are
  // evaluated, and no invented "detected X hours ago" timestamps are shown.
  const alerts: Alert[] = useMemo(() => {
    if (!data?.campaigns) return [];

    const generatedAlerts: Alert[] = [];

    data.campaigns.forEach((campaign: any) => {
      if (!(Number(campaign.impressions) > 0)) return;

      // Alerta de CTR baixo
      if (alertSettings.lowCTR.enabled && campaign.ctr < (alertSettings.lowCTR.threshold || 1.5)) {
        generatedAlerts.push({
          id: `ctr-${campaign.id}`,
          type: 'performance',
          severity: campaign.ctr < 1.0 ? 'critical' : 'warning',
          title: 'CTR abaixo do esperado',
          description: `CTR de ${campaign.ctr.toFixed(2)}% está abaixo do limite de ${alertSettings.lowCTR.threshold}%`,
          campaignName: campaign.name,
          value: campaign.ctr,
          threshold: alertSettings.lowCTR.threshold
        });
      }

      // Alerta de CPC alto
      if (alertSettings.highCPC.enabled && campaign.cpc > (alertSettings.highCPC.threshold || 5.0)) {
        generatedAlerts.push({
          id: `cpc-${campaign.id}`,
          type: 'budget',
          severity: campaign.cpc > 10.0 ? 'critical' : 'warning',
          title: 'CPC muito alto',
          description: `CPC de R$ ${campaign.cpc.toFixed(2)} está acima do limite de R$ ${alertSettings.highCPC.threshold?.toFixed(2)}`,
          campaignName: campaign.name,
          value: campaign.cpc,
          threshold: alertSettings.highCPC.threshold
        });
      }
    });

    return generatedAlerts;
  }, [data, alertSettings]);

  // Gerar recomendações baseado nos dados
  const recommendations: Recommendation[] = useMemo(() => {
    if (!data?.campaigns) return [];

    const generatedRecommendations: Recommendation[] = [];

    // audit DATA-01: recommendations no longer promise invented impact numbers
    // ("+25% em conversões") and the conversion-based rule was dropped (no real
    // conversion data reaches this hook).
    data.campaigns.forEach((campaign: any) => {
      // Recomendação de segmentação
      if (campaign.ctr < 2.0 && campaign.impressions > 10000) {
        generatedRecommendations.push({
          id: `targeting-${campaign.id}`,
          type: 'targeting',
          title: 'Refinar segmentação',
          description: 'Muitas impressões com baixo CTR indicam segmentação muito ampla. Tente ser mais específico.',
          campaignName: campaign.name
        });
      }

      // Recomendação de criativo
      if (campaign.frequency && campaign.frequency > 3.0) {
        generatedRecommendations.push({
          id: `creative-${campaign.id}`,
          type: 'creative',
          title: 'Renovar criativos',
          description: 'Alta frequência pode causar fadiga do anúncio. Teste novos criativos para manter o engajamento.',
          campaignName: campaign.name
        });
      }
    });

    return generatedRecommendations;
  }, [data]);

  const updateAlertSettings = (key: string, newSettings: any) => {
    setAlertSettings(prev => ({
      ...prev,
      [key]: newSettings
    }));
  };

  return {
    alerts,
    recommendations,
    alertSettings,
    updateAlertSettings
  };
};
