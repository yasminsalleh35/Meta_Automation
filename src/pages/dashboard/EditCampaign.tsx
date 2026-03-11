
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Loader2, Instagram, Save, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useInstagramCampaignValidator } from '@/hooks/useInstagramCampaignValidator';
import { InstagramAutoCorrection } from '@/components/campaign/meta-ads/InstagramAutoCorrection';
import { SimpleHeader } from '@/components/campaign/SimpleHeader';

const EditCampaign: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const supabase = useSupabase();
  const { existingIntegration } = useMetaAdsIntegration();
  const { 
    validationResults,
    isValidating, 
    isRepairing,
    validateCampaigns,
    repairCampaign
  } = useInstagramCampaignValidator();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id]);

  const fetchCampaignData = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Fetching campaign data for ID:', id);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Campanha não encontrada');
      }

      console.log('✅ Campaign data loaded:', data);
      setCampaignData(data);
      
      // Auto-validate Instagram if Meta integration exists
      if (existingIntegration?.access_token && data.meta_campaign_id) {
        await validateCampaigns([{
          campaignId: data.id,
          campaignName: data.name,
          pageId: data.meta_campaign_id, // Using campaign ID as placeholder
          creativeIds: data.meta_ad_id ? [data.meta_ad_id] : []
        }]);
      }
    } catch (error) {
      console.error('❌ Error fetching campaign data:', error);
      toast({
        title: "Erro ao carregar campanha",
        description: error instanceof Error ? error.message : "Não foi possível carregar a campanha.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: campaignData.name,
          objective: campaignData.objective,
          budget_daily: campaignData.budget_daily,
          budget_total: campaignData.budget_total,
          ad_title: campaignData.ad_title,
          ad_text: campaignData.ad_text,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Campanha atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('❌ Error saving campaign:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!campaignData) return;
    
    try {
      await validateCampaigns([{
        campaignId: campaignData.id,
        campaignName: campaignData.name,
        pageId: campaignData.meta_campaign_id || "",
        creativeIds: campaignData.meta_ad_id ? [campaignData.meta_ad_id] : []
      }]);
    } catch (error) {
      console.error('Error validating campaign:', error);
      toast({
        title: "Erro ao validar campanha",
        description: "Não foi possível validar a configuração do Instagram.",
        variant: "destructive"
      });
    }
  };

  const handleRepair = async (campaign: any) => {
    try {
      const result = await repairCampaign(
        campaign.campaignId,
        campaign.campaignName,
        campaign.pageId,
        campaign.creativeIds
      );
      
      if (result.failedRepairs === 0) {
        toast({
          title: "Correção concluída",
          description: `Todos os ${result.totalCreatives} criativos foram atualizados com Instagram.`
        });
      } else {
        toast({
          title: "Correção parcial",
          description: `${result.repairedCreatives} de ${result.totalCreatives} criativos foram corrigidos.`,
          variant: "default"
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error repairing campaign:', error);
      toast({
        title: "Erro na correção",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao corrigir o Instagram.",
        variant: "destructive"
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SimpleHeader 
          title="Carregando..."
          description="Aguarde enquanto carregamos os dados da campanha"
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mr-3" />
            <span>Carregando dados da campanha...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SimpleHeader 
          title="Campanha não encontrada"
          description="A campanha solicitada não foi encontrada"
        />
        <Card>
          <CardHeader className="text-center">
            <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>Campanha não encontrada</CardTitle>
            <CardDescription>
              Não foi possível encontrar a campanha solicitada.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/dashboard/campaigns')}>
              Voltar para Campanhas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SimpleHeader 
        title="Editar Campanha"
        description={campaignData.name}
      />

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center">
            <Instagram className="w-4 h-4 mr-2" />
            Instagram
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações principais da campanha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input
                    id="name"
                    value={campaignData.name || ''}
                    onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo</Label>
                  <Input
                    id="objective"
                    value={campaignData.objective || ''}
                    onChange={(e) => setCampaignData({...campaignData, objective: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_daily">Orçamento Diário (R$)</Label>
                  <Input
                    id="budget_daily"
                    type="number"
                    value={campaignData.budget_daily || ''}
                    onChange={(e) => setCampaignData({...campaignData, budget_daily: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budget_total">Orçamento Total (R$)</Label>
                  <Input
                    id="budget_total"
                    type="number"
                    value={campaignData.budget_total || ''}
                    onChange={(e) => setCampaignData({...campaignData, budget_total: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_title">Título do Anúncio</Label>
                <Input
                  id="ad_title"
                  value={campaignData.ad_title || ''}
                  onChange={(e) => setCampaignData({...campaignData, ad_title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad_text">Texto do Anúncio</Label>
                <Textarea
                  id="ad_text"
                  value={campaignData.ad_text || ''}
                  onChange={(e) => setCampaignData({...campaignData, ad_text: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCampaign} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="instagram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conexão Instagram</CardTitle>
              <CardDescription>
                Gerencie a conexão entre sua página do Facebook e conta do Instagram no criativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaignData.meta_campaign_id ? (
                <InstagramAutoCorrection
                  validationResults={validationResults}
                  isValidating={isValidating}
                  isRepairing={isRepairing}
                  onValidate={handleValidate}
                  onRepair={handleRepair}
                />
              ) : (
                <Alert>
                  <AlertDescription>
                    Esta campanha não foi criada no Meta Ads ainda. A validação do Instagram estará disponível após a criação.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditCampaign;
