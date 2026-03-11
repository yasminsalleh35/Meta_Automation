import React from 'react';
import FunnelFlow from '@/components/analytics/FunnelFlow';
import type { FunnelInput } from '@/types/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelChartProps {
  data: FunnelInput;
  isLoading?: boolean;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="w-full flex flex-col h-[300px]">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Performance dos últimos 90 dias</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col h-[300px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Performance dos últimos 90 dias</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <FunnelFlow data={data} height={240} />
      </CardContent>
    </Card>
  );
};