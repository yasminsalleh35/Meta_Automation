
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Map,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Activity,
  Globe,
  Zap
} from 'lucide-react';
import { useMapbox } from '@/contexts/MapboxContext';

const MapboxSettings = () => {
  const { toast } = useToast();
  const { mapboxToken, setMapboxToken, isTokenAvailable } = useMapbox();
  const [showToken, setShowToken] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isTestingToken, setIsTestingToken] = useState(false);

  // Sincronizar tempToken com mapboxToken do contexto
  useEffect(() => {
    if (mapboxToken) {
      setTempToken(mapboxToken);
      validateToken(mapboxToken);
    }
  }, [mapboxToken]);

  const validateToken = (token: string) => {
    const isValid = token.startsWith('pk.') && token.length > 20;
    setIsValidToken(isValid);
    return isValid;
  };

  const handleTokenChange = (value: string) => {
    setTempToken(value);
    if (value) {
      validateToken(value);
    } else {
      setIsValidToken(null);
    }
  };

  const handleSaveToken = () => {
    if (!tempToken) {
      toast({
        title: "Token obrigatório",
        description: "Por favor, insira um token do Mapbox válido.",
        variant: "destructive"
      });
      return;
    }

    if (!validateToken(tempToken)) {
      toast({
        title: "Token inválido",
        description: "O token deve começar com 'pk.' e ter mais de 20 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setMapboxToken(tempToken);
    
    toast({
      title: "Token salvo com sucesso!",
      description: "O token do Mapbox foi configurado e está pronto para uso.",
    });
  };

  const handleTestToken = async () => {
    if (!tempToken || !validateToken(tempToken)) {
      toast({
        title: "Token inválido",
        description: "Insira um token válido antes de testar.",
        variant: "destructive"
      });
      return;
    }

    setIsTestingToken(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${tempToken}`
      );
      
      if (response.ok) {
        toast({
          title: "✅ Token válido!",
          description: "Conexão com Mapbox estabelecida com sucesso.",
        });
      } else {
        toast({
          title: "❌ Token inválido",
          description: "O token não foi aceito pela API do Mapbox.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com a API do Mapbox.",
        variant: "destructive"
      });
    } finally {
      setIsTestingToken(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-900 to-emerald-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-800/20 to-emerald-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Map className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Configurações Mapbox
                </h1>
                <p className="text-green-100 text-lg">Configure e gerencie a integração com mapas</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {isTokenAvailable ? '🟢 Ativo' : '🔴 Inativo'}
            </div>
            <div className="text-green-100 text-sm">Status da Integração</div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${isTokenAvailable ? 'bg-green-100' : 'bg-red-100'}`}>
                <Activity className={`w-6 h-6 ${isTokenAvailable ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {isTokenAvailable ? 'Conectado' : 'Desconectado'}
                </div>
                <div className="text-sm text-gray-500">Status da API</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Global</div>
                <div className="text-sm text-gray-500">Cobertura Mundial</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">50k/mês</div>
                <div className="text-sm text-gray-500">Limite Gratuito</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Configuration */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Map className="w-6 h-6 mr-3 text-green-600" />
            Token de Acesso
          </CardTitle>
          <CardDescription className="text-lg">
            Configure seu token público do Mapbox para habilitar funcionalidades de mapa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Informações importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use apenas tokens públicos (começam com "pk.")</li>
                  <li>O token é compartilhado globalmente no sistema</li>
                  <li>Monitore o uso para não exceder limites gratuitos</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token" className="text-base font-medium">Token Público do Mapbox</Label>
              <div className="relative">
                <Input
                  id="mapbox-token"
                  type={showToken ? "text" : "password"}
                  value={tempToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV..."
                  className={`h-12 border-0 shadow-md focus:shadow-lg transition-shadow pr-12 ${
                    isValidToken === true ? 'border-green-500' : 
                    isValidToken === false ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-0 top-0 h-full flex items-center space-x-2 pr-3">
                  {isValidToken === true && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {isValidToken === false && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                    className="h-8 w-8 p-0"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {isValidToken === false && (
                <p className="text-sm text-red-600">Token deve começar com 'pk.' e ter mais de 20 caracteres</p>
              )}
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Não tem uma conta?</span>
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 font-medium inline-flex items-center"
              >
                Criar conta gratuita
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={handleTestToken}
              disabled={!tempToken || isValidToken === false || isTestingToken}
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isTestingToken ? 'Testando...' : 'Testar Token'}
            </Button>
            
            <Button 
              onClick={handleSaveToken}
              disabled={!tempToken || isValidToken === false}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 py-3"
            >
              <Save className="w-5 h-5 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Recursos Disponíveis
          </CardTitle>
          <CardDescription>
            Funcionalidades habilitadas com a integração Mapbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">✅ Funcionalidades Ativas</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Mapas interativos em campanhas</li>
                <li>• Geocodificação de endereços</li>
                <li>• Visualização de raio de alcance</li>
                <li>• Marcadores personalizados</li>
                <li>• Busca de localizações</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">📊 Estatísticas de Uso</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Requisições hoje:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Requisições este mês:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Limite mensal:</span>
                  <span className="font-medium text-green-600">50,000</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapboxSettings;
