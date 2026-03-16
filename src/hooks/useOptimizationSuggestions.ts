import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OptimizationSuggestion {
  id: string;
  campaign_id: string;
  meta_campaign_id: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  metrics_snapshot: Record<string, any>;
  suggested_action: Record<string, any>;
  status: 'pending' | 'applied' | 'dismissed' | 'expired';
  ai_model: string | null;
  ai_provider: string | null;
  created_at: string;
  applied_at: string | null;
}

interface EvaluateResult {
  success: boolean;
  suggestions: OptimizationSuggestion[];
  metrics?: Record<string, number>;
  source?: string;
  error?: string;
}

export function useOptimizationSuggestions(campaignId: string) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch existing suggestions from DB
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('optimization_suggestions')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('status', ['pending', 'applied'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestions((data as OptimizationSuggestion[]) || []);
    } catch (err: any) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  // Trigger AI evaluation
  const evaluateMetrics = useCallback(async () => {
    setIsEvaluating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sessão expirada');

      const { data, error } = await supabase.functions.invoke('ai-evaluate-metrics', {
        body: { campaignId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;

      const result = data as EvaluateResult;
      if (result?.success && result.suggestions) {
        // Refetch from DB to get full records with IDs
        await fetchSuggestions();

        toast({
          title: 'Análise concluída',
          description: `${result.suggestions.length} sugestão(ões) gerada(s) via ${result.source || 'IA'}`,
        });
      } else {
        throw new Error(result?.error || 'Falha na avaliação');
      }
    } catch (err: any) {
      console.error('AI evaluation error:', err);
      toast({
        title: 'Erro na avaliação',
        description: err.message || 'Não foi possível avaliar a campanha',
        variant: 'destructive',
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [campaignId, fetchSuggestions, toast]);

  // Apply a suggestion
  const applySuggestion = useCallback(async (suggestionId: string) => {
    setIsApplying(suggestionId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Sessão expirada');

      const { data, error } = await supabase.functions.invoke('apply-optimization', {
        body: { suggestionId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;

      if (data?.success) {
        // Update local state
        setSuggestions(prev =>
          prev.map(s =>
            s.id === suggestionId ? { ...s, status: 'applied' as const, applied_at: new Date().toISOString() } : s
          )
        );

        toast({
          title: 'Otimização aplicada',
          description: data.message || 'Ação executada com sucesso',
        });
      } else {
        throw new Error(data?.error || 'Falha ao aplicar');
      }
    } catch (err: any) {
      console.error('Apply optimization error:', err);
      toast({
        title: 'Erro ao aplicar',
        description: err.message || 'Não foi possível aplicar a otimização',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(null);
    }
  }, [toast]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('optimization_suggestions')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));

      toast({
        title: 'Sugestão descartada',
      });
    } catch (err: any) {
      console.error('Dismiss error:', err);
    }
  }, [toast]);

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const appliedSuggestions = suggestions.filter(s => s.status === 'applied');

  return {
    suggestions,
    pendingSuggestions,
    appliedSuggestions,
    isLoading,
    isEvaluating,
    isApplying,
    fetchSuggestions,
    evaluateMetrics,
    applySuggestion,
    dismissSuggestion,
  };
}
