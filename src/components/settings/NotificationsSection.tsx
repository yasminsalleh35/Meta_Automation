import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  campaignAlerts: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
}

export const NotificationsSection: React.FC = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    campaignAlerts: true,
    weeklyReports: true,
    systemUpdates: true
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Sucesso',
      description: 'Preferências de notificação salvas com sucesso.',
    });
    setSaving(false);
  };

  const NotificationItem = ({ 
    id, 
    title, 
    description, 
    checked, 
    onChange 
  }: {
    id: keyof NotificationSettings;
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{title}</Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferências de Notificação
        </CardTitle>
        <CardDescription>
          Configure como você quer receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <NotificationItem
          id="emailNotifications"
          title="Notificações por Email"
          description="Receba atualizações importantes por email"
          checked={settings.emailNotifications}
          onChange={(checked) => handleToggle('emailNotifications')}
        />

        <Separator />

        <NotificationItem
          id="pushNotifications"
          title="Notificações Push"
          description="Receba notificações em tempo real no navegador"
          checked={settings.pushNotifications}
          onChange={(checked) => handleToggle('pushNotifications')}
        />

        <Separator />

        <NotificationItem
          id="campaignAlerts"
          title="Alertas de Campanha"
          description="Seja notificado sobre o desempenho das suas campanhas"
          checked={settings.campaignAlerts}
          onChange={(checked) => handleToggle('campaignAlerts')}
        />

        <Separator />

        <NotificationItem
          id="weeklyReports"
          title="Relatórios Semanais"
          description="Receba um resumo semanal das suas campanhas"
          checked={settings.weeklyReports}
          onChange={(checked) => handleToggle('weeklyReports')}
        />

        <Separator />

        <NotificationItem
          id="systemUpdates"
          title="Atualizações do Sistema"
          description="Seja informado sobre novas funcionalidades e atualizações"
          checked={settings.systemUpdates}
          onChange={(checked) => handleToggle('systemUpdates')}
        />

        <Separator />

        <NotificationItem
          id="marketingEmails"
          title="Emails de Marketing"
          description="Receba dicas e novidades sobre marketing digital"
          checked={settings.marketingEmails}
          onChange={(checked) => handleToggle('marketingEmails')}
        />

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Preferências'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};