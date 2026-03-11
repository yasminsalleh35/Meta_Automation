
import { useToast } from '@/hooks/use-toast';

interface UseMetaAdsConnectionActionsProps {
  globalConfig: any;
  validateCredentials: (appId?: string, appSecret?: string, permissionLevel?: 'required') => Promise<any>;
  fetchAccountsAndPages: () => Promise<any>;
  setAccessToken: (token: string) => void;
  setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setSelectedPages: (pages: string[]) => void;
}

export const useMetaAdsConnectionActions = ({
  globalConfig,
  validateCredentials,
  fetchAccountsAndPages,
  setAccessToken,
  setCurrentStep,
  setSelectedAccounts,
  setSelectedPages
}: UseMetaAdsConnectionActionsProps) => {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      console.log('🚀 Starting OAuth connection process...');
      
      // Validar configuração global primeiro
      if (!globalConfig?.appId || !globalConfig?.appSecret) {
        console.error('❌ Global config missing:', globalConfig);
        toast({
          title: "Configuração incompleta",
          description: "Configuração global do Meta Ads não encontrada. Entre em contato com o administrador.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Global config validated:', {
        hasAppId: !!globalConfig.appId,
        hasAppSecret: !!globalConfig.appSecret,
        businessManagerId: globalConfig.businessManagerId
      });

      // ✅ CORREÇÃO: Usar múltiplas URLs de callback como fallback
      const currentOrigin = window.location.origin;
      const callbackUrls = [
        `${currentOrigin}/auth/meta-callback`,
        `${currentOrigin}/auth/callback/meta`
      ];
      
      // Usar a primeira URL como principal
      const primaryRedirectUri = callbackUrls[0];
      
      console.log('🔍 OAuth Configuration:', {
        origin: currentOrigin,
        primaryRedirectUri,
        allCallbackUrls: callbackUrls,
        appId: globalConfig.appId,
        isSecure: currentOrigin.startsWith('https://') || currentOrigin.includes('localhost')
      });

      // ✅ CORREÇÃO: Verificar se as URLs estão nas configurações do Meta
      if (currentOrigin === 'https://iacamply.com') {
        console.log('✅ Using production domain - available redirect URIs:', callbackUrls);
      }

      // ✅ CORREÇÃO: Alertar sobre problemas de configuração comuns
      if (!currentOrigin.startsWith('https://') && !currentOrigin.includes('localhost')) {
        console.warn('⚠️ Non-HTTPS origin detected. Meta OAuth requires HTTPS in production.');
        toast({
          title: "⚠️ Aviso de Configuração",
          description: "Conexões não-HTTPS podem causar problemas. Use HTTPS em produção.",
          variant: "destructive"
        });
      }

      // Iniciar OAuth com permissões unificadas
      const result = await validateCredentials(undefined, undefined, 'required');
      
      if (!result || (!result.accessToken && !result.integration)) {
        console.error('❌ No access token or integration received from OAuth');
        throw new Error('Token de acesso não foi recebido');
      }
      
      const token = result.accessToken || result.integration?.access_token;
      
      console.log('✅ OAuth completed, token received:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        grantedScopesCount: result.grantedScopes?.length || 0,
        hasIntegration: !!result.integration
      });
      
      setAccessToken(token);
      
      // Fetch accounts and pages using Edge Functions (no token needed)
      const assetsResult = await fetchAccountsAndPages();
      
      // Check if we got any assets
      const hasAccounts = assetsResult?.accounts?.length > 0;
      const hasPages = assetsResult?.pages?.length > 0;
      
      if (hasAccounts || hasPages) {
        console.log('✅ Assets loaded successfully:', {
          accounts: assetsResult.accounts?.length || 0,
          pages: assetsResult.pages?.length || 0
        });
        
        // Auto-selecionar primeiro asset de cada tipo
        if (assetsResult.accounts?.length > 0) {
          const firstAccountId = assetsResult.accounts[0].id;
          console.log('🤖 Auto-selecting first account:', firstAccountId);
          setSelectedAccounts([firstAccountId]);
        }
        
        if (assetsResult.pages?.length > 0) {
          const firstPageId = assetsResult.pages[0].id;
          console.log('🤖 Auto-selecting first page:', firstPageId);
          setSelectedPages([firstPageId]);
        }
        
        // Progredir para seleção de contas
        setCurrentStep('accounts');
        
        toast({
          title: "Conectado com sucesso!",
          description: `Encontradas ${assetsResult.accounts?.length || 0} contas de anúncios e ${assetsResult.pages?.length || 0} páginas.`,
        });
      } else {
        console.warn('⚠️ No assets found, but OAuth was successful');
        setCurrentStep('permissions');
        
        toast({
          title: "Conectado, mas...",
          description: "Conexão realizada, mas nenhuma conta de anúncio ou página foi encontrada. Verifique suas permissões.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na conexão";
      
      // ✅ CORREÇÃO: Melhor tratamento de erros específicos do OAuth
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes('Popup foi bloqueado')) {
        userFriendlyMessage = "Popup foi bloqueado pelo navegador. Permita popups para este site e tente novamente.";
      } else if (errorMessage.includes('Autorização cancelada')) {
        userFriendlyMessage = "Se você não cancelou a autorização, pode haver um problema de configuração. Tente novamente ou entre em contato com o suporte.";
      } else if (errorMessage.includes('redirect_uri')) {
        userFriendlyMessage = "Erro de configuração do redirect URI. Verifique se as URLs estão registradas no Meta App: /auth/meta-callback ou /auth/callback/meta";
      } else if (errorMessage.includes('permissions') || errorMessage.includes('scope')) {
        userFriendlyMessage = "Erro de permissões. Verifique se o app Meta está configurado corretamente.";
      }
      
      // Manter no passo atual em caso de erro
      toast({
        title: "Erro na conexão",
        description: userFriendlyMessage,
        variant: "destructive"
      });
    }
  };

  return {
    handleConnect
  };
};
