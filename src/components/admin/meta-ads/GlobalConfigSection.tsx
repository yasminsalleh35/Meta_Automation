
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertCircle, Eye, Loader2 } from 'lucide-react';

interface GlobalConfig {
  appId: string;
  appSecret: string;
  businessManagerId: string;
}

interface GlobalConfigSectionProps {
  globalConfig: GlobalConfig;
  setGlobalConfig: (config: GlobalConfig) => void;
  onSave: () => Promise<void>;
}

export const GlobalConfigSection: React.FC<GlobalConfigSectionProps> = ({
  globalConfig,
  setGlobalConfig,
  onSave
}) => {
  const [savingConfig, setSavingConfig] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);

  const handleSave = async () => {
    setSavingConfig(true);
    try {
      await onSave();
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="w-5 h-5 mr-2" />
          Configurações Globais do Meta App
        </CardTitle>
        <CardDescription>
          Configurações que serão usadas para todos os usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="globalAppId">App ID *</Label>
            <Input
              id="globalAppId"
              value={globalConfig.appId}
              onChange={(e) => setGlobalConfig({ ...globalConfig, appId: e.target.value })}
              placeholder="Ex: 1205142370824559"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="globalAppSecret">App Secret *</Label>
            <div className="relative">
              <Input
                id="globalAppSecret"
                type={showAppSecret ? "text" : "password"}
                value={globalConfig.appSecret}
                onChange={(e) => setGlobalConfig({ ...globalConfig, appSecret: e.target.value })}
                placeholder="Seu app secret"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowAppSecret(!showAppSecret)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="globalBusinessManagerId">Business Manager ID</Label>
            <Input
              id="globalBusinessManagerId"
              value={globalConfig.businessManagerId}
              onChange={(e) => setGlobalConfig({ ...globalConfig, businessManagerId: e.target.value })}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            {(!globalConfig.appId || !globalConfig.appSecret) && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configure o App ID e App Secret para habilitar as integrações.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Button 
            onClick={handleSave}
            disabled={savingConfig}
            className="ml-auto"
          >
            {savingConfig ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
