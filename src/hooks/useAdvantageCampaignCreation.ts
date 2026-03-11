
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';

interface AdvantageCampaignData {
  name: string;
  daily_budget: number;
  start_time: string;
  location: {
    city: string;
    radius: number;
  };
  fanpage_id: string;
  instagram_actor_id: string;
  media: {
    type: "image" | "video";
    hash_or_id: string;
  };
  title: string;
  copy: string;
  whatsapp_number: string;
}

export const useAdvantageCampaignCreation = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  const createAdvantageCampaign = async (campaignData: AdvantageCampaignData) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Creating Advantage+ Campaign:', campaignData);

      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Use Supabase client for secure API calls instead of hardcoded credentials
      const { data, error } = await supabase.functions.invoke('advantage-campaign-create', {
        body: campaignData,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar campanha Advantage+');
      }

      const result = data;
      console.log('✅ Advantage+ campaign created successfully:', result);
      
      toast({
        title: "Campanha Advantage+ criada com sucesso! 🚀",
        description: "Sua campanha de tráfego foi criada com targeting automático otimizado pela Meta.",
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error creating Advantage+ campaign:', error);
      
      toast({
        title: "Erro ao criar campanha Advantage+",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createAdvantageCampaign,
    isLoading
  };
};
