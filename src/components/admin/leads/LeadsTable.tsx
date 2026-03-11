import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Mail, 
  Copy, 
  Eye,
  Clock,
  MapPin,
  DollarSign 
} from 'lucide-react';
import { Lead } from '@/hooks/admin/useLeads';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  onLeadSelect: (lead: Lead) => void;
  onLeadUpdate: (leadId: string, updates: any) => Promise<boolean>;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  loading,
  onLeadSelect,
  onLeadUpdate
}) => {
  const { toast } = useToast();
  const { isMobile } = useResponsive();

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      'novo': { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'contatado': { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'qualificado': { variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      'fechado': { variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      'perdido': { variant: 'secondary' as const, color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.novo;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status || 'novo'}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: 'Texto copiado para a área de transferência',
    });
  };

  const openWhatsApp = (number: string) => {
    if (number) {
      const cleanNumber = number.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum lead encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou aguarde novos leads pelo quiz</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{lead.name || 'Nome não informado'}</h3>
                  <p className="text-sm text-muted-foreground">{lead.clinic_name}</p>
                </div>
                {getStatusBadge(lead.status)}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="flex-1 truncate">{lead.email}</span>
                  </div>
                )}
                {(lead.city || lead.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {lead.desired_monthly_spend_range && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{lead.desired_monthly_spend_range}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(lead.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {lead.whatsapp_e164 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsApp(lead.whatsapp_e164!);
                    }}
                    className="flex-1 gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLeadSelect(lead)}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver mais
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Nome / Clínica</th>
                <th className="text-left p-4 font-medium">Contato</th>
                <th className="text-left p-4 font-medium">Especialidade</th>
                <th className="text-left p-4 font-medium">Localização</th>
                <th className="text-left p-4 font-medium">Investimento</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Data</th>
                <th className="text-left p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="border-b hover:bg-muted/25 cursor-pointer"
                  onClick={() => onLeadSelect(lead)}
                >
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-foreground">
                        {lead.name || 'Nome não informado'}
                      </div>
                      {lead.clinic_name && (
                        <div className="text-sm text-muted-foreground">{lead.clinic_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {lead.email && (
                        <div className="text-sm flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(lead.email!);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {lead.whatsapp_e164 && (
                        <div className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>{lead.whatsapp_e164}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsApp(lead.whatsapp_e164!);
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {lead.specialties?.slice(0, 2).join(', ') || lead.specialty || '-'}
                      {lead.specialties && lead.specialties.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{lead.specialties.length - 2} mais
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {[lead.city, lead.state].filter(Boolean).join(', ') || '-'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {lead.desired_monthly_spend_range || '-'}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </div>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeadSelect(lead);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};