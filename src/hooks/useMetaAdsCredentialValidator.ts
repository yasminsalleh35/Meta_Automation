
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalMetaConfig } from '@/hooks/useGlobalMetaConfig';
import { metaAdsAuthService } from '@/services/metaAds/MetaAdsAuthService';
import { useMetaAdsPermissionLevels, PermissionLevel } from './useMetaAdsPermissionLevels';
import { supabase } from '@/integrations/supabase/client';

// ✅ CORREÇÃO: Detecção aprimorada de interferência de extensões
const detectExtensionInterference = () => {
  const hasMetaExtensions = window.chrome?.runtime?.getManifest || 
                           document.querySelector('script[src*="facebook"]') ||
                           document.querySelector('script[src*="meta"]') ||
                           document.querySelector('meta[property*="fb:"]') ||
                           // Detectar extensões comuns que interferem
                           window.navigator.userAgent.includes('FacebookWebView') ||
                           window.navigator.userAgent.includes('Instagram');
  
  if (hasMetaExtensions) {
    console.warn('⚠️ Possível interferência de extensão detectada. Recomende modo anônimo se houver problemas.');
  }
  
  return !!hasMetaExtensions;
};

export const useMetaAdsCredentialValidator = () => {
  const { toast } = useToast();
  const { config: globalConfig } = useGlobalMetaConfig();
  const { permissionLevels } = useMetaAdsPermissionLevels();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);

  const validateCredentials = async (
    appId?: string,
    appSecret?: string,
    permissionLevel: 'required' = 'required'
  ) => {
    // Use global config if no specific credentials provided
    const effectiveAppId = appId || globalConfig?.appId;
    const effectiveAppSecret = appSecret || globalConfig?.appSecret;

    if (!effectiveAppId || !effectiveAppSecret) {
      throw new Error('Configurações Meta Ads não encontradas. Entre em contato com o administrador.');
    }

    // ✅ CORREÇÃO: Detectar interferência de extensões
    const hasExtensionInterference = detectExtensionInterference();
    if (hasExtensionInterference) {
      toast({
        title: "⚠️ Extensões detectadas",
        description: "Se houver problemas no login, tente usar o modo anônimo do navegador.",
        variant: "default"
      });
    }

    setIsLoading(true);
    const startTime = Date.now(); // Track start time for user interaction detection
    
    try {
      console.log(`🚀 Starting OAuth with ${permissionLevel} permissions`);
      
      const redirectUri = `${window.location.origin}/auth/meta-callback`;
      const selectedPermissions = permissionLevels.required;

      if (!selectedPermissions) {
        console.error('❌ Permission level not found:', permissionLevel);
        throw new Error(`Nível de permissão inválido: ${permissionLevel}`);
      }
      
      // Use unified scopes from permissionLevels
      const requestedScopes = selectedPermissions.scopes;
      
      // ✅ CORREÇÃO: URL OAuth atualizada para v19.0 e parâmetros corrigidos
      const params = new URLSearchParams({
        client_id: effectiveAppId,
        redirect_uri: redirectUri,
        scope: requestedScopes.join(','),
        response_type: 'code',
        state: `meta_ads_oauth_${permissionLevel}_${Date.now()}`, // ✅ CORREÇÃO: State único
        display: 'popup',  // ✅ CORREÇÃO: Especificar display para popup
        auth_type: 'rerequest' // 👈 Força reapresentar consentimentos e exibir link da política
      });
      
      // ✅ CORREÇÃO: Usar v19.0 conforme objetivo
      const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
      
      console.log('🔗 Opening OAuth URL:', oauthUrl);
      console.log('📍 Redirect URI:', redirectUri);
      console.log('🔑 Requested scopes:', requestedScopes.join(','));
      console.log('🏷️ State parameter:', params.get('state'));
      console.log('🔄 Auth type: rerequest (forces policy display)');
      
      // ✅ CORREÇÃO: Melhor configuração e detecção de popup
      const popupFeatures = [
        'width=600',
        'height=700',
        'scrollbars=yes',
        'resizable=yes',
        'top=100',
        'left=100',
        'status=no',
        'toolbar=no',
        'menubar=no',
        'location=no'
      ].join(',');
      
      const authWindow = window.open(
        oauthUrl,
        'meta-auth',
        popupFeatures
      );

      // ✅ CORREÇÃO: Verificação mais robusta de popup bloqueado
      if (!authWindow) {
        throw new Error('Popup foi bloqueado pelo navegador. Permita popups para este site e tente novamente.');
      }
      
      // ✅ CORREÇÃO: Verificar se a janela foi fechada imediatamente (indicando erro)
      setTimeout(() => {
        if (authWindow.closed) {
          console.error('❌ Popup closed immediately - possible configuration error');
        }
      }, 100);

      return new Promise<{accessToken: string, grantedScopes: string[], integration?: any}>((resolve, reject) => {
        let checkClosedInterval: NodeJS.Timeout;
        let isResolved = false;
        let userInteracted = false; // ✅ CORREÇÃO 4: Rastrear interação do usuário

        const cleanup = () => {
          if (checkClosedInterval) clearInterval(checkClosedInterval);
          window.removeEventListener('message', messageListener);
          isResolved = true;
        };

        // ✅ FASE 1: Detecção corrigida - não tratar fechamento como cancelamento
        checkClosedInterval = setInterval(() => {
          if (authWindow?.closed && !isResolved) {
            cleanup();
            
            const now = Date.now();
            const elapsedTime = now - startTime;
            
            console.log(`🚪 OAuth window closed after ${elapsedTime}ms`);
            
            // ✅ CORREÇÃO CRÍTICA: Não assumir cancelamento - aguardar mensagem
            console.log('💭 Window closed, waiting for background processing or result message...');
            
            // Aguardar um tempo para ver se chega mensagem de sucesso em background
            setTimeout(() => {
              if (!isResolved) {
                console.log('⏰ No message received, treating as timeout');
                
                const userMessage = elapsedTime > 8000 
                  ? 'O processo está demorando mais que o esperado. Tente novamente ou verifique se o app está em revisão no Meta.'
                  : 'Popup fechou sem retorno. Tente novamente.';
                
                toast({
                  title: "Processo Interrompido",
                  description: userMessage,
                  variant: "default"
                });
                
                reject(new Error(userMessage));
              }
            }, 5000); // Aguarda 5s para ver se chega mensagem
          }
        }, 1000);

        // ✅ CORREÇÃO: Listener de mensagens aprimorado
        const messageListener = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin || isResolved) return;
          
          if (event.data.type === 'META_AUTH_SUCCESS') {
            cleanup();
            authWindow?.close();
            
            console.log('✅ Meta OAuth integration completed successfully');

            try {
              // Buscar integração salva no banco de dados
              const { data: integration, error } = await supabase
                .from('integrations')
                .select('*')
                .eq('provider', 'meta_ads')
                .eq('status', 'active')
                .single();

              if (error) {
                console.error('❌ Error fetching integration:', error);
                reject(new Error('Erro ao buscar integração salva'));
                return;
              }

              if (!integration) {
                console.error('❌ No active integration found');
                reject(new Error('Nenhuma integração ativa encontrada'));
                return;
              }

              console.log('✅ Integration found:', integration);
              setCurrentPermissions(['ads_management', 'pages_show_list']);

              toast({
                title: "✅ Autorização concedida!",
                description: `Conectado com sucesso. Integração salva no servidor.`,
              });

              resolve({
                accessToken: integration.access_token,
                grantedScopes: ['ads_management', 'pages_show_list'],
                integration
              });
            } catch (err) {
              console.error('❌ Error processing integration:', err);
              reject(new Error('Erro ao processar integração'));
            }
          } else if (event.data.type === 'META_AUTH_ERROR') {
            cleanup();
            authWindow?.close();
            
            console.error('❌ OAuth error received:', event.data.error);
            
            // ✅ FASE 2 & 5: Mensagens específicas para problemas de App Review
            let errorMessage = event.data.error || "Erro desconhecido durante a autorização";
            let errorTitle = "Erro na autorização";
            
            if (errorMessage.includes('redirect_uri_mismatch')) {
              errorTitle = "Configuração do App";
              errorMessage = "Redirect URI não registrado. Verifique se 'https://iacamply.com/auth/meta-callback' está configurado no Meta Developer Console.";
            } else if (errorMessage.includes('invalid_scope')) {
              errorTitle = "Permissões Não Aprovadas";
              errorMessage = "Algumas permissões requerem aprovação do Meta App Review. O app funcionará com permissões básicas enquanto aguarda aprovação.";
            } else if (errorMessage.includes('access_denied')) {
              errorTitle = "Acesso Negado";
              errorMessage = "Autorização negada. Você pode tentar novamente ou entrar em contato com o suporte.";
            } else if (errorMessage.includes('temporarily_unavailable')) {
              errorTitle = "Serviço Temporariamente Indisponível";
              errorMessage = "Meta APIs estão temporariamente indisponíveis. Tente novamente em alguns minutos.";
            }
            
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: "destructive"
            });
            
            reject(new Error(errorMessage));
          }
        };

        window.addEventListener('message', messageListener);
      });
    } catch (error) {
      console.error('❌ Error validating credentials:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validateCredentials,
    isLoading,
    currentPermissions,
    setCurrentPermissions
  };
};
