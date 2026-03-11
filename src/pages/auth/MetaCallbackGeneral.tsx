
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const MetaCallbackGeneral = () => {
  useEffect(() => {
    console.log('🔗 MetaCallbackGeneral: Component mounted');
    console.log('🌐 MetaCallbackGeneral: Current URL:', window.location.href);
    console.log('🎯 MetaCallbackGeneral: Expected origin:', window.location.origin);
    
    // Parse dos parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const state = urlParams.get('state');

    console.log('📋 MetaCallbackGeneral: URL params:', { 
      hasCode: !!code, 
      hasError: !!error, 
      errorDescription, 
      state,
      fullUrl: window.location.href
    });

    // Verificar se estamos na URL correta
    const expectedPath = '/auth/callback/meta';
    const currentPath = window.location.pathname;
    
    if (currentPath !== expectedPath) {
      console.error('❌ MetaCallbackGeneral: Wrong callback path!', {
        expected: expectedPath,
        current: currentPath,
        fullUrl: window.location.href
      });
    }

    // Melhor detecção de origem
    const isValidOrigin = window.opener && window.location.origin;
    
    if (!isValidOrigin) {
      console.error('❌ MetaCallbackGeneral: Invalid origin or no opener window');
      return;
    }

    if (error) {
      console.error('❌ MetaCallbackGeneral: OAuth error:', error, errorDescription);
      
      // Classificar tipos de erro
      const userErrors = ['access_denied', 'user_denied'];
      const isUserCancellation = userErrors.includes(error);
      
      const errorMessage = isUserCancellation 
        ? 'Autorização cancelada pelo usuário'
        : errorDescription || error || 'Erro desconhecido na autorização';
      
      if (window.opener) {
        window.opener.postMessage({
          type: 'META_AUTH_ERROR',
          error: errorMessage,
          isUserCancellation
        }, window.location.origin);
      }
    } else if (code) {
      // Validação rigorosa do state
      const statePattern = /^meta_ads_oauth_(basic|advanced)_\d+$/;
      const isValidState = state && statePattern.test(state);
      
      if (isValidState) {
        console.log('✅ MetaCallbackGeneral: OAuth success, sending code to parent');
        
        const permissionLevel = state.includes('advanced') ? 'advanced' : 'basic';
        console.log('🔑 MetaCallbackGeneral: Permission level:', permissionLevel);
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'META_AUTH_SUCCESS',
            code: code,
            permissionLevel: permissionLevel
          }, window.location.origin);
        }
      } else {
        console.warn('⚠️ MetaCallbackGeneral: Invalid state parameter:', state);
        console.log('🔍 MetaCallbackGeneral: State validation details:', {
          state,
          pattern: statePattern.toString(),
          matches: statePattern.test(state || '')
        });
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'META_AUTH_ERROR',
            error: 'State parameter inválido - possível tentativa de CSRF ou configuração incorreta'
          }, window.location.origin);
        }
      }
    } else {
      console.warn('⚠️ MetaCallbackGeneral: Invalid callback parameters');
      if (window.opener) {
        window.opener.postMessage({
          type: 'META_AUTH_ERROR',
          error: 'Parâmetros de callback inválidos - verifique a configuração do redirect URI'
        }, window.location.origin);
      }
    }

    // ✅ CORREÇÃO 4: Aumentar delay para garantir que asset selector abra completamente
    const timer = setTimeout(() => {
      console.log('🚪 MetaCallbackGeneral: Closing popup window');
      window.close();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Determine what to show based on URL params
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        {error ? (
          <>
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Erro na Autorização</h2>
            <p className="text-gray-600 mb-4">
              {error === 'access_denied' 
                ? 'Você cancelou a autorização. Feche esta janela e tente novamente.'
                : 'Houve um problema com a autorização do Meta Ads.'
              }
            </p>
            {urlParams.get('error_description') && (
              <p className="text-sm text-red-600">{urlParams.get('error_description')}</p>
            )}
          </>
        ) : code ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Autorização Concedida!</h2>
            <p className="text-gray-600 mb-4">Processando suas credenciais...</p>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Trocando código por token de acesso</span>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Processando autorização...</h2>
            <p className="text-gray-600">Aguarde enquanto processamos sua solicitação.</p>
          </>
        )}
        
        <p className="text-xs text-gray-400 mt-6">
          Esta janela será fechada automaticamente.
        </p>
      </div>
    </div>
  );
};

export default MetaCallbackGeneral;
