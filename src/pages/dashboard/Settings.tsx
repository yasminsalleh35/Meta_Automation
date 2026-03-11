
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Globe
} from 'lucide-react';
import LanguageSelector from '@/components/settings/LanguageSelector';
import DemoModeToggle from '@/components/demo/DemoModeToggle';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { ProfileSection } from '@/components/settings/ProfileSection';

import { SecuritySection } from '@/components/settings/SecuritySection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';

const Settings = () => {
  const { t } = useI18n();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    autoOptimization: true,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleSave = () => {
    toast({
      title: "Configurações Salvas",
      description: "Suas configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-3xl font-bold text-gray-900">{t('sidebar.settings')}</h1>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecuritySection />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default Settings;
