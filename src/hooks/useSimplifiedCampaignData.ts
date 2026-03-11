
import { useState } from 'react';
import { CampaignData, getInitialCampaignData } from '@/types/campaign';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export const useSimplifiedCampaignData = () => {
  const [campaignData, setCampaignData] = useState<CampaignData>(getInitialCampaignData());
  const [isSaving, setIsSaving] = useState(false);
  const supabase = useSupabase();
  const { toast } = useToast();

  const updateCampaignData = (field: keyof CampaignData, value: any) => {
    console.log('📝 Updating campaign data:', { field, value: typeof value === 'object' ? JSON.stringify(value) : value });
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const updateLocationData = (field: string, value: any) => {
    console.log('📍 Updating location data:', { field, value });
    setCampaignData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const saveCampaign = async (): Promise<string | null> => {
    try {
      setIsSaving(true);
      console.log('💾 Saving campaign:', campaignData.campaignName);

      // Ensure objective is set
      if (!campaignData.objective) {
        campaignData.objective = 'advantage_plus_leads';
      }

      const response = await supabase.functions.invoke('save-campaign', {
        body: campaignData
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar campanha');
      }

      toast({
        title: "Sucesso",
        description: "Campanha salva com sucesso!"
      });

      return result.campaignId;
    } catch (error) {
      console.error('❌ Error saving campaign:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    campaignData,
    setCampaignData,
    updateCampaignData,
    updateLocationData,
    saveCampaign,
    isSaving
  };
};
