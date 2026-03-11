import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  ExternalLink,
  Power,
  PowerOff,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const AdminQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Quiz[];
    }
  });

  const { data: leadsCounts } = useQuery({
    queryKey: ['quiz-leads-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('quiz_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((lead: any) => {
        counts[lead.quiz_id] = (counts[lead.quiz_id] || 0) + 1;
      });
      
      return counts;
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: !is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast({
        title: "Sucesso",
        description: "Status do quiz atualizado"
      });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast({
        title: "Sucesso",
        description: "Quiz excluído"
      });
      setDeleteQuizId(null);
    }
  });

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/quizz/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: "Link do quiz copiado para a área de transferência"
    });
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
          <p className="text-muted-foreground">Gerencie seus quizzes inteligentes de captura de leads</p>
        </div>
        <Button onClick={() => navigate('/admin/quizzes/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Quiz
        </Button>
      </div>

      {/* Quizzes List */}
      <div className="grid gap-4">
        {quizzes?.map((quiz) => (
          <Card key={quiz.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{quiz.name}</h3>
                  <Badge variant={quiz.is_active ? "default" : "secondary"}>
                    {quiz.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">{quiz.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{leadsCounts?.[quiz.id] || 0} leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-mono text-xs">/quizz/{quiz.slug}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyUrl(quiz.slug)}
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}/leads`)}
                  title="Ver Leads"
                >
                  <Users className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleActiveMutation.mutate({ id: quiz.id, is_active: quiz.is_active })}
                  title={quiz.is_active ? 'Desativar' : 'Ativar'}
                >
                  {quiz.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteQuizId(quiz.id)}
                  title="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {(!quizzes || quizzes.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum quiz criado ainda</p>
            <Button onClick={() => navigate('/admin/quizzes/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Quiz
            </Button>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuizId} onOpenChange={() => setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este quiz? Esta ação não pode ser desfeita.
              Todos os leads capturados serão mantidos, mas não estarão mais associados ao quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuizId && deleteQuizMutation.mutate(deleteQuizId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminQuizzes;
