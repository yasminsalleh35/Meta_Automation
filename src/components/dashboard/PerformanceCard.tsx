import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FunnelFlow from '@/components/analytics/FunnelFlow';
import MonthlySpendCard from '@/components/analytics/MonthlySpendCard';
import type { FunnelInput } from '@/types/metrics';

interface PerformanceCardProps {
  funnelData: FunnelInput;
  monthlySpendItems: Array<{
    label: string;
    value: number;
    visible: boolean;
  }>;
  isLoading?: boolean;
  datePreset?: 'today' | 'last_7d' | 'last_30d';
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ 
  funnelData, 
  monthlySpendItems, 
  isLoading = false,
  datePreset = 'last_30d'
}) => {
  const periodLabel = datePreset === 'today' 
    ? 'Hoje' 
    : datePreset === 'last_7d' 
    ? 'Últimos 7 dias' 
    : 'Últimos 30 dias';

  if (isLoading) {
    return (
      <Card className="w-full min-h-[400px] sm:min-h-[500px] lg:h-[500px]">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Carregando performance...</CardTitle>
        </CardHeader>
        <CardContent className="p-0 min-h-[350px]">
          <div className="w-full h-[340px] bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full min-h-[400px] sm:min-h-[500px] lg:h-[500px] relative isolate overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Performance - {periodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 min-h-[350px] sm:min-h-[400px] lg:h-[calc(100%-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-h-[350px] sm:min-h-[400px] lg:h-full p-4 sm:p-6 pt-0 relative">
          <div className="lg:col-span-2 min-h-[320px] sm:min-h-[380px] lg:h-full relative z-10">
            <FunnelFlow data={funnelData} height={340} />
          </div>
          <div className="lg:col-span-1 min-h-[320px] sm:min-h-[380px] lg:h-full relative z-10">
            <MonthlySpendCard 
              items={monthlySpendItems}
              height={340}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};