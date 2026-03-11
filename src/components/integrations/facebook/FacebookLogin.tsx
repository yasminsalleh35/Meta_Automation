
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw, Loader2, Facebook } from 'lucide-react';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useMetaAdsCredentialValidator } from '@/hooks/useMetaAdsCredentialValidator';
import { useGlobalMetaConfig } from '@/hooks/useGlobalMetaConfig';

const FacebookLogin: React.FC = () => {
  const { existingIntegration, refreshIntegration, isTokenIncompatible } = useMetaAdsIntegration();
  const { validateCredentials, isLoading } = useMetaAdsCredentialValidator();
  const { config: globalConfig } = useGlobalMetaConfig();

  const isConnected = existingIntegration?.status === 'active' && !isTokenIncompatible;

  const handleConnect = async () => {
    try {
      if (!globalConfig?.appId || !globalConfig?.appSecret) {
        throw new Error('Configuração Meta não encontrada');
      }

      await validateCredentials(
        globalConfig.appId,
        globalConfig.appSecret,
        'required'
      );
      
      await refreshIntegration();
    } catch (error) {
      console.error('Erro na conexão:', error);
    }
  };

  const handleReconnect = async () => {
    await handleConnect();
  };

  if (isConnected) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Conectado com sucesso!</strong> Sua conta Meta está ativa.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status da Conexão</p>
                <p className="text-sm text-gray-600">Token de acesso válido</p>
              </div>
              <Badge className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Permissões concedidas:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">ads_management</Badge>
                <Badge variant="outline">pages_show_list</Badge>
                <Badge variant="outline">pages_read_engagement</Badge>
                <Badge variant="outline">instagram_basic</Badge>
                <Badge variant="outline">business_management</Badge>
                <Badge variant="outline">page</Badge>
                <Badge variant="outline">public_profile</Badge>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleReconnect}
              disabled={isLoading}
              className="mt-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reconectar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTokenIncompatible) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Token incompatível!</strong> É necessário reconectar sua conta Meta.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleReconnect}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reconectando...
            </>
          ) : (
            <>
              <Facebook className="w-4 h-4 mr-2" />
              Reconectar Meta
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Conecte sua conta Meta para acessar campanhas publicitárias. Serão solicitadas as seguintes permissões:
          <ul className="mt-2 ml-4 list-disc">
            <li><strong>ads_management</strong> - Gerenciar campanhas e contas de anúncios</li>
            <li><strong>pages_show_list</strong> - Listar e selecionar páginas do Facebook</li>
            <li><strong>pages_read_engagement</strong> - Acessar métricas das páginas</li>
            <li><strong>instagram_basic</strong> - Conectar contas do Instagram Business</li>
            <li><strong>business_management</strong> - Gerenciar Business Manager</li>
            <li><strong>page</strong> - Acesso básico às páginas</li>
            <li><strong>public_profile</strong> - Informações públicas do perfil</li>
          </ul>
        </AlertDescription>
      </Alert>

      <p className="text-sm text-gray-600 mb-4">
        Ao conectar sua conta Meta, você concorda com nossa{' '}
        <a
          href="https://iacamply.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          Política de Privacidade
        </a>{' '}
        e nossos{' '}
        <a
          href="https://iacamply.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          Termos de Serviço
        </a>.
      </p>

      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Facebook className="w-4 h-4 mr-2" />
            Conectar com Meta
          </>
        )}
      </Button>
    </div>
  );
};

export default FacebookLogin;
