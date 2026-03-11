
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Target,
  Calendar,
  Loader2,
  Settings,
  Cpu
} from 'lucide-react';
import { CampaignAnalysis, campaignAnalysisService } from '@/services/campaignAnalysisService';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  objective: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpa: number;
  roas: number;
  startDate: string;
  endDate?: string;
}

interface CampaignAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onAnalysisComplete: () => void;
}

const CampaignAnalysisModal: React.FC<CampaignAnalysisModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onAnalysisComplete
}) => {
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAIProviderInfo = () => {
    const configStr = localStorage.getItem('camply_ai_config');
    if (!configStr) return null;
    
    try {
      const config = JSON.parse(configStr);
      return {
        provider: config.provider,
        enabled: config.enabled,
        model: config.model
      };
    } catch {
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!campaign) return;

    const aiConfig = getAIProviderInfo();
    console.log('Configuração de IA:', aiConfig);

    setIsLoading(true);
    try {
      const result = await campaignAnalysisService.analyzeCampaign(campaign);
      setAnalysis(result);
      onAnalysisComplete();
      
      toast({
        title: "Análise concluída!",
        description: `A IA ${aiConfig?.provider === 'openai' ? 'OpenAI' : 'DeepSeek'} analisou sua campanha e gerou recomendações personalizadas.`,
      });
    } catch (error) {
      console.error('Erro na análise:', error);
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Não foi possível analisar a campanha.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <Target className="w-5 h-5 text-blue-600" />;
    if (score >= 40) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  const aiConfig = getAIProviderInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>Análise Inteligente da Campanha</span>
            {aiConfig && (
              <Badge variant="outline" className="ml-2">
                <Cpu className="w-3 h-3 mr-1" />
                {aiConfig.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {campaign?.name && `Análise detalhada: ${campaign.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto">
          {!analysis ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Análise Inteligente com IA
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  Nossa IA especializada irá analisar todos os dados da sua campanha e fornecer 
                  recomendações personalizadas para melhorar o desempenho.
                </p>

                {/* Mostrar informações do provedor de IA */}
                {aiConfig ? (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Provedor: {aiConfig.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Modelo: {aiConfig.model}
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">
                        IA não configurada
                      </span>
                    </div>
                    <div className="text-xs text-orange-600">
                      Configure OpenAI ou DeepSeek nas configurações de admin
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleAnalyze}
                disabled={isLoading || !aiConfig?.enabled}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Iniciar Análise
                  </>
                )}
              </Button>

              {!aiConfig?.enabled && (
                <p className="text-sm text-gray-500 mt-4">
                  Configure a integração de IA nas configurações de admin para usar esta funcionalidade
                </p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="strengths">Pontos Fortes</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
                <TabsTrigger value="actions">Próximos Passos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Score de Performance</span>
                      {getScoreIcon(analysis.performanceScore)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Progress value={analysis.performanceScore} className="h-3" />
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(analysis.performanceScore)}`}>
                          {analysis.performanceScore}/100
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
                    </div>
                  </CardContent>
                </Card>

                {analysis.weaknesses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-orange-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Oportunidades de Melhoria</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <TrendingDown className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="strengths" className="space-y-4">
                {analysis.strengths.length > 0 ? (
                  analysis.strengths.map((strength, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-800 font-medium">{strength}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Continue otimizando para descobrir os pontos fortes da sua campanha!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-gray-800">{recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                {analysis.nextActions.map((action, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-gray-800">{action}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignAnalysisModal;
