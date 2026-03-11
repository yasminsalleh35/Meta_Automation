import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { Separator } from '@/components/ui/separator';

export const BillingSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status da Assinatura
          </CardTitle>
          <CardDescription>
            Veja o status atual da sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionStatus />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>
            Escolha o plano que melhor se adequa às suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionPlans />
        </CardContent>
      </Card>
    </div>
  );
};