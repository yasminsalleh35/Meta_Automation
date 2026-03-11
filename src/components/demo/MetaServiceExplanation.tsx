
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface MetaServiceExplanationProps {
  children?: React.ReactNode;
  service?: string;
}

const MetaServiceExplanation: React.FC<MetaServiceExplanationProps> = ({ children, service }) => {
  const getServiceInfo = (serviceName?: string) => {
    switch (serviceName) {
      case 'ads_management':
        return {
          title: 'Sobre a Integração Meta Ads',
          description: 'Informações importantes sobre como funciona a integração',
          badges: ['Facebook Pages', 'Instagram Business', 'Ad Accounts']
        };
      case 'pages_show_list':
        return {
          title: 'Listagem de Páginas',
          description: 'Acesso às suas páginas do Facebook e Instagram',
          badges: ['Facebook Pages', 'Instagram Business']
        };
      case 'pages_read_engagement':
        return {
          title: 'Engajamento das Páginas',
          description: 'Leitura de métricas de engajamento das suas páginas',
          badges: ['Métricas', 'Engajamento', 'Analytics']
        };
      case 'whatsapp_business_management':
        return {
          title: 'WhatsApp Business',
          description: 'Gerenciamento de contas WhatsApp Business',
          badges: ['WhatsApp Business', 'Mensagens', 'Campanhas']
        };
      default:
        return {
          title: 'Sobre a Integração Meta Ads',
          description: 'Informações importantes sobre como funciona a integração',
          badges: ['Facebook Pages', 'Instagram Business', 'WhatsApp Business', 'Ad Accounts']
        };
    }
  };

  const serviceInfo = getServiceInfo(service);

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Info className="w-5 h-5" />
            <span>{serviceInfo.title}</span>
          </CardTitle>
          <CardDescription className="text-blue-700">
            {serviceInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Conexão Segura</h4>
                <p className="text-blue-800 text-sm">
                  Utilizamos OAuth 2.0 para conectar com sua conta Meta de forma segura
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Permissões Necessárias</h4>
                <p className="text-blue-800 text-sm">
                  Precisamos de acesso às suas contas de anúncios e páginas para criar campanhas
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Configuração Única</h4>
                <p className="text-blue-800 text-sm">
                  A configuração é feita apenas uma vez e permanece ativa
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-blue-200">
            <div className="flex flex-wrap gap-2">
              {serviceInfo.badges.map((badge, index) => (
                <Badge key={index} variant="outline" className="bg-white text-blue-800 border-blue-300">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {children}
    </div>
  );
};

export default MetaServiceExplanation;
