
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { CheckCircle, XCircle, Mail, Loader2, ArrowLeft } from 'lucide-react';

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired' | 'already_confirmed' | 'already_authenticated';

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      // Se o usuário já está autenticado, não precisa confirmar novamente
      if (isAuthenticated && user) {
        console.log('Usuário já está autenticado, redirecionando...');
        setStatus('already_authenticated');
        setMessage('Você já está logado! Redirecionando para o dashboard...');
        
        // Aguardar 2 segundos e redirecionar
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        return;
      }

      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || !type) {
        setStatus('error');
        setMessage('Link de confirmação inválido. Verifique se o link está correto.');
        return;
      }

      try {
        console.log('Confirmando email com token:', token);
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          console.error('Erro na confirmação:', error);
          
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setStatus('expired');
            setMessage('O link de confirmação expirou ou é inválido. Solicite um novo link.');
          } else if (error.message.includes('already_confirmed')) {
            setStatus('already_confirmed');
            setMessage('Esta conta já foi confirmada anteriormente.');
          } else {
            setStatus('error');
            setMessage('Erro ao confirmar email. Tente novamente ou solicite um novo link.');
          }
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email confirmado com sucesso! Sua conta está ativa.');
          
          toast({
            title: "Email confirmado!",
            description: "Sua conta foi ativada com sucesso. Bem-vindo à Camply!",
          });

          // Redirecionar para o dashboard após 3 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        setStatus('error');
        setMessage('Erro inesperado ao confirmar email. Tente novamente.');
      }
    };

    confirmEmail();
  }, [searchParams, supabase, toast, isAuthenticated, user, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />;
      case 'success':
      case 'already_confirmed':
      case 'already_authenticated':
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'error':
      case 'expired':
        return <XCircle className="w-16 h-16 text-red-600" />;
      default:
        return <Mail className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirmando seu email...';
      case 'success':
        return 'Email confirmado com sucesso!';
      case 'already_confirmed':
        return 'Conta já confirmada';
      case 'already_authenticated':
        return 'Você já está logado!';
      case 'expired':
        return 'Link expirado';
      case 'error':
        return 'Erro na confirmação';
      default:
        return 'Confirmação de email';
    }
  };

  const resendConfirmation = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada para o novo link de confirmação.",
      });
    } catch (error) {
      toast({
        title: "Erro ao reenviar",
        description: "Não foi possível reenviar o email. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
            alt="Camply" 
            className="h-12 w-auto mx-auto mb-4"
          />
        </div>

        <Card className="w-full">
          <CardHeader className="text-center space-y-4">
            {getStatusIcon()}
            <CardTitle className="text-2xl font-bold">
              {getStatusTitle()}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {(status === 'success' || status === 'already_authenticated') && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Próximos passos:</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✅ Sua conta está ativa e pronta para uso</li>
                    <li>✅ Você pode criar suas primeiras campanhas</li>
                    <li>✅ Explore os recursos de IA da plataforma</li>
                  </ul>
                </div>
                
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link to="/dashboard">
                    Ir para o Dashboard
                  </Link>
                </Button>
              </div>
            )}

            {status === 'already_confirmed' && (
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link to="/dashboard">
                  Ir para o Dashboard
                </Link>
              </Button>
            )}

            {(status === 'expired' || status === 'error') && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">O que fazer:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Tente fazer login novamente</li>
                    <li>• Se necessário, solicite um novo link de confirmação</li>
                    <li>• Verifique sua caixa de entrada e spam</li>
                    <li>• Entre em contato com o suporte se o problema persistir</li>
                  </ul>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Ir para Login
                  </Link>
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center text-sm text-gray-600">
                Aguarde enquanto confirmamos seu email...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de suporte */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Problemas com a confirmação?{' '}
            <a 
              href="mailto:jefte.pcosta@gmail.com" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
