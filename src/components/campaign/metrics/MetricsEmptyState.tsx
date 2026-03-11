
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Target, RefreshCw } from 'lucide-react';

interface MetricsEmptyStateProps {
  className?: string;
  type: 'not-synced' | 'no-data';
  onRefresh?: () => void;
}

export const MetricsEmptyState: React.FC<MetricsEmptyStateProps> = ({ 
  className = "", 
  type, 
  onRefresh 
}) => {
  if (type === 'not-synced') {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <ExternalLink className="w-8 h-8 text-yellow-600" />
        </div>
        <Badge variant="outline" className="text-sm bg-yellow-50 text-yellow-700 border-yellow-200">
          Não sincronizada com Meta Ads
        </Badge>
        <p className="text-sm text-gray-500 mt-2">
          Sincronize esta campanha para ver métricas em tempo real
        </p>
      </div>
    );
  }

  return (
    <div className={`${className} text-center py-8`}>
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Target className="w-8 h-8 text-gray-600" />
      </div>
      <Badge variant="outline" className="text-sm bg-gray-50 text-gray-700 border-gray-200">
        Aguardando dados
      </Badge>
      <p className="text-sm text-gray-500 mt-2 mb-4">
        As métricas serão exibidas quando a campanha receber interações
      </p>
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      )}
    </div>
  );
};
