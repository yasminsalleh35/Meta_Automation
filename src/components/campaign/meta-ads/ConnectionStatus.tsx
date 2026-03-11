
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  adAccountId?: string | null;
  isLoadingAssets: boolean;
  onRefresh: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  adAccountId,
  isLoadingAssets,
  onRefresh
}) => {
  return (
    <Alert className={isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {isConnected 
            ? "✅ Meta Ads conectado - Usando dados reais da integração"
            : "❌ Meta Ads não conectado - Configure nas integrações primeiro"
          }
        </span>
        {isConnected && (
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-500">
              Conta: {adAccountId?.slice(-6)}
            </Badge>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingAssets}>
              <RefreshCw className={`w-4 h-4 ${isLoadingAssets ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
