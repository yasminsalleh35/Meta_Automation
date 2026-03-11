import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Leads: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600 mt-2">
          Gerencie os leads capturados pelo quiz de avaliação
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mini-CRM em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            O sistema completo de gerenciamento de leads será implementado na próxima fase.
            Por enquanto, os dados dos leads são armazenados na tabela "leads" do Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leads;