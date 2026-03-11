import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, MessageCircle, Instagram, Globe } from 'lucide-react';

interface QuizThankYouProps {
  data: any;
}

export const QuizThankYou: React.FC<QuizThankYouProps> = ({ data }) => {
  const formatWhatsApp = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    // Format for WhatsApp link (remove country code if present)
    if (digits.startsWith('55') && digits.length === 13) {
      return digits.slice(2); // Remove 55 country code
    }
    return digits;
  };

  const whatsappNumber = "5533991119183"; // IA Camply WhatsApp
  const whatsappMessage = encodeURIComponent(
    `Olá! Acabei de preencher o quiz de avaliação para a clínica ${data.clinic_name}. Gostaria de saber mais sobre as estratégias personalizadas de marketing digital.`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Obrigado, {data.name?.split(' ')[0]}! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Suas respostas foram enviadas com sucesso
          </p>
        </div>

        {/* Main Message */}
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Próximos passos
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                ✅ <strong>Análise personalizada:</strong> Nossa equipe está analisando suas respostas para criar uma estratégia sob medida para a {data.clinic_name}.
              </p>
              <p>
                📋 <strong>Proposta detalhada:</strong> Em breve você receberá um plano completo de marketing digital adaptado ao seu orçamento e objetivos.
              </p>
              <p>
                🎯 <strong>Contato direto:</strong> Entraremos em contato via {data.preferred_channel === 'whatsapp' ? 'WhatsApp' : data.preferred_channel === 'phone' ? 'telefone' : 'e-mail'} no período da {data.best_contact_time?.toLowerCase()}.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* WhatsApp CTA */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Quer conversar agora?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Fale diretamente conosco pelo WhatsApp
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => window.open(whatsappLink, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Abrir WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Follow us */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <Instagram className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Siga nosso conteúdo
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Dicas diárias de marketing para dentistas
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-100"
                  onClick={() => window.open('https://instagram.com/iacamply', '_blank')}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  @iacamply
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-100"
                  onClick={() => window.open('https://iacamply.com/', '_blank')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  iacamply.com
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              O que acontece agora?
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Agora mesmo</p>
                  <p className="text-sm text-gray-600">Suas respostas foram registradas com segurança</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Próximas 24h</p>
                  <p className="text-sm text-gray-600">Nossa equipe fará a análise inicial do seu perfil</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Em até 48h</p>
                  <p className="text-sm text-gray-600">Você receberá nossa proposta personalizada</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            💡 <strong>Dica:</strong> Enquanto aguarda, que tal seguir nosso Instagram para ver cases de sucesso de outras clínicas?
          </p>
        </div>
      </div>
    </div>
  );
};