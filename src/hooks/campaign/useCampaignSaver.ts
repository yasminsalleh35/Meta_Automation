
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { CampaignData } from '@/types/campaign';

export const useCampaignSaver = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const saveCampaign = async (campaignData: CampaignData): Promise<string | null> => {
    setIsSaving(true);
    
    try {
      console.log('💾 Saving campaign to database only (Meta creation handled elsewhere)...');

      // Prepare campaign data for database
      const requestData = {
        campaignId: campaignData.campaignId,
        objective: campaignData.objective,
        campaignName: campaignData.campaignName,
        location: campaignData.location,
        gender: campaignData.gender,
        ageRange: campaignData.ageRange,
        interests: campaignData.interests,
        placements: campaignData.placements,
        devices: campaignData.devices,
        budget: campaignData.budget,
        duration: campaignData.duration,
        adTitle: campaignData.adTitle,
        adText: campaignData.adText,
        destinationUrl: campaignData.destinationUrl,
        selectedMediaId: campaignData.selectedMediaId,
        facebookPage: campaignData.facebookPage,
        instagramAccount: campaignData.instagramAccount,
        whatsappNumber: campaignData.whatsappNumber,
        // Include Meta IDs if available
        meta_campaign_id: campaignData.meta_campaign_id || null,
        meta_adset_id: campaignData.meta_adset_id || null,
        meta_ad_id: campaignData.meta_ad_id || null
      };

      console.log('💾 Saving to database:', {
        hasCampaignId: !!requestData.campaignId,
        hasMetaIds: !!(requestData.meta_campaign_id && requestData.meta_adset_id && requestData.meta_ad_id)
      });

      // Save to database using Supabase client
      const { data: result, error } = await supabase.functions.invoke('save-campaign', {
        body: requestData
      });

      if (error) {
        console.error('❌ Database save error:', error);
        throw new Error(error.message || 'Erro ao salvar campanha no banco de dados');
      }

      if (!result || !result.success) {
        console.error('❌ Database save failed:', result);
        throw new Error(result?.error || 'Erro ao salvar campanha');
      }

      console.log('✅ Campaign saved to database:', result);

      toast({
        title: "Campanha salva",
        description: campaignData.campaignId ? "Campanha atualizada com sucesso!" : "Campanha criada com sucesso!",
      });

      return result.campaignId;
    } catch (error) {
      console.error('❌ Error saving campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "Erro ao salvar campanha",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveCampaign,
    isSaving
  };
};
