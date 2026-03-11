
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';

export const useMetaAdsIntegrationManager = () => {
  const supabase = useSupabase();
  const { session } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const checkExistingIntegration = async () => {
    if (!session?.user) return null;

    try {
      // ✅ CORREÇÃO: Tentar primeiro com meta_ads, depois com meta
      const queries = [
        { provider: 'meta_ads' },
        { provider: 'meta' }
      ];

      for (const query of queries) {
        console.log(`🔍 Checking integration with provider: ${query.provider}`);
        
        const { data, error } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('provider', query.provider)
          .single();

        if (data) {
          console.log(`✅ Found integration with provider: ${query.provider}`, data);
          return data;
        }

        if (error && error.code !== 'PGRST116') {
          console.warn(`⚠️ Error checking ${query.provider}:`, error);
        }
      }

      console.log('🔍 No existing integration found');
      return null;
    } catch (error) {
      console.error('❌ Error checking existing integration:', error);
      return null;
    }
  };

  const saveIntegration = async (
    appId: string,
    appSecret: string,
    accessToken: string,
    selectedAccounts: string[],
    selectedPages: any[], // Changed from string[] to any[] to accept MetaPage objects
    businessManagerId?: string
  ) => {
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setIsProcessing(true);
      console.log('💾 Starting integration save process...');

      // ✅ CORREÇÃO: Usar Edge Function para buscar páginas Meta (evita CSP)
      let realPagesData = [];
      try {
        console.log('📊 Fetching pages via Edge Function...');
        const { data: assetsResult, error: assetsError } = await supabase.functions.invoke('meta-assets', {
          body: { 
            fetchAccounts: false,
            fetchPages: true,
            fetchInstagram: false
          }
        });

        if (assetsError) {
          console.warn('⚠️ Edge Function error:', assetsError);
        } else if (assetsResult?.pages) {
          realPagesData = assetsResult.pages;
          console.log('✅ Fetched real pages data via Edge Function:', realPagesData.length);
        }
      } catch (apiError) {
        console.warn('⚠️ Could not fetch pages via Edge Function:', apiError);
        // Fallback: usar selectedPages se disponível
        if (selectedPages.length > 0) {
          console.log('🔄 Using selected pages as fallback');
          realPagesData = selectedPages;
        }
      }

      // ✅ CORREÇÃO 5: Garantir que temos page_id válida
      const hasValidPageId = realPagesData.length > 0 || selectedPages.length > 0;
      if (!hasValidPageId) {
        console.warn('⚠️ No valid page_id available for integration');
        toast({
          title: "⚠️ Aviso",
          description: "Nenhuma página do Facebook foi encontrada. A integração pode ter funcionalidade limitada.",
          variant: "destructive"
        });
      }

      const existing = await checkExistingIntegration();

      // ✅ CORREÇÃO 2: Usar provider correto baseado na integração existente
      const integrationData = {
        user_id: session.user.id,
        provider: existing?.provider || 'meta_ads', // Usar provider existente ou default
        status: 'active',
        access_token: accessToken,
        app_id: appId,
        selected_accounts: selectedAccounts,
        selected_pages: selectedPages.length > 0 ? selectedPages : (realPagesData.length > 0 ? realPagesData : []),
        ad_account_id: selectedAccounts.length > 0 ? selectedAccounts[0] : null,
        page_id: selectedPages.length > 0 ? (typeof selectedPages[0] === 'string' ? selectedPages[0] : selectedPages[0]?.id) : (realPagesData.length > 0 ? realPagesData[0].id : null),
        business_manager_id: businessManagerId,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving integration with data:', {
        hasSelectedAccounts: selectedAccounts.length > 0,
        hasRealPages: realPagesData.length > 0,
        hasSelectedPages: selectedPages.length > 0,
        adAccountId: integrationData.ad_account_id,
        pageId: integrationData.page_id,
        provider: integrationData.provider
      });

      if (existing) {
        console.log('🔄 Updating existing integration:', existing.id);
        
        const { error } = await supabase
          .from('integrations')
          .update(integrationData)
          .eq('id', existing.id);

        if (error) {
          console.error('❌ Error updating integration:', error);
          throw error;
        }
      } else {
        console.log('🆕 Creating new integration');
        
        const { error } = await supabase
          .from('integrations')
          .insert([integrationData]);

        if (error) {
          console.error('❌ Error creating integration:', error);
          throw error;
        }
      }

      console.log('✅ Integration saved successfully');
      
      toast({
        title: "✅ Integração salva!",
        description: "Meta Ads foi integrado com sucesso ao seu projeto.",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error saving integration:', error);
      
      toast({
        title: "❌ Erro ao salvar integração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const disconnectIntegration = async () => {
    if (!session?.user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setIsProcessing(true);
      console.log('🔌 Starting integration disconnection...');

      const existing = await checkExistingIntegration();
      
      if (!existing) {
        console.log('⚠️ No existing integration found to disconnect');
        return true;
      }

      // ✅ CORREÇÃO: Remover pela provider correta
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', session.user.id)
        .eq('provider', existing.provider); // Usar o provider encontrado

      if (error) {
        console.error('❌ Error disconnecting integration:', error);
        throw error;
      }

      console.log('✅ Integration disconnected successfully');
      
      toast({
        title: "🔌 Integração desconectada",
        description: "Meta Ads foi desconectado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('❌ Error in disconnectIntegration:', error);
      toast({
        title: "❌ Erro ao desconectar",
        description: "Não foi possível desconectar a integração. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const forceReconnection = async () => {
    console.log('🔄 Force reconnection initiated');
    
    try {
      await disconnectIntegration();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Force reconnection completed');
      return true;
    } catch (error) {
      console.error('❌ Error in force reconnection:', error);
      throw error;
    }
  };

  return {
    saveIntegration,
    checkExistingIntegration,
    disconnectIntegration,
    forceReconnection,
    isProcessing
  };
};
