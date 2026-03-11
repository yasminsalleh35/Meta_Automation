import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, UserCheck, Target, TrendingUp } from 'lucide-react';
import { Lead } from '@/hooks/admin/useLeads';

interface LeadsHeaderProps {
  metrics: {
    total: number;
    newLeads: number;
    contacted: number;
    qualified: number;
    closed: number;
    conversionRate: string;
  };
  leads: Lead[];
}

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({ metrics, leads }) => {
  const exportToCSV = () => {
    const headers = [
      'Nome',
      'Email',
      'Clínica',
      'WhatsApp',
      'Especialidade',
      'Cidade/Estado',
      'Status',
      'Investimento Desejado',
      'Objetivo Principal',
      'Urgência',
      'Origem (UTM)',
      'Criado em'
    ];

    const csvData = leads.map(lead => [
      lead.name || '',
      lead.email || '',
      lead.clinic_name || '',
      lead.whatsapp_e164 || '',
      lead.specialties?.join(', ') || lead.specialty || '',
      `${lead.city || ''}, ${lead.state || ''}`.replace(/^, |, $/, ''),
      lead.status || 'novo',
      lead.desired_monthly_spend_range || '',
      lead.main_goal || '',
      lead.start_timing || '',
      lead.utm_source || '',
      new Date(lead.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Métricas dos últimos leads capturados</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">Todos os leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.newLeads}</div>
            <p className="text-xs text-muted-foreground">Aguardando contato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatados</CardTitle>
            <UserCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.contacted}</div>
            <p className="text-xs text-muted-foreground">Primeiro contato feito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.qualified}</div>
            <p className="text-xs text-muted-foreground">Prontos para proposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Qualificados + fechados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};