import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const AdminQuizLeadDetail: React.FC = () => {
  const { quizId, leadId } = useParams<{ quizId: string; leadId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['quiz-lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ status: newStatus })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-leads', quizId] });
      toast({
        title: "Status atualizado",
        description: "Status do lead atualizado com sucesso"
      });
    }
  });

  const getScoreIcon = (classification: string) => {
    switch (classification) {
      case 'hot': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'warm': return <Minus className="w-5 h-5 text-yellow-500" />;
      case 'cold': return <TrendingDown className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  };

  const getScoreColor = (classification: string) => {
    switch (classification) {
      case 'hot': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'warm': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'cold': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!lead) {
    return <div className="p-6">Lead não encontrado</div>;
  }

  const responses = lead.responses as Record<string, any>;
  const aiInsights = lead.ai_insights as any;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/admin/quizzes/${quizId}/leads`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{lead.lead_name || 'Lead sem nome'}</h1>
          <p className="text-muted-foreground">
            Capturado em {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        {lead.whatsapp && (
          <Button
            onClick={() => window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações de Contato</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Nome</span>
                <p className="font-medium">{lead.lead_name || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Empresa</span>
                <p className="font-medium">{lead.company_name || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <p className="font-medium">{lead.whatsapp || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">E-mail</span>
                <p className="font-medium">{lead.email || 'Não informado'}</p>
              </div>
            </div>
          </Card>

          {/* Responses */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Respostas do Quiz</h2>
            <div className="space-y-4">
              {Object.entries(responses).map(([key, value]) => (
                <div key={key} className="border-b pb-3">
                  <span className="text-sm text-muted-foreground block mb-1">{key}</span>
                  <p className="font-medium">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights */}
          {aiInsights && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Insights da IA</h2>
              
              {aiInsights.summary && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Resumo</h3>
                  <p className="text-foreground">{aiInsights.summary}</p>
                </div>
              )}

              {aiInsights.opportunities && aiInsights.opportunities.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Oportunidades</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {aiInsights.opportunities.map((opp: string, idx: number) => (
                      <li key={idx} className="text-green-700 dark:text-green-400">{opp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.risks && aiInsights.risks.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Riscos</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {aiInsights.risks.map((risk: string, idx: number) => (
                      <li key={idx} className="text-yellow-700 dark:text-yellow-400">{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.recommendation && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Recomendação</h3>
                  <p className="text-foreground font-medium">{aiInsights.recommendation}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          {lead.score && (
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Score IA</h3>
              <div className={`flex items-center justify-center gap-3 p-6 rounded-lg border ${getScoreColor(lead.score_classification)}`}>
                {getScoreIcon(lead.score_classification)}
                <span className="text-4xl font-bold">{lead.score}</span>
              </div>
              <div className="text-center mt-3">
                <Badge variant="outline">
                  {lead.score_classification === 'hot' && '🔥 Quente'}
                  {lead.score_classification === 'warm' && '⚡ Morno'}
                  {lead.score_classification === 'cold' && '❄️ Frio'}
                </Badge>
              </div>
            </Card>
          )}

          {/* Status */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Status</h3>
            <Select
              value={lead.status}
              onValueChange={(value) => updateStatusMutation.mutate(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="contatado">Contatado</SelectItem>
                <SelectItem value="frio">Frio</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Tracking Data */}
          {lead.device && (
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Dados de Rastreamento</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Dispositivo:</span>{' '}
                  <span className="font-medium">{lead.device}</span>
                </div>
                {lead.referrer && (
                  <div>
                    <span className="text-muted-foreground">Referrer:</span>{' '}
                    <span className="font-medium text-xs">{lead.referrer}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuizLeadDetail;
