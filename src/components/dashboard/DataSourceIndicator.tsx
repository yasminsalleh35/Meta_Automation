import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataSourceIndicatorProps {
  dataSource: 'real' | 'estimated' | 'cached';
  lastSyncAt: number;
  hasMetaIntegration: boolean;
  onForceSync: () => void;
  isLoading: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  dataSource,
  lastSyncAt,
  hasMetaIntegration,
  onForceSync,
  isLoading
}) => {
  const getSourceInfo = () => {
    switch (dataSource) {
      case 'real':
        return {
          label: hasMetaIntegration ? 'Dados Reais' : 'Sem Dados',
          variant: 'default' as const,
          icon: hasMetaIntegration ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />,
          description: hasMetaIntegration 
            ? 'Dados obtidos diretamente da Meta Ads API (últimos 90 dias)'
            : 'Nenhuma integração Meta Ads ativa ou sem campanhas'
        };
      case 'cached':
        return {
          label: 'Cache',
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
          description: 'Dados da última sincronização bem-sucedida'
        };
      default:
        return {
          label: 'Sem Dados',
          variant: 'secondary' as const,
          icon: <WifiOff className="h-3 w-3" />,
          description: 'Sem dados disponíveis'
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const lastSyncText = formatDistanceToNow(new Date(lastSyncAt), { 
    addSuffix: true, 
    locale: ptBR 
  });

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <Badge variant={sourceInfo.variant} className="gap-1">
          {sourceInfo.icon}
          {sourceInfo.label}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Atualizado {lastSyncText}
        </span>
      </div>
      
      <div className="flex-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onForceSync}
        disabled={isLoading}
        className="gap-2 h-8"
        title={sourceInfo.description}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Sincronizar
      </Button>
    </div>
  );
};