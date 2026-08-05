import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { useMetaSelection } from '@/hooks/useMetaSelection';

export const useCampaignSyncActions = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: selection } = useMetaSelection();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const syncActiveCampaigns = async () => {
    if (!selection?.ad_account_id) {
      toast({
        title: "Erro",
        description: "Nenhuma conta de anúncios selecionada",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-sync-actives`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            ad_account_id: selection.ad_account_id
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync campaigns');
      }

      const result = await response.json();

      toast({
        title: "Sincronização concluída",
        description: `${result.processed} campanhas ativas atualizadas`,
      });

      // Invalidate cache after successful sync
      await queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] });
      await queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] });

      return result;
    } catch (error) {
      console.error('Error syncing active campaigns:', error);
      toast({
        title: "Erro ao sincronizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const discoverNewCampaigns = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!selection?.ad_account_id) {
      if (!silent) {
        toast({
          title: "Erro",
          description: "Nenhuma conta de anúncios selecionada",
          variant: "destructive"
        });
      }
      return;
    }

    setIsDiscovering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-campaigns-discover`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({})
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to discover campaigns');
      }

      const result = await response.json();

      // In silent (auto) mode only notify when something new was actually found — no noise on login.
      if (!silent) {
        toast({
          title: "Descoberta concluída",
          description: `${result.imported} novas campanhas, ${result.updated} atualizadas`,
        });
      } else if ((result.imported ?? 0) > 0) {
        toast({
          title: "Campanhas atualizadas",
          description: `${result.imported} nova(s) campanha(s) encontrada(s) no Meta Ads`,
        });
      }

      // Invalidate cache after successful discovery
      await queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] });
      await queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] });

      return result;
    } catch (error) {
      console.error('Error discovering campaigns:', error);
      if (!silent) {
        toast({
          title: "Erro ao descobrir campanhas",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const refreshOneCampaign = async (metaCampaignId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-campaign-refresh-one`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            meta_campaign_id: metaCampaignId
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh campaign');
      }

      const result = await response.json();

      toast({
        title: "Campanha atualizada",
        description: "Métricas e status atualizados com sucesso",
      });

      // Invalidate cache after refresh
      await queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] });
      await queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] });

      return result;
    } catch (error) {
      console.error('Error refreshing campaign:', error);
      toast({
        title: "Erro ao atualizar campanha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return {
    syncActiveCampaigns,
    discoverNewCampaigns,
    refreshOneCampaign,
    isSyncing,
    isDiscovering
  };
};
