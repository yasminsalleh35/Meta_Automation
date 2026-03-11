
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, RefreshCw } from 'lucide-react';

interface MetricsErrorStateProps {
  className?: string;
  error?: string;
  onRetry?: () => void;
}

export const MetricsErrorState: React.FC<MetricsErrorStateProps> = ({ 
  className = "", 
  error, 
  onRetry 
}) => {
  return (
    <div className={`${className} text-center py-8`}>
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <Target className="w-8 h-8 text-red-600" />
      </div>
      <Badge variant="destructive" className="text-sm mb-2">
        Erro ao carregar
      </Badge>
      <p className="text-sm text-red-600 mt-2 mb-4">
        {error || 'Erro desconhecido ao carregar métricas'}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
};
