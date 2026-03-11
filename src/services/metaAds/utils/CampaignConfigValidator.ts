
import { CampaignCreationData } from '../types';

export class CampaignConfigValidator {
  /**
   * Valida configurações específicas para Click-to-WhatsApp (CTWA) v23.0
   */
  static validateCTWAConfig(params: {
    objective: string;
    optimizationGoal: string;
    billingEvent: string;
    destinationType?: string;
    promotedObjectPageId?: string;
  }): { isValid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];

    // Validar objective para CTWA v23.0
    if (params.objective !== 'OUTCOME_ENGAGEMENT') {
      return {
        isValid: false,
        error: 'CTWA campaigns require objective: OUTCOME_ENGAGEMENT (Meta API v23.0)'
      };
    }

    // Validar optimization_goal
    if (params.optimizationGoal !== 'CONVERSATIONS') {
      return {
        isValid: false,
        error: 'CTWA campaigns require optimization_goal: CONVERSATIONS'
      };
    }

    // Validar billing_event
    if (params.billingEvent !== 'IMPRESSIONS') {
      return {
        isValid: false,
        error: 'CTWA campaigns require billing_event: IMPRESSIONS'
      };
    }

    // Validar destination_type
    if (params.destinationType && params.destinationType !== 'WHATSAPP') {
      warnings.push('destination_type should be WHATSAPP for CTWA campaigns');
    }

    // Validar promoted_object.page_id
    if (!params.promotedObjectPageId) {
      return {
        isValid: false,
        error: 'CTWA campaigns require promoted_object.page_id in AdSet'
      };
    }

    return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  /**
   * Retorna configuração recomendada para CTWA v23.0
   */
  static getCTWARecommendedConfig() {
    return {
      campaignObjective: 'OUTCOME_ENGAGEMENT',
      optimizationGoal: 'CONVERSATIONS',
      billingEvent: 'IMPRESSIONS',
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      destinationType: 'WHATSAPP',
      apiVersion: 'v23.0',
      description: 'Click-to-WhatsApp campaign configuration for Meta API v23.0',
      platforms: ['facebook', 'instagram'],
      placements: {
        facebook: ['feed', 'video_feeds', 'story'],
        instagram: ['stream', 'story', 'reels']
      },
      devices: ['mobile']
    };
  }

  /**
   * Validates campaign and adset configuration compatibility
   */
  static validateCampaignAdSetCompatibility(
    campaignObjective: string,
    optimizationGoal: string,
    billingEvent: string
  ): { isValid: boolean; error?: string; warnings?: string[] } {
    const warnings: string[] = [];
    
    // Validate OUTCOME_TRAFFIC campaign compatibility
    if (campaignObjective === 'OUTCOME_TRAFFIC') {
      const compatibleOptimizationGoals = [
        'OFFSITE_CONVERSIONS',
        'LINK_CLICKS',
        'LANDING_PAGE_VIEWS'
      ];
      
      if (!compatibleOptimizationGoals.includes(optimizationGoal)) {
        return {
          isValid: false,
          error: `Optimization goal '${optimizationGoal}' is not compatible with campaign objective '${campaignObjective}'. Use: ${compatibleOptimizationGoals.join(', ')}`
        };
      }
      
      // Validate billing event compatibility
      const compatibleBillingEvents: { [key: string]: string[] } = {
        'OFFSITE_CONVERSIONS': ['LINK_CLICKS', 'IMPRESSIONS'],
        'LINK_CLICKS': ['LINK_CLICKS', 'IMPRESSIONS'],
        'LANDING_PAGE_VIEWS': ['IMPRESSIONS']
      };
      
      const allowedBillingEvents = compatibleBillingEvents[optimizationGoal] || [];
      if (!allowedBillingEvents.includes(billingEvent)) {
        warnings.push(
          `Billing event '${billingEvent}' may not be optimal for optimization goal '${optimizationGoal}'. Consider: ${allowedBillingEvents.join(', ')}`
        );
      }
    }
    
    return { isValid: true, warnings };
  }

  /**
   * Validates WhatsApp campaign configuration
   */
  static validateWhatsAppCampaign(campaignData: CampaignCreationData): {
    isValid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const warnings: string[] = [];
    
    // Validate WhatsApp link format
    if (!campaignData.link_whatsapp || !campaignData.link_whatsapp.startsWith('https://wa.me/')) {
      return {
        isValid: false,
        error: 'WhatsApp link must start with https://wa.me/ and include a valid phone number'
      };
    }
    
    // Validate phone number format in WhatsApp link
    const phoneMatch = campaignData.link_whatsapp.match(/https:\/\/wa\.me\/(\d+)/);
    if (!phoneMatch || phoneMatch[1].length < 10) {
      return {
        isValid: false,
        error: 'WhatsApp link must contain a valid phone number with country code'
      };
    }
    
    // Check for recommended configuration
    if (!campaignData.copy || campaignData.copy.length < 10) {
      warnings.push('Ad copy is very short. Consider adding more compelling content.');
    }
    
    if (campaignData.daily_budget && campaignData.daily_budget < 30) {
      warnings.push('Daily budget below R$30 may limit campaign reach and performance.');
    }
    
    return { isValid: true, warnings };
  }

  /**
   * Get recommended configuration for campaign type
   */
  static getRecommendedConfig(campaignType: 'whatsapp' | 'website' | 'leads' | 'ctwa') {
    const configs = {
      ctwa: {
        campaignObjective: 'OUTCOME_ENGAGEMENT',
        optimizationGoal: 'CONVERSATIONS',
        billingEvent: 'IMPRESSIONS',
        bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
        destinationType: 'WHATSAPP',
        apiVersion: 'v23.0',
        description: 'Click-to-WhatsApp optimized for conversations (Meta API v23.0)'
      },
      whatsapp: {
        campaignObjective: 'OUTCOME_TRAFFIC',
        optimizationGoal: 'OFFSITE_CONVERSIONS',
        billingEvent: 'LINK_CLICKS',
        description: 'Optimized for driving traffic to WhatsApp (legacy)'
      },
      website: {
        campaignObjective: 'OUTCOME_TRAFFIC',
        optimizationGoal: 'LINK_CLICKS',
        billingEvent: 'LINK_CLICKS',
        description: 'Optimized for website visits'
      },
      leads: {
        campaignObjective: 'OUTCOME_LEADS',
        optimizationGoal: 'LEAD_GENERATION',
        billingEvent: 'IMPRESSIONS',
        description: 'Optimized for lead generation'
      }
    };
    
    return configs[campaignType];
  }
}
