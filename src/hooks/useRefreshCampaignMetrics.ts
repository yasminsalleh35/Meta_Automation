import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMetaSelection } from '@/hooks/useMetaSelection';

export const useRefreshCampaignMetrics = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: selection } = useMetaSelection();

  const COOLDOWN_MS = 60000; // 60 segundos (aumentado de 10s)

  const canRefresh = useCallback(() => {
    if (!lastRefresh) return true;
    return Date.now() - lastRefresh > COOLDOWN_MS;
  }, [lastRefresh]);

  const refresh = useCallback(async () => {
    if (!canRefresh()) {
      const remainingTime = Math.ceil((COOLDOWN_MS - (Date.now() - lastRefresh!)) / 1000);
      toast({
        title: "Aguarde",
        description: `Você poderá atualizar novamente em ${remainingTime}s`,
        variant: "default"
      });
      return;
    }

    setIsRefreshing(true);
    
    try {
      // Force refresh do cache
      await queryClient.invalidateQueries({
        queryKey: ['meta-campaigns', selection?.ad_account_id]
      });
      
      setLastRefresh(Date.now());
      
      toast({
        title: "Métricas atualizadas",
        description: "Os dados foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as métricas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [canRefresh, lastRefresh, queryClient, selection?.ad_account_id, toast]);

  return {
    refresh,
    isRefreshing,
    canRefresh: canRefresh()
  };
};
