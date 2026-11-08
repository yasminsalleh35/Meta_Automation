import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useCallback, useState } from 'react';

type CampaignAction = 'activate' | 'pause';

interface MutationParams {
  campaignId: string;
  metaCampaignId: string;
  action: CampaignAction;
}

interface CachedCampaign {
  id: string;
  status: string;
  [key: string]: any;
}

const DEBOUNCE_MS = 300;

export const useMetaCampaignMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const snapshotRef = useRef<Map<string, CachedCampaign>>(new Map());
  // audit CMP-09: debounce por campanha (Map<id, timer>) — pausar A e B em sequência não descarta A
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [pendingDebounces, setPendingDebounces] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({ campaignId, metaCampaignId, action }: MutationParams) => {
      const functionName = action === 'pause' ? 'simple-campaign-pause' : 'simple-campaign-activate';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { campaignId, metaCampaignId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      // Check for rate limit protection
      if (data?.ok === false && data?.error?.includes('rate_protection_engaged')) {
        throw new Error('rate_protection_engaged');
      }
      
      return data;
    },
    onMutate: async (variables) => {
      const { campaignId, action } = variables;
      const newStatus = action === 'activate' ? 'active' : 'paused';

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['campaigns-cache'] });

      // Snapshot current state for rollback
      const previousData = queryClient.getQueriesData({ queryKey: ['campaigns-cache'] });
      
      // Optimistic update: update only this campaign in all cache entries
      queryClient.setQueriesData<any>(
        { queryKey: ['campaigns-cache'] },
        (old) => {
          if (!old?.items) return old;
          
          const campaignIndex = old.items.findIndex((c: CachedCampaign) => c.id === campaignId);
          if (campaignIndex === -1) return old;
          
          // Save snapshot for this specific campaign
          snapshotRef.current.set(campaignId, { ...old.items[campaignIndex] });
          
          // Update status optimistically
          const newItems = [...old.items];
          newItems[campaignIndex] = {
            ...newItems[campaignIndex],
            status: newStatus
          };
          
          return { ...old, items: newItems };
        }
      );

      return { previousData };
    },
    onSuccess: (data, variables) => {
      const actionText = variables.action === 'pause' ? 'pausada' : 'ativada';
      
      // Verificar se está em análise
      const isInReview = data?.effective_status === 'IN_PROCESS' || data?.effective_status === 'PENDING_REVIEW';
      
      toast({
        title: "Campanha atualizada",
        description: isInReview 
          ? `Campanha ${actionText} e enviada para análise da Meta.`
          : `Campanha ${actionText} com sucesso.`,
      });

      // Remove snapshot after success
      snapshotRef.current.delete(variables.campaignId);

      // Invalidate cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] });
      queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] });
    },
    onError: (error: Error, variables, context) => {
      const { campaignId, action } = variables;
      
      // Handle rate limit specifically
      if (error.message === 'rate_protection_engaged') {
        toast({
          title: "Limite de chamadas atingido",
          description: "Tente novamente em alguns minutos.",
          variant: "destructive"
        });
      } else {
        const actionText = action === 'pause' ? 'pausar' : 'ativar';
        toast({
          title: "Erro ao atualizar campanha",
          description: `Não foi possível ${actionText} a campanha: ${error.message}`,
          variant: "destructive"
        });
      }

      // Rollback: restore from snapshot
      const snapshot = snapshotRef.current.get(campaignId);
      if (snapshot) {
        queryClient.setQueriesData<any>(
          { queryKey: ['campaigns-cache'] },
          (old) => {
            if (!old?.items) return old;
            
            const campaignIndex = old.items.findIndex((c: CachedCampaign) => c.id === campaignId);
            if (campaignIndex === -1) return old;
            
            const newItems = [...old.items];
            newItems[campaignIndex] = snapshot;
            
            return { ...old, items: newItems };
          }
        );
        
        snapshotRef.current.delete(campaignId);
      }
    }
  });

  // Ref para o mutate mais recente: o debounce fica estável entre renders
  const mutateRef = useRef(mutation.mutate);
  mutateRef.current = mutation.mutate;

  // Debounced mutations (300ms), uma janela por campanha
  const debouncedMutate = useCallback((params: MutationParams) => {
    const timers = timersRef.current;
    const existing = timers.get(params.campaignId);
    if (existing) {
      clearTimeout(existing);
    } else {
      setPendingDebounces((n) => n + 1);
    }
    timers.set(params.campaignId, setTimeout(() => {
      timers.delete(params.campaignId);
      setPendingDebounces((n) => Math.max(0, n - 1));
      mutateRef.current(params);
    }, DEBOUNCE_MS));
  }, []);

  // Limpa timers pendentes no unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const activateCampaign = useCallback((campaignId: string, metaCampaignId: string) => {
    debouncedMutate({ campaignId, metaCampaignId, action: 'activate' });
  }, [debouncedMutate]);

  const pauseCampaign = useCallback((campaignId: string, metaCampaignId: string) => {
    debouncedMutate({ campaignId, metaCampaignId, action: 'pause' });
  }, [debouncedMutate]);

  return {
    activateCampaign,
    pauseCampaign,
    // inclui a janela de debounce, para a UI não aceitar cliques repetidos
    isLoading: mutation.isPending || pendingDebounces > 0,
    isError: mutation.isError,
    error: mutation.error
  };
};
