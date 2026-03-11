
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Instagram, Wrench, CheckCircle, AlertTriangle, RefreshCw,
  Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { CampaignValidationResult } from '@/hooks/useInstagramCampaignValidator';
import { CampaignRepairSummary } from '@/services/metaAds/services/InstagramAutoRepairService';

interface InstagramAutoCorrectionProps {
  validationResults: CampaignValidationResult[];
  isValidating: boolean;
  isRepairing: boolean;
  onValidate: () => Promise<void>;
  onRepair: (campaign: CampaignValidationResult) => Promise<CampaignRepairSummary>;
}

export const InstagramAutoCorrection: React.FC<InstagramAutoCorrectionProps> = ({
  validationResults,
  isValidating,
  isRepairing,
  onValidate,
  onRepair
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [repairResults, setRepairResults] = useState<Record<string, CampaignRepairSummary>>({});
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const campaignsWithIssues = validationResults.filter(c => c.hasInstagramIssues);
  const totalCampaigns = validationResults.length;
  const hasIssues = campaignsWithIssues.length > 0;

  const handleRepair = async (campaign: CampaignValidationResult) => {
    if (isRepairing) return;
    
    setSelectedCampaign(campaign.campaignId);
    
    try {
      const result = await onRepair(campaign);
      setRepairResults(prev => ({
        ...prev,
        [campaign.campaignId]: result
      }));
    } catch (error) {
      console.error('Error repairing campaign:', error);
    } finally {
      setSelectedCampaign(null);
    }
  };

  const handleRepairAll = async () => {
    if (isRepairing) return;
    
    for (const campaign of campaignsWithIssues) {
      await handleRepair(campaign);
      // Pequena pausa entre reparos
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (validationResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Instagram className="w-5 h-5" />
            <span>Auto-correção de Instagram</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              Clique no botão abaixo para verificar suas campanhas e corrigir problemas de Instagram automaticamente.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button 
              variant="default" 
              onClick={onValidate}
              disabled={isValidating}
              className="flex items-center space-x-2"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              <span>Verificar Campanhas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Instagram className="w-5 h-5" />
            <span>Auto-correção de Instagram</span>
            {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="flex items-center space-x-2">
            {hasIssues && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                {campaignsWithIssues.length} com problemas
              </Badge>
            )}
            {!hasIssues && validationResults.length > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Todas verificadas
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onValidate}
              disabled={isValidating}
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasIssues && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Todas as campanhas ({totalCampaigns}) estão configuradas corretamente com Instagram.
            </AlertDescription>
          </Alert>
        )}

        {hasIssues && (
          <>
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription>
                <strong>{campaignsWithIssues.length} de {totalCampaigns} campanhas</strong> têm problemas 
                de configuração de Instagram que podem ser corrigidas automaticamente.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between items-center">
              <Button
                variant="default"
                onClick={handleRepairAll}
                disabled={isRepairing}
                className="flex items-center space-x-2"
              >
                {isRepairing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4 mr-2" />
                )}
                <span>Corrigir Todas</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1 text-sm"
              >
                <span>Detalhes</span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {showDetails && (
              <div className="space-y-3 mt-4">
                <Progress 
                  value={((totalCampaigns - campaignsWithIssues.length) / totalCampaigns) * 100} 
                  className="h-2" 
                />
                <p className="text-sm text-gray-500 text-center">
                  {totalCampaigns - campaignsWithIssues.length} de {totalCampaigns} campanhas OK
                </p>
                
                <div className="space-y-2 mt-4">
                  {campaignsWithIssues.map((campaign) => {
                    const repairResult = repairResults[campaign.campaignId];
                    const isSelected = selectedCampaign === campaign.campaignId;
                    
                    return (
                      <div 
                        key={campaign.campaignId}
                        className="border rounded-md p-3"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{campaign.campaignName}</h4>
                            <p className="text-sm text-gray-500">
                              {campaign.creativeIds.length} criativo(s)
                            </p>
                          </div>
                          
                          {repairResult ? (
                            <Badge
                              variant={repairResult.failedRepairs === 0 ? "default" : "outline"}
                              className={repairResult.failedRepairs === 0 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {repairResult.failedRepairs === 0 
                                ? "Corrigido" 
                                : `${repairResult.repairedCreatives}/${repairResult.totalCreatives} corrigidos`
                              }
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRepair(campaign)}
                              disabled={isRepairing || isSelected}
                            >
                              {isSelected ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Wrench className="w-4 h-4 mr-1" />
                              )}
                              <span>Corrigir</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
