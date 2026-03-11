
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import { instagramPageConnectionService, InstagramPageConnection } from '@/services/metaAds/validation/InstagramPageConnectionService';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';

interface InstagramConnectionValidatorProps {
  selectedFanPage: string;
  selectedInstagram: string;
  onValidationChange: (isValid: boolean, suggestion?: string) => void;
}

export const InstagramConnectionValidator: React.FC<InstagramConnectionValidatorProps> = ({
  selectedFanPage,
  selectedInstagram,
  onValidationChange
}) => {
  const { existingIntegration } = useMetaAdsIntegration();
  const [validation, setValidation] = useState<InstagramPageConnection | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateConnection = async () => {
    if (!selectedFanPage || !selectedInstagram || !existingIntegration?.access_token) {
      setValidation(null);
      onValidationChange(true);
      return;
    }

    setIsValidating(true);
    try {
      console.log('🔍 Starting Instagram-Page validation...');
      
      const result = await instagramPageConnectionService.validateInstagramPageConnection(
        selectedFanPage,
        selectedInstagram,
        existingIntegration.access_token
      );

      setValidation(result);
      onValidationChange(result.isConnected, result.isConnected ? undefined : selectedInstagram);
      
      console.log('✅ Validation completed:', result);
    } catch (error) {
      console.error('❌ Validation error:', error);
      setValidation(null);
      onValidationChange(true); // Allow creation even if validation fails
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateConnection();
  }, [selectedFanPage, selectedInstagram]);

  if (!selectedFanPage || !selectedInstagram) {
    return null;
  }

  if (isValidating) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <AlertDescription>
          Validando conexão Instagram-Página...
        </AlertDescription>
      </Alert>
    );
  }

  if (!validation) {
    return null; // Don't show error state, just hide the validator
  }

  if (validation.connectionType === 'page_connected') {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span><strong>✅ Instagram conectado:</strong> Configuração otimizada</span>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Recomendado
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={validateConnection}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // For other connection types, show a more neutral informational message
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="w-4 h-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span><strong>ℹ️ Instagram selecionado:</strong> Campanha será criada normalmente</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Funcional
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={validateConnection}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
