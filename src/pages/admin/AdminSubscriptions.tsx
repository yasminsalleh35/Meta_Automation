
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useRealAdminData } from '@/hooks/useRealAdminData';

const AdminSubscriptions: React.FC = () => {
  const { users, stats, loading } = useRealAdminData();

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const activeSubscriptions = users.filter(u => u.plan !== 'basic' && u.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
        <p className="text-gray-600">Gerencie assinaturas e receita</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Assinaturas Ativas</p>
                <p className="text-lg font-semibold">{stats?.activeSubscriptions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-lg font-semibold">
                  R$ {stats?.monthlyRevenue?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">ARPU</p>
                <p className="text-lg font-semibold">
                  R$ {stats?.avgRevenuePerUser?.toFixed(2) || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Taxa de Churn</p>
                <p className="text-lg font-semibold">{stats?.churnRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Ativas</CardTitle>
          <CardDescription>
            Usuários com planos pagos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSubscriptions.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Assinatura desde: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge className={
                      user.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      user.plan === 'premium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {user.plan}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      R$ {user.spending.toLocaleString('pt-BR')} gasto
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Ativo
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptions;
