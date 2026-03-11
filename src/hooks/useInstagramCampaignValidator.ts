
import { useState, useEffect } from 'react';
import { useMetaAdsIntegration } from './useMetaAdsIntegration';
import { metaAdsCreativeEditService } from '@/services/metaAds/services/MetaAdsCreativeEditService';
import { instagramAutoRepairService, CampaignRepairSummary } from '@/services/metaAds/services/InstagramAutoRepairService';

export interface CampaignValidationResult {
  campaignId: string;
  campaignName: string;
  pageId: string;
  creativeIds: string[];
  hasInstagramIssues: boolean;
  needsRepair: boolean;
}

export const useInstagramCampaignValidator = () => {
  const { existingIntegration } = useMetaAdsIntegration();
  const [validationResults, setValidationResults] = useState<CampaignValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  /**
   * Valida uma campanha específica para problemas de Instagram
   */
  const validateCampaign = async (
    campaignId: string,
    campaignName: string,
    pageId: string,
    creativeIds: string[]
  ): Promise<CampaignValidationResult> => {
    console.log('🔍 Validating campaign Instagram configuration...');
    console.log('📊 Campaign:', campaignName);

    if (!existingIntegration?.access_token) {
      throw new Error('Token de acesso não disponível');
    }

    let hasInstagramIssues = false;

    // Verificar cada criativo
    for (const creativeId of creativeIds) {
      try {
        const hasInstagram = await metaAdsCreativeEditService.hasInstagramConfigured(
          creativeId,
          existingIntegration.access_token
        );

        if (!hasInstagram) {
          hasInstagramIssues = true;
          break;
        }
      } catch (error) {
        console.error(`❌ Error validating creative ${creativeId}:`, error);
        hasInstagramIssues = true;
        break;
      }
    }

    const result: CampaignValidationResult = {
      campaignId,
      campaignName,
      pageId,
      creativeIds,
      hasInstagramIssues,
      needsRepair: hasInstagramIssues
    };

    console.log('📊 Validation result:', result);
    return result;
  };

  /**
   * Valida múltiplas campanhas
   */
  const validateCampaigns = async (
    campaigns: Array<{
      campaignId: string;
      campaignName: string;
      pageId: string;
      creativeIds: string[];
    }>
  ): Promise<CampaignValidationResult[]> => {
    setIsValidating(true);
    const results: CampaignValidationResult[] = [];

    try {
      for (const campaign of campaigns) {
        const result = await validateCampaign(
          campaign.campaignId,
          campaign.campaignName,
          campaign.pageId,
          campaign.creativeIds
        );
        results.push(result);

        // Pausa entre validações
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setValidationResults(results);
      return results;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Repara uma campanha específica
   */
  const repairCampaign = async (
    campaignId: string,
    campaignName: string,
    pageId: string,
    creativeIds: string[]
  ): Promise<CampaignRepairSummary> => {
    console.log('🔧 Starting campaign repair...');

    if (!existingIntegration?.access_token) {
      throw new Error('Token de acesso não disponível');
    }

    setIsRepairing(true);

    try {
      const repairSummary = await instagramAutoRepairService.repairCampaignInstagram(
        campaignId,
        campaignName,
        pageId,
        creativeIds,
        existingIntegration.access_token
      );

      // Atualizar os resultados de validação
      setValidationResults(prev => 
        prev.map(result => 
          result.campaignId === campaignId 
            ? { ...result, hasInstagramIssues: false, needsRepair: false }
            : result
        )
      );

      return repairSummary;
    } finally {
      setIsRepairing(false);
    }
  };

  /**
   * Conta campanhas que precisam de reparo
   */
  const campaignsNeedingRepair = validationResults.filter(result => result.needsRepair);

  return {
    validationResults,
    campaignsNeedingRepair,
    isValidating,
    isRepairing,
    validateCampaign,
    validateCampaigns,
    repairCampaign
  };
};
