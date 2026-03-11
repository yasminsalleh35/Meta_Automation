
import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignData } from '@/types/campaign';
import { useCampaignCreationValidator } from '@/hooks/campaign-creation/useCampaignCreationValidator';

interface ValidationSummaryProps {
  campaignData: CampaignData;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  campaignData,
  className = ''
}) => {
  const { validateCompleteData } = useCampaignCreationValidator();
  const validation = validateCompleteData(campaignData);

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Campanha pronta para criação</p>
              <p className="text-sm text-green-700">Todos os dados foram validados com sucesso</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>Validação da Campanha</span>
          <Badge variant={validation.isValid ? "default" : "destructive"}>
            {validation.isValid ? 'Válida' : 'Incompleta'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validation.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-900">Problemas encontrados:</h4>
            {validation.errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-orange-900">Recomendações:</h4>
            {validation.warnings.map((warning, index) => (
              <Alert key={index} className="border-orange-200 bg-orange-50">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {validation.isValid && validation.warnings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ✅ Sua campanha está válida e pode ser criada. As recomendações acima são opcionais para melhorar o desempenho.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
