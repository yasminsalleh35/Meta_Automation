import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  campaignAlerts: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
}

// audit LGL-04: marketing começa DESLIGADO (opt-in); as demais chaves vão para
// profiles.notification_preferences e marketing para profiles.marketing_emails_opt_in
// (marketing_consent_at é gravado por trigger no banco).
const DEFAULT_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
  campaignAlerts: true,
  weeklyReports: true,
  systemUpdates: true
};

const PREFERENCE_KEYS = ['emailNotifications', 'pushNotifications', 'campaignAlerts', 'weeklyReports', 'systemUpdates'] as const;

export const NotificationsSection: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('marketing_emails_opt_in, marketing_consent_at, notification_preferences')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error('Error loading notification preferences:', error);
      } else if (data) {
        const row = data;
        const rawPrefs = row.notification_preferences;
        const prefs: Record<string, unknown> =
          rawPrefs && typeof rawPrefs === 'object' && !Array.isArray(rawPrefs) ? rawPrefs : {};
        const next: NotificationSettings = { ...DEFAULT_SETTINGS, marketingEmails: row.marketing_emails_opt_in === true };
        for (const key of PREFERENCE_KEYS) {
          const value = prefs[key];
          if (typeof value === 'boolean') next[key] = value;
        }
        setSettings(next);
        setConsentAt(row.marketing_consent_at ?? null);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const notificationPreferences: Record<string, boolean> = {};
    for (const key of PREFERENCE_KEYS) notificationPreferences[key] = settings[key];

    const { data, error } = await supabase
      .from('profiles')
      .update({
        marketing_emails_opt_in: settings.marketingEmails,
        notification_preferences: notificationPreferences,
      })
      .eq('id', user.id)
      .select('marketing_consent_at')
      .maybeSingle();

    if (error || !data) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar suas preferências. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      setConsentAt(data.marketing_consent_at ?? null);
      toast({
        title: 'Sucesso',
        description: 'Preferências de notificação salvas com sucesso.',
      });
    }
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
          description="Receba dicas e novidades sobre marketing digital (opcional, você pode cancelar quando quiser)"
          checked={settings.marketingEmails}
          onChange={(checked) => handleToggle('marketingEmails')}
        />
        {settings.marketingEmails && consentAt && (
          <p className="text-xs text-muted-foreground">
            Consentimento registrado em {new Date(consentAt).toLocaleString('pt-BR')}.
          </p>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving || loading}>
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