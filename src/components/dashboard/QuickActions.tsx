
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      title: 'Nova Campanha',
      description: 'Criar campanha Meta Ads',
      action: () => navigate('/dashboard/create-campaign'),
      color: 'bg-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'Análises',
      description: 'Ver performance das campanhas',
      action: () => navigate('/dashboard/campaigns'),
      color: 'bg-green-500'
    },
    {
      icon: Users,
      title: 'Audiências',
      description: 'Gerenciar públicos-alvo',
      action: () => navigate('/dashboard/settings'),
      color: 'bg-purple-500'
    },
    {
      icon: Settings,
      title: 'Configurações',
      description: 'Ajustar conta e integrações',
      action: () => navigate('/dashboard/settings'),
      color: 'bg-gray-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>
          Acesse as principais funcionalidades rapidamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={action.action}
            >
              <div className={`p-2 rounded-full ${action.color}`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
