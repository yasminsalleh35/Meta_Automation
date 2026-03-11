
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Instagram, Bell, RefreshCw, CheckCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { useInstagramCampaignValidator, CampaignValidationResult } from '@/hooks/useInstagramCampaignValidator';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface InstagramMonitorProps {
  campaigns: Array<{
    id: string;
    name: string;
    pageId: string;
    creativeIds: string[];
  }>;
  refreshInterval?: number; // em minutos
  autoCheck?: boolean;
}

export const InstagramMonitor: React.FC<InstagramMonitorProps> = ({
  campaigns,
  refreshInterval = 60,
  autoCheck = true
}) => {
  const { validateCampaigns, validationResults, isValidating } = useInstagramCampaignValidator();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheckTime, setNextCheckTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const campaignsWithIssues = validationResults.filter(c => c.hasInstagramIssues);
  const hasIssues = campaignsWithIssues.length > 0;

  // Realizar a primeira validação ao carregar
  useEffect(() => {
    if (campaigns.length > 0 && autoCheck) {
      handleCheck();
    }
  }, [campaigns]);

  // Agendar próxima verificação
  useEffect(() => {
    if (!lastChecked || !autoCheck) return;
    
    const next = new Date(lastChecked.getTime() + refreshInterval * 60 * 1000);
    setNextCheckTime(next);
  }, [lastChecked, refreshInterval, autoCheck]);

  // Atualizar contador regressivo
  useEffect(() => {
    if (!nextCheckTime) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextCheckTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        handleCheck();
        clearInterval(timer);
        return;
      }
      
      // Formatando o tempo restante
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nextCheckTime]);

  const handleCheck = async () => {
    if (isValidating || campaigns.length === 0) return;

    try {
      // Preparar dados de campanhas para validação
      const campaignData = campaigns.map(c => ({
        campaignId: c.id,
        campaignName: c.name,
        pageId: c.pageId,
        creativeIds: c.creativeIds
      }));

      // Executar validação
      await validateCampaigns(campaignData);
      setLastChecked(new Date());
      
      // Notificar problemas encontrados
      const issueCount = validationResults.filter(c => c.hasInstagramIssues).length;
      if (issueCount > 0) {
        toast({
          title: "Problemas de Instagram detectados",
          description: `${issueCount} campanha(s) precisam de correção de Instagram.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error checking Instagram configuration:', error);
    }
  };

  const handleFixCampaign = (campaign: CampaignValidationResult) => {
    // Navegar para a página de edição com a aba de Instagram selecionada
    navigate(`/campaigns/${campaign.campaignId}/edit?tab=instagram`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Instagram className="w-5 h-5" />
            <span>Monitor de Instagram</span>
            {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          
          <div className="flex items-center space-x-2">
            {lastChecked && !isValidating && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {lastChecked.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Última verificação: {lastChecked.toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {nextCheckTime && timeLeft && !isValidating && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {timeLeft}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Próxima verificação automática em {timeLeft}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCheck}
              disabled={isValidating}
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!validationResults.length && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              Nenhuma verificação de Instagram realizada. Clique em verificar para analisar suas campanhas.
            </AlertDescription>
          </Alert>
        )}
        
        {validationResults.length > 0 && !hasIssues && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Todas as campanhas estão configuradas corretamente com Instagram.
            </AlertDescription>
          </Alert>
        )}
        
        {hasIssues && (
          <div className="space-y-3">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  <strong>{campaignsWithIssues.length}</strong> campanha(s) com problemas de Instagram.
                </span>
                <Bell className="w-4 h-4" />
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 mt-2">
              {campaignsWithIssues.map(campaign => (
                <div key={campaign.campaignId} className="border rounded-md p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{campaign.campaignName}</h4>
                    <p className="text-sm text-gray-500">
                      {campaign.creativeIds.length} criativo(s)
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFixCampaign(campaign)}
                  >
                    <span>Corrigir</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
