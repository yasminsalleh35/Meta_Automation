import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Eye, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuizLead {
  id: string;
  quiz_id: string;
  lead_name: string;
  whatsapp: string;
  email: string;
  company_name: string;
  score: number;
  score_classification: 'hot' | 'warm' | 'cold';
  status: string;
  created_at: string;
}

const AdminQuizLeads: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');

  const { data: quiz } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ['quiz-leads', quizId, searchQuery, statusFilter, scoreFilter],
    queryFn: async () => {
      let query = supabase
        .from('quiz_leads')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (scoreFilter !== 'all') {
        query = query.eq('score_classification', scoreFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Filter by search query
      if (searchQuery) {
        return data.filter((lead: any) =>
          lead.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.whatsapp?.includes(searchQuery) ||
          lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return data as QuizLead[];
    }
  });

  const getScoreIcon = (classification: string) => {
    switch (classification) {
      case 'hot': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warm': return <Minus className="w-4 h-4 text-yellow-500" />;
      case 'cold': return <TrendingDown className="w-4 h-4 text-blue-500" />;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/admin/quizzes')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{quiz?.name}</h1>
          <p className="text-muted-foreground">Leads capturados por este quiz</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="qualificado">Qualificado</SelectItem>
              <SelectItem value="contatado">Contatado</SelectItem>
              <SelectItem value="frio">Frio</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os scores</SelectItem>
              <SelectItem value="hot">🔥 Quente (80-100)</SelectItem>
              <SelectItem value="warm">⚡ Morno (50-79)</SelectItem>
              <SelectItem value="cold">❄️ Frio (0-49)</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            Total: {leads?.length || 0} leads
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <div className="grid gap-4">
        {leads?.map((lead) => (
          <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{lead.lead_name || 'Sem nome'}</h3>
                  
                  {lead.score && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-sm font-medium ${getScoreColor(lead.score_classification)}`}>
                      {getScoreIcon(lead.score_classification)}
                      <span>{lead.score}</span>
                    </div>
                  )}
                  
                  <Badge variant="outline">{lead.status}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Empresa:</span>{' '}
                    {lead.company_name || 'Não informado'}
                  </div>
                  <div>
                    <span className="font-medium">WhatsApp:</span>{' '}
                    {lead.whatsapp || 'Não informado'}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>{' '}
                    {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/admin/quizzes/${quizId}/leads/${lead.id}`)}
                title="Ver detalhes"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {(!leads || leads.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum lead capturado ainda</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminQuizLeads;
