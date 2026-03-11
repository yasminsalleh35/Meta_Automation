import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FlaskConical, RotateCcw, Sparkles, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import CampaignTestPanel from '@/components/admin/meta-test-lab/CampaignTestPanel';
import AdSetTestPanel from '@/components/admin/meta-test-lab/AdSetTestPanel';
import { CreativeTestPanel } from '@/components/admin/meta-test-lab/CreativeTestPanel';
import AdTestPanel from '@/components/admin/meta-test-lab/AdTestPanel';
import { CampaignWizardTest } from '@/components/admin/meta-test-lab/CampaignWizardTest';
import { MetaAssetsProvider } from '@/contexts/MetaAssetsContext';

const MetaTestLab: React.FC = () => {
  const { existingIntegration, isLoading } = useMetaAdsIntegration();
  const [profileMode, setProfileMode] = useState<'ctwa' | 'wa_link'>('ctwa');
  const [activeTab, setActiveTab] = useState('campaign');
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignObjective, setCampaignObjective] = useState<string>('OUTCOME_TRAFFIC');
  const [adSetId, setAdSetId] = useState<string | null>(null);
  const [creativeId, setCreativeId] = useState<string | null>(null);
  
  // Fase 3: Extrair Instagram User ID da integração
  const instagramUserId = existingIntegration?.selected_instagram_ids?.[0] || existingIntegration?.selected_accounts?.[0];
  
  console.log('🔍 [MetaTestLab] Integration data:', {
    instagramUserId,
    selected_instagram_ids: existingIntegration?.selected_instagram_ids,
    selected_accounts: existingIntegration?.selected_accounts,
    pageId: existingIntegration?.page_id,
    hasInstagramUserId: !!instagramUserId,
    hasPageId: !!existingIntegration?.page_id
  });

  const handleReset = () => {
    setCampaignId(null);
    setCampaignObjective('OUTCOME_TRAFFIC');
    setAdSetId(null);
    setCreativeId(null);
    setActiveTab('campaign');
  };

  const handleCampaignCreated = (id: string, objective: string) => {
    setCampaignId(id);
    setCampaignObjective(objective);
    setActiveTab('adset');
  };

  const handleAdSetCreated = (id: string) => {
    setAdSetId(id);
    setActiveTab('creative');
  };

  const handleCreativeCreated = (id: string) => {
    setCreativeId(id);
    setActiveTab('ad');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const hasIntegration = existingIntegration?.status === 'active';
  const adAccountId = existingIntegration?.ad_account_id;
  const pageId = existingIntegration?.page_id;
  const accessToken = existingIntegration?.access_token;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FlaskConical className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meta Test Lab</h1>
            <p className="text-muted-foreground">Teste campanhas, ad sets e anúncios de forma isolada</p>
          </div>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Test Lab
        </Button>
      </div>

      {/* Integration Status Alert */}
      {!hasIntegration && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Integração Meta Ads não encontrada ou inativa. Configure em{' '}
            <a href="/dashboard/integrations" className="underline font-medium">
              /dashboard/integrations
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Integration Info Card */}
      {hasIntegration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Integração Ativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground">Ad Account ID:</p>
                <p className="font-mono text-xs">{adAccountId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Page ID:</p>
                <p className="font-mono text-xs">{pageId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Access Token:</p>
                <p className="font-mono text-xs">{accessToken ? '***' + accessToken.slice(-8) : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Mode Selector */}
      {hasIntegration && adAccountId && pageId && accessToken && (
        <MetaAssetsProvider>
          <Tabs value={profileMode} onValueChange={(v) => setProfileMode(v as 'ctwa' | 'wa_link')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ctwa">
                <MessageCircle className="w-4 h-4 mr-2" />
                CTWA Nativo (Perfil 1)
              </TabsTrigger>
              <TabsTrigger value="wa_link">
                <LinkIcon className="w-4 h-4 mr-2" />
                WA.ME Link (Perfil 2) ✨
              </TabsTrigger>
            </TabsList>

            {/* Perfil 1: CTWA Nativo (Painel Atual) */}
            <TabsContent value="ctwa">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaign" className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  campaignId ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                Campanha
              </TabsTrigger>
              <TabsTrigger value="adset" disabled={!campaignId} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  adSetId ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                Ad Set
              </TabsTrigger>
              <TabsTrigger value="creative" disabled={!adSetId} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  creativeId ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <Sparkles className="w-3 h-3" />
                Creative
              </TabsTrigger>
              <TabsTrigger value="ad" disabled={!creativeId} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  4
                </div>
                Anúncio
              </TabsTrigger>
                </TabsList>

                <TabsContent value="campaign" className="mt-6">
                  <CampaignTestPanel
                    adAccountId={adAccountId}
                    pageId={pageId}
                    accessToken={accessToken}
                    onCampaignCreated={handleCampaignCreated}
                  />
                </TabsContent>

                <TabsContent value="adset" className="mt-6">
                  {campaignId && (
                    <AdSetTestPanel
                      key={campaignId}
                      adAccountId={adAccountId}
                      campaignId={campaignId}
                      campaignObjective={campaignObjective}
                      pageId={pageId}
                      accessToken={accessToken}
                      onAdSetCreated={handleAdSetCreated}
                    />
                  )}
                </TabsContent>

                <TabsContent value="creative" className="mt-6">
                  {adSetId && (
                    <CreativeTestPanel
                      adAccountId={adAccountId}
                      pageId={pageId}
                      accessToken={accessToken}
                      instagramUserId={instagramUserId}
                      onCreativeCreated={handleCreativeCreated}
                    />
                  )}
                </TabsContent>

                <TabsContent value="ad" className="mt-6">
                  {creativeId && (
                    <AdTestPanel
                      adAccountId={adAccountId}
                      adSetId={adSetId!}
                      accessToken={accessToken}
                      creativeId={creativeId}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Perfil 2: WA.ME Link (Novo Wizard) */}
            <TabsContent value="wa_link">
              <CampaignWizardTest
                mode="wa_link"
                adAccountId={adAccountId}
                pageId={pageId}
                accessToken={accessToken}
                instagramUserId={instagramUserId}
              />
            </TabsContent>
          </Tabs>
        </MetaAssetsProvider>
      )}
    </div>
  );
};

export default MetaTestLab;
