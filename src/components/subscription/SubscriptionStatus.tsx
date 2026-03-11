
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Calendar, CreditCard, RefreshCw, Settings } from 'lucide-react';

export const SubscriptionStatus: React.FC = () => {
  const { subscription, isLoading, checkSubscription, openCustomerPortal } = useSubscription();

  if (isLoading && !subscription) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Verificando assinatura...
        </CardContent>
      </Card>
    );
  }

  // Show admin access badge
  if (subscription?.subscription_tier === 'admin' || subscription?.is_admin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Status da Assinatura
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              👑 Administrador
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700">
              Você possui acesso completo à plataforma sem necessidade de assinatura.
            </p>
          </div>
          <Button onClick={checkSubscription} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Status da Assinatura
          </CardTitle>
          <CardDescription>
            Você não possui uma assinatura ativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="mb-4">Sem assinatura</Badge>
          <p className="text-sm text-gray-600 mb-4">
            Escolha um plano abaixo para começar a usar todos os recursos da plataforma.
          </p>
          <Button onClick={checkSubscription} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanName = (tier: string) => {
    switch (tier) {
      case 'basic': return 'Básico';
      case 'top': return 'Top';
      case 'premium': return 'Premium';
      default: return tier;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'top': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const providerBadge = subscription.provider === 'pagarme' 
    ? <Badge variant="outline" className="text-xs">Pagar.me</Badge>
    : subscription.provider === 'stripe'
    ? <Badge variant="outline" className="text-xs">Stripe</Badge>
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Status da Assinatura
          </div>
          <div className="flex items-center gap-2">
            {providerBadge}
            <Badge className={getPlanColor(subscription.subscription_tier || '')}>
              Plano {getPlanName(subscription.subscription_tier || '')}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Gerencie sua assinatura e faturamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge className="bg-green-100 text-green-800">Ativa</Badge>
        </div>

        {subscription.plan_name && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plano:</span>
            <span className="text-sm font-medium">{subscription.plan_name}</span>
          </div>
        )}
        
        {subscription.subscription_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Renovação:</span>
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(subscription.subscription_end)}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 pt-4">
          <Button onClick={checkSubscription} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={openCustomerPortal} size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Assinatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
