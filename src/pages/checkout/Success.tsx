import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Crown, Sparkles, Calendar } from 'lucide-react';
import { PasswordSetupModal } from '@/components/checkout/PasswordSetupModal';

const CheckoutSuccess: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isNewUser = searchParams.get('new_user') === 'true';
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  
  // Guest checkout parameters
  const guestEmail = searchParams.get('guest_email');
  const guestName = searchParams.get('guest_name');
  const paymentMethod = searchParams.get('payment_method');
  const isGuestCheckout = !!(guestEmail && guestName && paymentMethod === 'pagarme_parcelado');

  useEffect(() => {
    if (!loading && !isAuthenticated && isNewUser && sessionId) {
      setShowPasswordSetup(true);
    } else if (!loading && !isAuthenticated && !isNewUser && !isGuestCheckout) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, loading, navigate, isNewUser, sessionId, isGuestCheckout]);

  const handleGoToDashboard = () => {
    navigate('/dashboard?subscription=active');
  };

  const handlePasswordSetupSuccess = () => {
    setShowPasswordSetup(false);
    // User should now be authenticated, redirect to dashboard
    setTimeout(() => {
      navigate('/dashboard?subscription=active&welcome=true');
    }, 500);
  };

  const benefits = [
    "Campanhas ilimitadas no Meta Ads",
    "IA avançada para otimização automática", 
    "Análises detalhadas e relatórios",
    "Suporte prioritário via WhatsApp",
    "Templates profissionais de campanhas",
    "Treinamentos exclusivos"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camply-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-camply-yellow rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-camply-blue" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Pagamento Confirmado!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              {isGuestCheckout ? (
                <>
                  Parabéns, <strong>{guestName}</strong>! Seu pagamento foi processado com sucesso.
                  <br />
                  Você receberá um email em <strong>{guestEmail}</strong> para criar sua senha e acessar sua conta Premium.
                </>
              ) : (
                <>
                  Parabéns, {user?.name || 'Usuário'}! Sua assinatura do <strong>Camply Premium</strong> foi ativada com sucesso.
                </>
              )}
            </p>
          </div>

          {/* Subscription Status */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8 border border-green-200">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-green-600 mr-3" />
              <span className="text-lg font-semibold text-gray-900">
                Camply Premium Ativo
              </span>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Próxima cobrança: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* What's Included */}
          <div className="text-left mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Agora você tem acesso completo a:
            </h3>
            <div className="grid gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Confirmation */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-200">
            <p className="text-sm text-blue-800">
              {isGuestCheckout ? (
                <>
                  📧 Enviamos um email para <strong>{guestEmail}</strong> com as instruções para configurar sua senha e acessar sua conta Premium.
                </>
              ) : (
                <>
                  📧 Enviamos um email de confirmação para <strong>{user?.email || 'seu email'}</strong> com os detalhes da sua assinatura.
                </>
              )}
            </p>
          </div>

          {/* Guest checkout special message */}
          {isGuestCheckout && (
            <div className="bg-amber-50 rounded-xl p-4 mb-8 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Importante:</strong> Configure sua senha nos próximos 24 horas para não perder o acesso à sua conta Premium.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {isGuestCheckout ? (
              <div className="text-center">
                <Button 
                  onClick={() => navigate('/auth/login')}
                  className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
                >
                  <span>Fazer Login</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Você será redirecionado para a página de login. Após configurar sua senha pelo email, faça login para acessar sua conta Premium.
                </p>
              </div>
            ) : (
              <Button 
                onClick={handleGoToDashboard}
                className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
              >
                <span>Ir para o Dashboard</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Precisa de ajuda? Entre em contato conosco pelo WhatsApp: 
                <a href="https://wa.me/5511999999999" className="text-camply-blue hover:underline ml-1">
                  (11) 99999-9999
                </a>
              </p>
            </div>
          </div>

          {/* Session ID for reference */}
          {sessionId && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                ID da transação: {sessionId}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Setup Modal for New Users */}
      {showPasswordSetup && sessionId && (
        <PasswordSetupModal
          isOpen={showPasswordSetup}
          email={user?.email || undefined}
          sessionId={sessionId}
          onSuccess={handlePasswordSetupSuccess}
        />
      )}
    </div>
  );
};

export default CheckoutSuccess;