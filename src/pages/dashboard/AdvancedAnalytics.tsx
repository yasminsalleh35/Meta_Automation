
import React from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';

const AdvancedAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Análise Avançada</h1>
      </div>
      <AdvancedAnalyticsDashboard />
    </div>
  );
};

export default AdvancedAnalytics;
