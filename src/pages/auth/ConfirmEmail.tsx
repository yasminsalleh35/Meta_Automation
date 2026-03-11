import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabase } from '@/hooks/useSupabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const ConfirmEmail: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirmando seu email...');
  const navigate = useNavigate();
  const supabase = useSupabase();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Processar tokens da URL e monitorar criação de sessão
    const handleEmailConfirmation = async () => {
      try {
        console.log('[ConfirmEmail] Processing email confirmation...');
        
        // Extrair tokens do hash da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('[ConfirmEmail] URL params:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          type 
        });

        // Se tem tokens na URL, processar
        if (accessToken && refreshToken) {
          console.log('[ConfirmEmail] Found tokens in URL, setting session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('[ConfirmEmail] Error setting session:', error);
            setStatus('error');
            setMessage('Link de confirmação inválido ou expirado.');
            return;
          }

          if (data.session) {
            console.log('[ConfirmEmail] Session created successfully');
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            
            setTimeout(() => {
              navigate('/auth/set-password', { replace: true });
            }, 1000);
          }
        } else {
          // Verificar se já tem sessão ativa
          console.log('[ConfirmEmail] No tokens in URL, checking existing session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[ConfirmEmail] Error getting session:', error);
            setStatus('error');
            setMessage('Erro ao confirmar email.');
            return;
          }

          if (session) {
            console.log('[ConfirmEmail] Active session found');
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            
            setTimeout(() => {
              navigate('/auth/set-password', { replace: true });
            }, 1000);
          } else {
            // Aguardar evento de auth (pode demorar alguns ms)
            console.log('[ConfirmEmail] No session yet, waiting for auth event...');
            
            // Timeout de 10 segundos
            timeoutId = setTimeout(() => {
              console.log('[ConfirmEmail] Timeout - link may be invalid');
              setStatus('error');
              setMessage('Link de confirmação inválido ou expirado.');
            }, 10000);
          }
        }
      } catch (err) {
        console.error('[ConfirmEmail] Unexpected error:', err);
        setStatus('error');
        setMessage('Erro inesperado. Por favor, tente novamente.');
      }
    };

    // Monitorar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[ConfirmEmail] Auth event:', event, 'Has session:', !!session);
        
        if (event === 'SIGNED_IN' && session) {
          clearTimeout(timeoutId);
          setStatus('success');
          setMessage('Email confirmado com sucesso!');
          
          setTimeout(() => {
            navigate('/auth/set-password', { replace: true });
          }, 1000);
        }
      }
    );

    handleEmailConfirmation();

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-camply-blue via-blue-500 to-camply-green">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/assets/images/1952e99c-e76f-41a2-909b-722e20f847cb.png" 
                alt="Camply" 
                className="h-12 w-auto"
              />
            </div>

            {status === 'loading' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-camply-blue/10 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-camply-blue animate-spin" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Confirmando Email</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sucesso!</h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">Redirecionando...</p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Erro</h2>
                <p className="text-gray-600">{message}</p>
                <button
                  onClick={() => navigate('/auth/login')}
                  className="text-camply-blue hover:text-camply-blue/80 font-medium"
                >
                  Voltar para login
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
