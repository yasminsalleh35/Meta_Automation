
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Key, User, Building } from 'lucide-react';

interface GoogleAdsIntegrationProps {
  onConnectionChange: (connected: boolean) => void;
  isConnected: boolean;
}

export const GoogleAdsIntegration: React.FC<GoogleAdsIntegrationProps> = ({
  onConnectionChange,
  isConnected
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    developerToken: '',
    customerId: '',
    refreshToken: '',
    accessToken: ''
  });

  const [accounts, setAccounts] = useState([
    { id: '123-456-7890', name: 'Minha Empresa - Conta Principal', currency: 'BRL' },
    { id: '987-654-3210', name: 'Cliente ABC Ltda', currency: 'BRL' }
  ]);

  const [selectedAccount, setSelectedAccount] = useState('');
  const [step, setStep] = useState<'credentials' | 'oauth' | 'accounts' | 'connected'>('credentials');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConnect = () => {
    // Simulação do fluxo de conexão
    if (step === 'credentials') {
      setStep('oauth');
    } else if (step === 'oauth') {
      setStep('accounts');
    } else if (step === 'accounts' && selectedAccount) {
      setStep('connected');
      onConnectionChange(true);
    }
  };

  const handleDisconnect = () => {
    setStep('credentials');
    onConnectionChange(false);
    setFormData({
      clientId: '',
      clientSecret: '',
      developerToken: '',
      customerId: '',
      refreshToken: '',
      accessToken: ''
    });
  };

  if (isConnected && step === 'connected') {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Google Ads conectado com sucesso! Você pode agora criar e gerenciar campanhas.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Conta Conectada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border">
                <div>
                  <p className="font-medium">Minha Empresa - Conta Principal</p>
                  <p className="text-sm text-gray-600">ID: 123-456-7890</p>
                </div>
                <Badge className="bg-green-500">Ativa</Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Google Ads
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'credentials' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Credenciais da API
            </CardTitle>
            <CardDescription>
              Configure as credenciais da Google Ads API. 
              <a href="https://developers.google.com/google-ads/api/docs/first-call/overview" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                Saiba como obter suas credenciais
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  placeholder="Ex: 1234567890-abc123.apps.googleusercontent.com"
                  value={formData.clientId}
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Seu client secret"
                  value={formData.clientSecret}
                  onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="developerToken">Developer Token *</Label>
              <Input
                id="developerToken"
                placeholder="Seu token de desenvolvedor do Google Ads"
                value={formData.developerToken}
                onChange={(e) => handleInputChange('developerToken', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Obtido no Google Ads Manager {'->'} Ferramentas {'->'} Configuração {'->'} API Center
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Essas informações são confidenciais e serão armazenadas de forma segura.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleConnect}
              disabled={!formData.clientId || !formData.clientSecret || !formData.developerToken}
              className="w-full"
            >
              Continuar para Autenticação
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'oauth' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Autenticação OAuth
            </CardTitle>
            <CardDescription>
              Autorize o Camply a acessar sua conta do Google Ads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ExternalLink className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Redirecionamento para Google</h3>
              <p className="text-gray-600 mb-6">
                Você será redirecionado para a página de autorização do Google. 
                Após autorizar, volte para esta página.
              </p>
              
              <Button onClick={handleConnect} className="mb-4">
                Autorizar com Google
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="authCode">Código de Autorização</Label>
                <Input
                  id="authCode"
                  placeholder="Cole aqui o código recebido após autorização"
                />
                <p className="text-xs text-gray-500">
                  Após autorizar, você receberá um código. Cole-o acima.
                </p>
              </div>
            </div>
            
            <Button onClick={handleConnect} className="w-full">
              Validar Autorização
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'accounts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Selecionar Conta
            </CardTitle>
            <CardDescription>
              Escolha a conta do Google Ads que deseja conectar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {accounts.map((account) => (
                <div 
                  key={account.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccount === account.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{account.name}</h4>
                      <p className="text-sm text-gray-600">ID: {account.id}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{account.currency}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleConnect}
              disabled={!selectedAccount}
              className="w-full"
            >
              Conectar Conta Selecionada
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
