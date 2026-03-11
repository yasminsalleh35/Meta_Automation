
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, Shield, Bell } from 'lucide-react';

const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações Admin</h1>
        <p className="text-gray-600">Gerencie configurações globais do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Sistema</span>
            </CardTitle>
            <CardDescription>
              Configurações gerais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Modo Manutenção</p>
                <p className="text-sm text-gray-500">Ativar modo de manutenção</p>
              </div>
              <Button variant="outline" size="sm">
                Desabilitado
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Registros de Sistema</p>
                <p className="text-sm text-gray-500">Visualizar logs do sistema</p>
              </div>
              <Button variant="outline" size="sm">
                Ver Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Segurança</span>
            </CardTitle>
            <CardDescription>
              Configurações de segurança e acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">2FA Obrigatório</p>
                <p className="text-sm text-gray-500">Exigir autenticação de dois fatores</p>
              </div>
              <Button variant="outline" size="sm">
                Desabilitado
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Tentativas de Login</p>
                <p className="text-sm text-gray-500">Máximo de tentativas por hora</p>
              </div>
              <Button variant="outline" size="sm">
                5 tentativas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </CardTitle>
            <CardDescription>
              Configurações de notificações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Email Alertas</p>
                <p className="text-sm text-gray-500">Alertas por email para admins</p>
              </div>
              <Button variant="outline" size="sm">
                Habilitado
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Webhooks</p>
                <p className="text-sm text-gray-500">Configurar webhooks externos</p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Backup & Dados</span>
            </CardTitle>
            <CardDescription>
              Gerenciamento de backup e dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Backup Automático</p>
                <p className="text-sm text-gray-500">Backup diário dos dados</p>
              </div>
              <Button variant="outline" size="sm">
                Habilitado
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Exportar Dados</p>
                <p className="text-sm text-gray-500">Exportar dados do sistema</p>
              </div>
              <Button variant="outline" size="sm">
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Informações técnicas e estatísticas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">99.9%</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">1.2s</p>
              <p className="text-sm text-gray-600">Tempo Resposta</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">v2.1.0</p>
              <p className="text-sm text-gray-600">Versão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
