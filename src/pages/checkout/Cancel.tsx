import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft, ArrowRight, Clock, CreditCard } from 'lucide-react';

const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/onboarding/plan-selection');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard?trial=available');
  };

  const handleTryAgain = () => {
    navigate('/onboarding/plan-selection');
  };

  const reasons = [
    {
      icon: Clock,
      title: "Precisa de mais tempo?",
      description: "Experimente nosso trial gratuito de 14 dias",
      action: "Iniciar Trial Grátis"
    },
    {
      icon: CreditCard,
      title: "Problema com pagamento?",
      description: "Tente novamente ou use outro método de pagamento",
      action: "Tentar Novamente"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Cancel Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pagamento Cancelado
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Não se preocupe! Seu processo de pagamento foi cancelado e nenhuma cobrança foi realizada.
            </p>
          </div>

          {/* Information */}
          <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-200">
            <p className="text-gray-700 mb-4">
              <strong>O que aconteceu?</strong><br/>
              O pagamento foi cancelado durante o processo de checkout. Isso pode acontecer se:
            </p>
            <ul className="text-sm text-gray-600 text-left list-disc list-inside space-y-1">
              <li>Você fechou a janela de pagamento</li>
              <li>Houve um problema temporário com o processador</li>
              <li>Decidiu revisar as opções antes de finalizar</li>
            </ul>
          </div>

          {/* Options */}
          <div className="text-left mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              O que você gostaria de fazer?
            </h3>
            <div className="space-y-4">
              {reasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                     onClick={index === 0 ? handleGoToDashboard : handleTryAgain}>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <reason.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{reason.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{reason.description}</p>
                    <span className="text-xs text-orange-600 font-medium">{reason.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={handleTryAgain}
                className="h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
              >
                <span>Tentar Novamente</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button 
                onClick={handleGoToDashboard}
                variant="outline"
                className="h-12 border-2 border-camply-blue text-camply-blue hover:bg-camply-blue hover:text-white font-semibold text-base rounded-xl transition-all duration-200"
              >
                Iniciar Trial Grátis
              </Button>
            </div>

            <Button 
              onClick={handleGoBack}
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Planos
            </Button>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Precisa de ajuda? Entre em contato conosco pelo WhatsApp: 
              <a href="https://wa.me/5511999999999" className="text-camply-blue hover:underline ml-1">
                (11) 99999-9999
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutCancel;