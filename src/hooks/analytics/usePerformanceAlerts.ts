
import { useState, useEffect, useMemo } from 'react';

interface Alert {
  id: string;
  type: 'performance' | 'budget' | 'audience' | 'creative';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  campaignName: string;
  timeAgo: string;
  value?: number;
  threshold?: number;
}

interface Recommendation {
  id: string;
  type: 'budget' | 'targeting' | 'creative' | 'bidding';
  title: string;
  description: string;
  impact: string;
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
    lowConversions: {
      enabled: true,
      label: 'Poucas Conversões',
      description: 'Alertar quando campanha não gerar conversões em 7 dias',
      threshold: 7
    },
    budgetDepletion: {
      enabled: true,
      label: 'Orçamento Esgotando',
      description: 'Alertar quando orçamento estiver 80% consumido',
      threshold: 80
    },
    audienceOverlap: {
      enabled: false,
      label: 'Sobreposição de Audiência',
      description: 'Alertar sobre competição entre campanhas',
      threshold: 25
    }
  });

  // Gerar alertas baseado nos dados e configurações
  const alerts: Alert[] = useMemo(() => {
    if (!data?.campaigns) return [];

    const generatedAlerts: Alert[] = [];

    data.campaigns.forEach((campaign: any) => {
      // Alerta de CTR baixo
      if (alertSettings.lowCTR.enabled && campaign.ctr < (alertSettings.lowCTR.threshold || 1.5)) {
        generatedAlerts.push({
          id: `ctr-${campaign.id}`,
          type: 'performance',
          severity: campaign.ctr < 1.0 ? 'critical' : 'warning',
          title: 'CTR abaixo do esperado',
          description: `CTR de ${campaign.ctr.toFixed(2)}% está abaixo do limite de ${alertSettings.lowCTR.threshold}%`,
          campaignName: campaign.name,
          timeAgo: '2 horas',
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
          timeAgo: '1 hora',
          value: campaign.cpc,
          threshold: alertSettings.highCPC.threshold
        });
      }

      // Alerta de poucas conversões
      if (alertSettings.lowConversions.enabled && (campaign.conversions || 0) === 0) {
        generatedAlerts.push({
          id: `conv-${campaign.id}`,
          type: 'performance',
          severity: 'warning',
          title: 'Sem conversões',
          description: 'Campanha não gerou conversões nos últimos 7 dias',
          campaignName: campaign.name,
          timeAgo: '6 horas',
          value: campaign.conversions || 0
        });
      }
    });

    return generatedAlerts;
  }, [data, alertSettings]);

  // Gerar recomendações baseado nos dados
  const recommendations: Recommendation[] = useMemo(() => {
    if (!data?.campaigns) return [];

    const generatedRecommendations: Recommendation[] = [];

    data.campaigns.forEach((campaign: any) => {
      // Recomendação de ajuste de orçamento
      if (campaign.ctr > 3.0 && campaign.conversions > 5) {
        generatedRecommendations.push({
          id: `budget-${campaign.id}`,
          type: 'budget',
          title: 'Aumentar orçamento',
          description: 'Esta campanha está performando bem. Considere aumentar o orçamento para amplificar os resultados.',
          impact: '+25% em conversões estimadas',
          campaignName: campaign.name
        });
      }

      // Recomendação de segmentação
      if (campaign.ctr < 2.0 && campaign.impressions > 10000) {
        generatedRecommendations.push({
          id: `targeting-${campaign.id}`,
          type: 'targeting',
          title: 'Refinar segmentação',
          description: 'Muitas impressões com baixo CTR indicam segmentação muito ampla. Tente ser mais específico.',
          impact: '+40% no CTR estimado',
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
          impact: '+20% no CTR estimado',
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
