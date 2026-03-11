
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

const AdminAIMonitoring = () => {
  const stats = [
    { label: 'Uptime', value: '99.9%', color: 'text-green-600', icon: CheckCircle },
    { label: 'Latência Média', value: '245ms', color: 'text-blue-600', icon: Clock },
    { label: 'Req/min', value: '1,234', color: 'text-purple-600', icon: Zap },
    { label: 'Erros', value: '0.1%', color: 'text-red-600', icon: AlertTriangle }
  ];

  const services = [
    {
      name: 'OpenAI GPT-4',
      status: 'healthy',
      latency: '120ms',
      requests: '45,678',
      errors: '2',
      uptime: '99.95%'
    },
    {
      name: 'DALL-E 3',
      status: 'healthy',
      latency: '2.3s',
      requests: '12,345',
      errors: '0',
      uptime: '100%'
    },
    {
      name: 'Text Analytics',
      status: 'warning',
      latency: '850ms',
      requests: '23,456',
      errors: '12',
      uptime: '98.5%'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Saudável</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Atenção</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const recentAlerts = [
    {
      id: '1',
      service: 'Text Analytics',
      message: 'Latência acima do normal',
      severity: 'warning',
      timestamp: '2024-01-20 14:30'
    },
    {
      id: '2',
      service: 'OpenAI GPT-4',
      message: 'Pico de requisições detectado',
      severity: 'info',
      timestamp: '2024-01-20 13:15'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monitoramento IA</h1>
        <p className="text-gray-600 mt-2">
          Monitore o desempenho e saúde dos serviços de IA
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Status dos Serviços</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    {getStatusBadge(service.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>Latência: {service.latency}</div>
                    <div>Uptime: {service.uptime}</div>
                    <div>Requisições: {service.requests}</div>
                    <div>Erros: {service.errors}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Alertas Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-yellow-800">{alert.service}</h4>
                      <p className="text-yellow-700">{alert.message}</p>
                      <p className="text-sm text-yellow-600">{alert.timestamp}</p>
                    </div>
                    <Badge className="bg-yellow-500">
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAIMonitoring;
