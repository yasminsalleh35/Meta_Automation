import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Calendar, Users, DollarSign, MapPin, Trash2 } from 'lucide-react';
import { StrategyReport } from '@/types/strategy.types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const StrategyReports: React.FC = () => {
  const [reports, setReports] = useState<StrategyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('strategy-report', {
        method: 'GET'
      });

      if (error) throw error;

      setReports(data.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase.functions.invoke('strategy-report', {
        method: 'DELETE',
        body: { reportId }
      });

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== reportId));
      toast({
        title: "Relatório excluído",
        description: "O relatório foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const getClassBadgeColor = (economicClass: string) => {
    switch (economicClass) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'A/B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B/C': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-orange-600" />
            Relatórios Estratégicos
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Análises personalizadas para otimizar suas campanhas odontológicas
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/my-business')}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Gerar Novo Relatório
        </Button>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum relatório encontrado
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Crie seu primeiro relatório estratégico configurando suas especialidades na página Meu Negócio.
            </p>
            <Button
              onClick={() => navigate('/dashboard/my-business')}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Relatório
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center mb-2">
                      <FileText className="w-5 h-5 mr-2 text-orange-600" />
                      {report.title}
                    </CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge className={`${getClassBadgeColor(report.result.economicClass)} font-semibold`}>
                    Classe {report.result.economicClass}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{report.result.ageRange[0]}-{report.result.ageRange[1]} anos</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                    <span>R$ {report.result.dailyBudgetBRL}/dia</span>
                  </div>
                </div>
                
                {report.result.neighborhoods && (
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-xs">
                      {report.result.neighborhoods.slice(0, 2).join(', ')}
                      {report.result.neighborhoods.length > 2 && ` +${report.result.neighborhoods.length - 2}`}
                    </span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {report.payload.specialties.length} especialidade(s) configurada(s)
                </div>

                <div className="flex gap-2 pt-3">
                  <Button
                    onClick={() => navigate(`/dashboard/strategy-report/${report.id}`)}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    size="sm"
                  >
                    Ver Relatório
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="px-3">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir relatório</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteReport(report.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategyReports;