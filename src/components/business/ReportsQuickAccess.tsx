import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, Calendar, BarChart3 } from 'lucide-react';
import { StrategyReport } from '@/types/strategy.types';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ReportsQuickAccess: React.FC = () => {
  const [reports, setReports] = useState<StrategyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getClassBadgeColor = (economicClass: string) => {
    switch (economicClass) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'A/B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B/C': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-orange-600" />
          Relatórios Estratégicos
        </CardTitle>
        <CardDescription className="text-lg">
          Acesso rápido aos seus relatórios criados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Nenhum relatório criado ainda. Configure suas especialidades abaixo e gere seu primeiro relatório.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{reports.length}</div>
                  <div className="text-xs text-muted-foreground">Relatórios</div>
                </div>
                {reports.length > 0 && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(reports[0].created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">Último criado</div>
                  </div>
                )}
              </div>
            </div>

            {/* Mostrar últimos 2 relatórios */}
            <div className="space-y-2">
              {reports.slice(0, 2).map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dashboard/strategy-report/${report.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{report.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(report.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getClassBadgeColor(report.result.economicClass)} text-xs`}>
                    Classe {report.result.economicClass}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="pt-4 border-t">
          <Button
            onClick={() => navigate('/dashboard/strategy-report')}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
            size="sm"
          >
            {reports.length === 0 ? 'Criar Primeiro Relatório' : 'Ver Todos os Relatórios'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsQuickAccess;