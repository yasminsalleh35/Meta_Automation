import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Quiz, QuizStep } from '@/types/quiz';

export const useQuizBuilder = (quizId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['quiz', quizId],
    enabled: !!quizId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
      
      if (error) throw error;
      return data as Quiz;
    }
  });

  const { data: steps, isLoading: isLoadingSteps } = useQuery({
    queryKey: ['quiz-steps', quizId],
    enabled: !!quizId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_steps')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index');
      
      if (error) throw error;
      return data as QuizStep[];
    }
  });

  const saveQuizMutation = useMutation({
    mutationFn: async (quizData: Partial<Quiz>) => {
      if (quizId) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quizId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      toast({
        title: "Sucesso",
        description: quizId ? "Quiz atualizado" : "Quiz criado"
      });
    }
  });

  const saveStepMutation = useMutation({
    mutationFn: async (stepData: Partial<QuizStep>) => {
      if (stepData.id) {
        const { error } = await supabase
          .from('quiz_steps')
          .update(stepData)
          .eq('id', stepData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quiz_steps')
          .insert({ ...stepData, quiz_id: quizId });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-steps', quizId] });
      toast({
        title: "Sucesso",
        description: "Step salvo"
      });
    }
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('quiz_steps')
        .delete()
        .eq('id', stepId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-steps', quizId] });
      toast({
        title: "Sucesso",
        description: "Step excluído"
      });
    }
  });

  const reorderStepsMutation = useMutation({
    mutationFn: async (stepsWithNewOrder: Array<{ id: string; order_index: number }>) => {
      // Update order_index for each step
      const updates = stepsWithNewOrder.map(({ id, order_index }) =>
        supabase
          .from('quiz_steps')
          .update({ order_index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-steps', quizId] });
      toast({
        title: "Sucesso",
        description: "Ordem dos steps atualizada"
      });
    }
  });

  return {
    quiz,
    steps,
    isLoading: isLoadingQuiz || isLoadingSteps,
    saveQuiz: saveQuizMutation.mutate,
    saveStep: saveStepMutation.mutate,
    deleteStep: deleteStepMutation.mutate,
    reorderSteps: reorderStepsMutation.mutate,
    isSaving: saveQuizMutation.isPending || saveStepMutation.isPending || reorderStepsMutation.isPending
  };
};
