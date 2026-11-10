
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalMetaConfig } from '@/hooks/useGlobalMetaConfig';
import { useMetaAdsPermissionLevels, PermissionLevel } from './useMetaAdsPermissionLevels';
import { supabase } from '@/integrations/supabase/client';
import { INTEGRATION_SAFE_COLUMNS } from '@/lib/integrationColumns';

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
    // O app secret fica só no servidor (audit SEC-04); o OAuth precisa apenas do app id
    const effectiveAppId = appId || globalConfig?.appId;

    if (!effectiveAppId) {
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

      // CSRF (audit SEC-14): state aleatório registrado no servidor para este usuário
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      const oauthState = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
      const { error: stateError } = await supabase
        .from('oauth_states')
        .insert({ state: oauthState, user_id: currentUser.id, provider: 'meta_ads' });
      if (stateError) {
        console.error('❌ Failed to register OAuth state:', stateError.message);
        throw new Error('Não foi possível iniciar a conexão com a Meta. Tente novamente.');
      }

      // URL OAuth (mesma versão da Graph API usada nas Edge Functions: _shared/meta.ts)
      const params = new URLSearchParams({
        client_id: effectiveAppId,
        redirect_uri: redirectUri,
        scope: requestedScopes.join(','),
        response_type: 'code',
        state: oauthState,
        display: 'popup',  // ✅ CORREÇÃO: Especificar display para popup
        auth_type: 'rerequest' // 👈 Força reapresentar consentimentos e exibir link da política
      });
      
      // audit PLT-03: v23.0, igual a META_GRAPH_VERSION
      const oauthUrl = `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
      
      console.log('📍 Redirect URI:', redirectUri);
      console.log('🔑 Requested scopes:', requestedScopes.join(','));
      
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

      return new Promise<{accessToken: string, grantedScopes: string[], integration?: unknown}>((resolve, reject) => {
        // eslint-disable-next-line prefer-const -- lido em cleanup() antes de ser atribuído
        let checkClosedInterval: ReturnType<typeof setInterval> | undefined;
        let isResolved = false;
        let messageListenerActive = true;

        const cleanup = () => {
          if (checkClosedInterval) clearInterval(checkClosedInterval);
          if (messageListenerActive) {
            window.removeEventListener('message', messageListener);
            messageListenerActive = false;
          }
          isResolved = true;
        };

        // When popup closes, DON'T remove message listener — keep listening for the success message
        checkClosedInterval = setInterval(() => {
          if (authWindow?.closed && !isResolved) {
            // Only stop the interval, keep the message listener active
            if (checkClosedInterval) clearInterval(checkClosedInterval);

            const now = Date.now();
            const elapsedTime = now - startTime;

            console.log(`🚪 OAuth window closed after ${elapsedTime}ms`);
            console.log('💭 Window closed, keeping message listener active for background processing...');

            // Give 30 seconds for the message to arrive (network latency, slow server, etc.)
            setTimeout(() => {
              if (!isResolved) {
                console.log('⏰ No message received after 30s, treating as timeout');
                cleanup();

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
            }, 30000); // 30s grace period for slow networks
          }
        }, 1000);

        // Listen for BOTH message types (META_AUTH_SUCCESS and META_AUTH_SUCCESS_WITH_ASSETS)
        const messageListener = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin || isResolved) return;

          if (event.data.type === 'META_AUTH_SUCCESS' || event.data.type === 'META_AUTH_SUCCESS_WITH_ASSETS') {
            cleanup();
            authWindow?.close();
            
            console.log('✅ Meta OAuth integration completed successfully');

            try {
              // Buscar integração salva no banco de dados
              const { data: integration, error } = await supabase
                .from('integrations')
                .select(INTEGRATION_SAFE_COLUMNS) // token fica no servidor (audit SEC-12)
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

              console.log('✅ Integration found');
              setCurrentPermissions(['ads_management', 'pages_show_list']);

              toast({
                title: "✅ Autorização concedida!",
                description: `Conectado com sucesso. Integração salva no servidor.`,
              });

              resolve({
                // O token não é legível no navegador (audit SEC-12); as edge functions o leem
                accessToken: '',
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
