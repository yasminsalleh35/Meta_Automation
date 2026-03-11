
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { CustomerPortalButton } from './CustomerPortalButton';
import { AuthUser } from '@/contexts/AuthContext';
import { Plan } from '@/types/subscription';

interface PaymentInfoProps {
  user: AuthUser | null;
  currentPlan: Plan;
  onManageSubscription: () => Promise<void>;
}

export function PaymentInfo({ user, currentPlan, onManageSubscription }: PaymentInfoProps) {
  const subscription = user?.subscription;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Em atraso</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Informações de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status da Assinatura:</span>
              {getStatusBadge(subscription.active ? 'active' : 'canceled')}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plano Atual:</span>
              <span className="font-medium">{currentPlan.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Valor Mensal:</span>
              <span className="font-medium">R$ {currentPlan.price.toFixed(2)}</span>
            </div>
            
            {subscription.subscriptionEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Próxima Cobrança:
                </span>
                <span className="font-medium">
                  {new Date(subscription.subscriptionEnd).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <CustomerPortalButton className="w-full" />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Gerencie seu método de pagamento, histórico de faturas e cancele sua assinatura no portal seguro do Stripe.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhuma assinatura ativa encontrada.</p>
            <CustomerPortalButton />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
