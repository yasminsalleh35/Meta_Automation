
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Facebook, Key, Building, Users } from 'lucide-react';
import FacebookLogin from '@/components/integrations/facebook/FacebookLogin';
import FacebookAdAccountSelection from '@/components/integrations/facebook/FacebookAdAccountSelection';
import FacebookAssetsSelection from '@/components/integrations/facebook/FacebookAssetsSelection';

const FacebookIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Facebook className="h-8 w-8 text-blue-600" />
          Integração Facebook
        </h1>
        <p className="text-gray-600">Gerencie sua conexão com Meta Ads de forma modular</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="login" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Login Meta
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Conta de Anúncio
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Seleção de Ativos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Autenticação Meta
              </CardTitle>
              <CardDescription>
                Conecte sua conta Meta para acessar campanhas publicitárias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacebookLogin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Seleção de Conta de Anúncio
              </CardTitle>
              <CardDescription>
                Escolha a conta de anúncios principal para suas campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacebookAdAccountSelection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Páginas e Instagram
              </CardTitle>
              <CardDescription>
                Gerencie suas páginas do Facebook e contas do Instagram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacebookAssetsSelection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacebookIntegration;
