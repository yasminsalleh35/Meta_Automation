// Test mode configurations for campaigns
export interface CampaignTestMode {
  id: string;
  name: string;
  campaign: {
    objective: string;
  };
  adSet: {
    optimization_goal: string;
    billing_event: string;
    destination_type?: string;
  };
  creative: {
    call_to_action_type: string;
  };
  needsPageId: boolean;
  needsWhatsAppLink: boolean;
  description: string;
}

export const CAMPAIGN_TEST_MODES: Record<string, CampaignTestMode> = {
  wa_link_traffic: {
    id: 'wa_link_traffic',
    name: 'OUTCOME_TRAFFIC + LINK_CLICKS (WA.ME Link)',
    campaign: {
      objective: 'OUTCOME_TRAFFIC'
    },
    adSet: {
      optimization_goal: 'LINK_CLICKS',
      billing_event: 'IMPRESSIONS'
    },
    creative: {
      call_to_action_type: 'LEARN_MORE'
    },
    needsPageId: true,
    needsWhatsAppLink: true,
    description: 'Configuração para campanhas de tráfego com link wa.me externo. Objetivo OUTCOME_TRAFFIC + otimização LINK_CLICKS. Call-to-action: LEARN_MORE (compatível com API v23.0)'
  }
};
