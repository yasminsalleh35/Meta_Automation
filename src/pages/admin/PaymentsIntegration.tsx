// =============================================
// Admin página unificada para pagamentos (Pagar.me-only)
// Substitui /admin/integrations/stripe
// =============================================

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, PiggyBank, AlertTriangle } from 'lucide-react';
import PagarmeAdminConfig from '@/components/admin/PagarmeAdminConfig';
import StripeAdminConfig from '@/components/admin/StripeAdminConfig';

const PaymentsIntegration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <PiggyBank className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração Pagar.me</h1>
          <p className="text-gray-600">Configure o Pagar.me para processar pagamentos, assinaturas e PIX</p>
        </div>
      </div>

      {/* Configuração Pagar.me */}
      <PagarmeAdminConfig />
    </div>
  );
};

export default PaymentsIntegration;