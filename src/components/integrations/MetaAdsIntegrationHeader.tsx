
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface MetaAdsIntegrationHeaderProps {
  isConnected: boolean;
  currentPermissions: string[];
  isLoading: boolean;
}

const MetaAdsIntegrationHeader: React.FC<MetaAdsIntegrationHeaderProps> = ({
  isConnected,
  currentPermissions,
  isLoading
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-bold">f</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Meta Ads Integration</h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge 
              variant={isConnected ? 'default' : 'secondary'}
              className="rounded-lg font-medium"
            >
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            {currentPermissions.length > 0 && (
              <Badge variant="outline" className="text-xs rounded-lg border-primary/20 text-primary">
                {currentPermissions.length} permissões
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      )}
    </div>
  );
};

export default MetaAdsIntegrationHeader;
