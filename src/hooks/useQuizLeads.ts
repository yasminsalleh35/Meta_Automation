import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuizLead } from '@/types/quiz';

export const useQuizLeads = (quizId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['quiz-leads', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QuizLead[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ status })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-leads', quizId] });
      toast({
        title: "Status atualizado",
        description: "Status do lead foi atualizado"
      });
    }
  });

  const regenerateScoreMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const lead = leads?.find(l => l.id === leadId);
      if (!lead) throw new Error('Lead not found');

      // Buscar steps para calcular pesos
      const { data: steps, error: stepsError } = await supabase
        .from('quiz_steps')
        .select('*')
        .eq('quiz_id', quizId);

      if (stepsError) throw stepsError;

      const weights = {
        urgency: 0,
        budget: 0,
        profile: 0,
        needs: 0
      };

      steps?.forEach((step: any) => {
        if (step.category && lead.responses[step.field_name]) {
          weights[step.category as keyof typeof weights] += step.weight || 1;
        }
      });

      // Chamar scoring
      const { data, error } = await supabase.functions.invoke('quiz-lead-scoring', {
        body: {
          responses: lead.responses,
          weights,
          quiz_id: quizId
        }
      });

      if (error) throw error;

      // Atualizar lead
      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({
          score: data.score,
          score_classification: data.classification,
          score_details: data,
          ai_insights: {
            opportunities: data.opportunities,
            risks: data.risks,
            summary: data.summary,
            recommendation: data.recommendation
          }
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-leads', quizId] });
      toast({
        title: "Score atualizado",
        description: "Score do lead foi recalculado pela IA"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao recalcular score",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    leads,
    isLoading,
    updateStatus: updateStatusMutation.mutate,
    regenerateScore: regenerateScoreMutation.mutate,
    isUpdating: updateStatusMutation.isPending || regenerateScoreMutation.isPending
  };
};
