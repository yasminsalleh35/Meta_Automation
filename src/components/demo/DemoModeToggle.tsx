
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, AlertTriangle } from 'lucide-react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useI18n } from '@/contexts/I18nContext';

const DemoModeToggle: React.FC = () => {
  const { isDemoMode, isLoading, toggleDemoMode, canControlDemoMode } = useDemoMode();
  const { t } = useI18n();

  if (!canControlDemoMode) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Video className="w-5 h-5 mr-2" />
          {t('settings.demo_mode')}
          {isDemoMode && (
            <Badge className="ml-2 bg-orange-500 text-white animate-pulse">
              ATIVO
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-orange-700">
          {t('settings.demo_mode.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={toggleDemoMode}
            disabled={isLoading}
          />
          <Label htmlFor="demo-mode" className="text-orange-800">
            {isDemoMode ? t('settings.demo_mode.disable') : t('settings.demo_mode.enable')}
          </Label>
        </div>

        {isDemoMode && (
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Modo Demo Ativo</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Legendas explicativas aparecem durante a integração Meta Ads</li>
                  <li>Ideal para gravação de tela para o Meta App Review</li>
                  <li>Visível apenas para super administradores</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DemoModeToggle;
