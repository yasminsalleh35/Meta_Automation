import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateBudgetParams {
  campaignId: string;
  dailyBudget: number;
}

/**
 * Updates a campaign's daily budget (on the Meta ad set) via the `update-campaign-budget`
 * edge function, with an optimistic update of the ['campaigns-cache'] list and rollback on error.
 */
export const useCampaignBudgetMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ campaignId, dailyBudget }: UpdateBudgetParams) => {
      const { data, error } = await supabase.functions.invoke('update-campaign-budget', {
        body: { campaignId, dailyBudget },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Falha ao atualizar o orçamento');
      return data;
    },
    onMutate: async ({ campaignId, dailyBudget }) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns-cache'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['campaigns-cache'] });

      queryClient.setQueriesData<any>({ queryKey: ['campaigns-cache'] }, (old) => {
        if (!old?.items) return old;
        const idx = old.items.findIndex((c: any) => c.id === campaignId);
        if (idx === -1) return old;
        const items = [...old.items];
        items[idx] = { ...items[idx], budgetDaily: dailyBudget };
        return { ...old, items };
      });

      return { previousData };
    },
    onSuccess: (_data, { dailyBudget }) => {
      toast({
        title: 'Orçamento atualizado',
        description: `Novo orçamento diário: R$ ${dailyBudget.toFixed(2)}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] });
    },
    onError: (error: Error, _vars, context) => {
      // Rollback the optimistic update.
      if (context?.previousData) {
        for (const [key, data] of context.previousData as [any, any][]) {
          queryClient.setQueryData(key, data);
        }
      }
      toast({
        title: 'Erro ao atualizar orçamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    updateBudget: (params: UpdateBudgetParams) => mutation.mutateAsync(params),
    isUpdating: mutation.isPending,
  };
};
