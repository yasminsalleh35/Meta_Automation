import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MetaCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');

      if (error) {
        console.error('Meta OAuth error:', error, errorDescription);
        
        // ✅ FASE 3: Melhor comunicação de erro
        let retryCount = 0;
        const sendErrorMessage = () => {
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: 'META_AUTH_ERROR',
                error: `${error}: ${errorDescription || 'OAuth error'}`
              }, window.location.origin);
            } catch (err) {
              console.error('Failed to send error message, retrying...', err);
              retryCount++;
              if (retryCount < 3) {
                setTimeout(sendErrorMessage, 100);
                return;
              }
            }
          }
          // ✅ FASE 3: Delay maior para garantir comunicação
          setTimeout(() => window.close(), 1500);
        };
        
        sendErrorMessage();
        return;
      }

      if (!code) {
        console.error('MetaCallback: missing code');
        
        // ✅ FASE 3: Comunicação robusta para erro de código
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({
              type: 'META_AUTH_ERROR',
              error: 'Authorization code not received'
            }, window.location.origin);
          } catch (err) {
            console.error('Failed to send error message:', err);
          }
        }
        
        // ✅ FASE 3: Delay maior para garantir comunicação
        setTimeout(() => window.close(), 1500);
        return;
      }

      try {
        // Garantir que o redirect_uri é consistente com o usado na abertura do OAuth
        const redirect_uri = `${window.location.origin}/auth/meta-callback`;
        
        // Obter sessão do usuário autenticado
        const { data: { session } } = await supabase.auth.getSession();
        const jwt = session?.access_token;
        
        if (!jwt) {
          console.error('MetaCallback: no user session');
          
          // ✅ FASE 3: Comunicação robusta para erro de sessão
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: 'META_AUTH_ERROR',
                error: 'User session not found. Please log in again.'
              }, window.location.origin);
            } catch (err) {
              console.error('Failed to send error message:', err);
            }
          }
          
          // ✅ FASE 3: Delay maior para garantir comunicação
          setTimeout(() => window.close(), 1500);
          return;
        }

        // Chamar a Edge Function para trocar o código por token
        const response = await fetch(`https://ibwhqkgvrkkqxiksbiqr.supabase.co/functions/v1/meta-oauth-exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ code, redirect_uri, state })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('meta-oauth-exchange failed:', errorData);
          
          // ✅ FASE 3: Comunicação robusta para erro de exchange
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: 'META_AUTH_ERROR',
                error: errorData?.error || 'Token exchange failed'
              }, window.location.origin);
            } catch (err) {
              console.error('Failed to send error message:', err);
            }
          }
          
          // ✅ FASE 3: Delay maior para garantir comunicação
          setTimeout(() => window.close(), 1500);
          return;
        }

        const resultData = await response.json();
        console.log('Meta OAuth exchange successful:', resultData);

        // ✅ FASE 1: Melhorar comunicação e evitar navegação
        console.log('✅ OAuth completed, posting success message to parent...');
        
        // Retry mechanism for reliable communication
        let retryCount = 0;
        const maxRetries = 3;
        
        const sendMessage = () => {
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: 'META_AUTH_SUCCESS_WITH_ASSETS',
                data: {
                  success: true,
                  integrationId: resultData.integration_id,
                  shouldShowAssetSelector: true,
                  // ✅ Propagar whatsappAssets (garantir sempre array)
                  whatsappAssets: Array.isArray(resultData.whatsappAssets) ? resultData.whatsappAssets : []
                }
              }, window.location.origin);
              
              console.log('✅ Success message posted to parent window');
              
              // ✅ FASE 3: Delay otimizado para sucesso (garantir comunicação)
              setTimeout(() => {
                window.close();
              }, 1000);
              
            } catch (error) {
              console.error('Failed to post message, retrying...', error);
              retryCount++;
              if (retryCount < maxRetries) {
                setTimeout(sendMessage, 100);
              } else {
                console.error('Max retries reached, closing popup');
                window.close();
              }
            }
          } else {
            console.warn('⚠️ Parent window not available or closed');
            window.close();
          }
        };
        
        sendMessage();
      } catch (error) {
        console.error('Meta OAuth exchange error:', error);
        
        // ✅ FASE 3: Comunicação final robusta
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({
              type: 'META_AUTH_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            }, window.location.origin);
          } catch (err) {
            console.error('Failed to send final error message:', err);
          }
        }
        
        // ✅ FASE 3: Delay final otimizado
        setTimeout(() => window.close(), 1500);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const error = searchParams.get('error');
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center space-y-4">
          {error ? (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Erro na Conexão</h2>
                <p className="text-muted-foreground mt-2">
                  Ocorreu um erro ao conectar sua conta Meta. Tente novamente.
                </p>
              </div>
            </>
          ) : code ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Conectando...</h2>
                <p className="text-muted-foreground mt-2">
                  Finalizando a conexão com sua conta Meta...
                </p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-16 w-16 text-muted-foreground mx-auto animate-spin" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Processando...</h2>
                <p className="text-muted-foreground mt-2">
                  Aguarde enquanto processamos sua solicitação...
                </p>
              </div>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {error || code ? 'Esta janela será fechada automaticamente.' : 'Aguarde enquanto processamos sua solicitação...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetaCallback;