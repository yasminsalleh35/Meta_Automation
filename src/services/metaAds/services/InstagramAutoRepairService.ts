
import { metaAdsCreativeEditService } from './MetaAdsCreativeEditService';
import { instagramPageConnectionService } from '../validation/InstagramPageConnectionService';
import { metaAdsAccountService } from '../MetaAdsAccountService';

export interface RepairResult {
  success: boolean;
  creativeId: string;
  originalInstagram?: string;
  newInstagram?: string;
  error?: string;
}

export interface CampaignRepairSummary {
  campaignId: string;
  campaignName: string;
  pageId: string;
  totalCreatives: number;
  repairedCreatives: number;
  failedRepairs: number;
  results: RepairResult[];
}

export class InstagramAutoRepairService {
  
  /**
   * Encontra o melhor Instagram para uma página específica
   */
  async findBestInstagramForPage(
    pageId: string,
    accessToken: string
  ): Promise<string | null> {
    console.log('🎯 Finding best Instagram for page:', pageId);

    try {
      // Buscar todas as contas Instagram conectadas à página
      const connectedInstagrams = await metaAdsAccountService.getConnectedInstagramAccounts(
        pageId,
        accessToken
      );

      console.log('📱 Available Instagram accounts for page:', connectedInstagrams);

      if (connectedInstagrams.length === 0) {
        console.log('⚠️ No Instagram accounts found for page');
        return null;
      }

      // Retornar o primeiro Instagram conectado
      const bestInstagram = connectedInstagrams[0];
      console.log('✅ Best Instagram found:', bestInstagram);
      
      return bestInstagram.id;
    } catch (error) {
      console.error('❌ Error finding best Instagram for page:', error);
      return null;
    }
  }

  /**
   * Repara um criativo específico adicionando o melhor Instagram
   */
  async repairCreativeInstagram(
    creativeId: string,
    pageId: string,
    accessToken: string
  ): Promise<RepairResult> {
    console.log('🔧 Repairing creative Instagram...');
    console.log('🎨 Creative ID:', creativeId);
    console.log('📘 Page ID:', pageId);

    try {
      // Verificar se o criativo já tem Instagram configurado
      const hasInstagram = await metaAdsCreativeEditService.hasInstagramConfigured(
        creativeId,
        accessToken
      );

      if (hasInstagram) {
        console.log('✅ Creative already has Instagram configured');
        return {
          success: true,
          creativeId,
          originalInstagram: 'already_configured'
        };
      }

      // Encontrar o melhor Instagram para a página
      const bestInstagram = await this.findBestInstagramForPage(pageId, accessToken);

      if (!bestInstagram) {
        console.log('⚠️ No suitable Instagram found for page');
        return {
          success: false,
          creativeId,
          error: 'Nenhuma conta Instagram encontrada para esta página'
        };
      }

      // Validar a conexão Instagram-Página
      const validation = await instagramPageConnectionService.validateInstagramPageConnection(
        pageId,
        bestInstagram,
        accessToken
      );

      if (validation.connectionType !== 'page_connected') {
        console.log('⚠️ Instagram not properly connected to page');
        return {
          success: false,
          creativeId,
          error: 'Instagram não está conectado à página'
        };
      }

      // Atualizar o criativo com o Instagram
      await metaAdsCreativeEditService.updateCreativeInstagram(
        creativeId,
        bestInstagram,
        accessToken
      );

      console.log('✅ Creative repaired successfully');
      
      return {
        success: true,
        creativeId,
        newInstagram: bestInstagram
      };

    } catch (error) {
      console.error('❌ Error repairing creative:', error);
      return {
        success: false,
        creativeId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Repara todos os criativos de uma campanha
   */
  async repairCampaignInstagram(
    campaignId: string,
    campaignName: string,
    pageId: string,
    creativeIds: string[],
    accessToken: string
  ): Promise<CampaignRepairSummary> {
    console.log('🔧 Repairing campaign Instagram...');
    console.log('📊 Campaign:', campaignName);
    console.log('🎨 Creatives to repair:', creativeIds);

    const results: RepairResult[] = [];
    let repairedCount = 0;
    let failedCount = 0;

    for (const creativeId of creativeIds) {
      try {
        console.log(`🔧 Repairing creative ${creativeIds.indexOf(creativeId) + 1}/${creativeIds.length}`);
        
        const result = await this.repairCreativeInstagram(creativeId, pageId, accessToken);
        results.push(result);

        if (result.success) {
          repairedCount++;
        } else {
          failedCount++;
        }

        // Pequena pausa entre reparos para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error repairing creative ${creativeId}:`, error);
        results.push({
          success: false,
          creativeId,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        failedCount++;
      }
    }

    const summary: CampaignRepairSummary = {
      campaignId,
      campaignName,
      pageId,
      totalCreatives: creativeIds.length,
      repairedCreatives: repairedCount,
      failedRepairs: failedCount,
      results
    };

    console.log('📊 Repair summary:', summary);
    return summary;
  }
}

export const instagramAutoRepairService = new InstagramAutoRepairService();
