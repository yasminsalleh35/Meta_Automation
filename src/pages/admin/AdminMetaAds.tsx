
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Facebook, Settings, Users, AlertCircle } from 'lucide-react';
import { useMetaAdsAdmin } from '@/hooks/useMetaAdsAdmin';

const AdminMetaAds: React.FC = () => {
  const {
    users,
    loading,
    globalConfig,
    setGlobalConfig,
    saveGlobalConfig,
    configureIntegration,
    disconnectIntegration
  } = useMetaAdsAdmin();

  const handleSaveConfig = async () => {
    try {
      await saveGlobalConfig();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Meta Ads</h1>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meta Ads</h1>
        <p className="text-gray-600">Configure e gerencie integrações com Meta Ads</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurações Globais</span>
          </CardTitle>
          <CardDescription>
            Configure as credenciais globais do Meta App que serão usadas por todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                value={globalConfig.appId}
                onChange={(e) => setGlobalConfig({...globalConfig, appId: e.target.value})}
                placeholder="Seu Meta App ID"
              />
            </div>
            <div>
              <Label htmlFor="appSecret">App Secret</Label>
              <Input
                id="appSecret"
                type="password"
                value={globalConfig.appSecret}
                onChange={(e) => setGlobalConfig({...globalConfig, appSecret: e.target.value})}
                placeholder="Seu Meta App Secret"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="businessManagerId">Business Manager ID (Opcional)</Label>
            <Input
              id="businessManagerId"
              value={globalConfig.businessManagerId}
              onChange={(e) => setGlobalConfig({...globalConfig, businessManagerId: e.target.value})}
              placeholder="ID do Business Manager"
            />
          </div>
          <Button onClick={handleSaveConfig}>
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Integrações dos Usuários</span>
          </CardTitle>
          <CardDescription>
            Gerencie as integrações Meta Ads de todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="mt-1">
                      {user.integration ? (
                        <Badge className="bg-green-100 text-green-800">
                          Conectado
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Não conectado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {user.integration ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectIntegration(user)}
                      >
                        Desconectar
                      </Button>
                      <div className="text-right text-xs text-gray-500">
                        <p>Ad Account: {user.integration.ad_account_id || 'N/A'}</p>
                        <p>Page: {user.integration.page_id || 'N/A'}</p>
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => configureIntegration(user)}
                    >
                      Configurar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Facebook className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600">
                Os usuários aparecerão aqui quando se cadastrarem no sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!globalConfig.appId && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                <strong>Atenção:</strong> Configure as credenciais globais do Meta App antes de permitir que os usuários conectem suas contas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMetaAds;
