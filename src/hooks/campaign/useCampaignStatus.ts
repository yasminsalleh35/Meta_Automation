
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { RealCampaign } from '@/types/realCampaign';

export const useCampaignStatus = () => {
  const supabase = useSupabase();
  const { toast } = useToast();

  const updateCampaignStatus = async (campaignId: string, newStatus: 'active' | 'paused' | 'finished') => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        throw new Error(error.message);
      }

      const statusMessages = {
        active: 'ativada',
        paused: 'pausada',
        finished: 'finalizada'
      };

      toast({
        title: "Status alterado",
        description: `Campanha ${statusMessages[newStatus]} com sucesso.`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      console.error('Error updating campaign status:', err);
      toast({
        title: "Erro ao atualizar status",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir campanha';
      console.error('Error deleting campaign:', err);
      toast({
        title: "Erro ao excluir campanha",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    updateCampaignStatus,
    deleteCampaign
  };
};
