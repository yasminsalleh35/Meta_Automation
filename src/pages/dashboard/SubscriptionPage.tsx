
import React from 'react';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';

const SubscriptionPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-gray-600">Gerencie seu plano e faturamento</p>
      </div>

      <SubscriptionStatus />
      
      <div>
        <h2 className="text-xl font-semibold mb-6">Planos Disponíveis</h2>
        <SubscriptionPlans />
      </div>
    </div>
  );
};

export default SubscriptionPage;
