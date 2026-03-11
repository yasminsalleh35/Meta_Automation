
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  AlertTriangle
} from 'lucide-react';

interface CampaignVerificationStatusProps {
  campaignId: string;
  verificationStatus?: string;
  lastVerifiedAt?: string;
  onVerifyNow?: () => void;
  isVerifying?: boolean;
}

export const CampaignVerificationStatus: React.FC<CampaignVerificationStatusProps> = ({
  campaignId,
  verificationStatus = 'PENDING',
  lastVerifiedAt,
  onVerifyNow,
  isVerifying = false
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'VERIFIED_OK':
        return {
          icon: CheckCircle,
          label: 'Verificado',
          color: 'bg-green-100 text-green-800',
          description: 'Ad Set está conforme as configurações esperadas'
        };
      case 'CORRECTED':
        return {
          icon: Settings,
          label: 'Corrigido',
          color: 'bg-blue-100 text-blue-800',
          description: 'Correções foram aplicadas automaticamente'
        };
      case 'ERROR':
        return {
          icon: XCircle,
          label: 'Erro',
          color: 'bg-red-100 text-red-800',
          description: 'Erro durante a verificação ou correção'
        };
      case 'PENDING':
      default:
        return {
          icon: Clock,
          label: 'Pendente',
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Aguardando verificação automática'
        };
    }
  };

  const statusConfig = getStatusConfig(verificationStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status da Verificação:</span>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{statusConfig.description}</p>
            {lastVerifiedAt && (
              <p className="text-xs text-gray-500">
                Última verificação: {new Date(lastVerifiedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          
          {onVerifyNow && verificationStatus === 'PENDING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onVerifyNow}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verificar Agora
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
