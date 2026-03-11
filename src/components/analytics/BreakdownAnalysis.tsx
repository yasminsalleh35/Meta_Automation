
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Smartphone, Monitor, Tablet, ArrowUpDown } from 'lucide-react';
import { useBreakdownAnalysis } from '@/hooks/analytics/useBreakdownAnalysis';

interface BreakdownAnalysisProps {
  campaignIds: string[];
  dateRange: { from: Date; to: Date };
}

export const BreakdownAnalysis: React.FC<BreakdownAnalysisProps> = ({ campaignIds, dateRange }) => {
  const { data, isLoading } = useBreakdownAnalysis(campaignIds, dateRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">Selecione campanhas para ver as análises detalhadas</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  const formatPercentage = (value: number) => 
    `${value.toFixed(2)}%`;

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Comparação Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação com Período Anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.timeComparison.currentPeriod.spend)}
              </div>
              <div className="text-sm text-gray-500 mb-2">Investimento</div>
              <div className={`flex items-center justify-center space-x-1 ${getTrendColor(data.timeComparison.changes.spend)}`}>
                {getTrendIcon(data.timeComparison.changes.spend)}
                <span className="text-sm font-medium">
                  {Math.abs(data.timeComparison.changes.spend).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.timeComparison.currentPeriod.impressions)}
              </div>
              <div className="text-sm text-gray-500 mb-2">Impressões</div>
              <div className={`flex items-center justify-center space-x-1 ${getTrendColor(data.timeComparison.changes.impressions)}`}>
                {getTrendIcon(data.timeComparison.changes.impressions)}
                <span className="text-sm font-medium">
                  {Math.abs(data.timeComparison.changes.impressions).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.timeComparison.currentPeriod.clicks)}
              </div>
              <div className="text-sm text-gray-500 mb-2">Cliques</div>
              <div className={`flex items-center justify-center space-x-1 ${getTrendColor(data.timeComparison.changes.clicks)}`}>
                {getTrendIcon(data.timeComparison.changes.clicks)}
                <span className="text-sm font-medium">
                  {Math.abs(data.timeComparison.changes.clicks).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.timeComparison.currentPeriod.conversions)}
              </div>
              <div className="text-sm text-gray-500 mb-2">Conversões</div>
              <div className={`flex items-center justify-center space-x-1 ${getTrendColor(data.timeComparison.changes.conversions)}`}>
                {getTrendIcon(data.timeComparison.changes.conversions)}
                <span className="text-sm font-medium">
                  {Math.abs(data.timeComparison.changes.conversions).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.timeComparison.currentPeriod.ctr)}
              </div>
              <div className="text-sm text-gray-500 mb-2">CTR</div>
              <div className={`flex items-center justify-center space-x-1 ${getTrendColor(data.timeComparison.changes.ctr)}`}>
                {getTrendIcon(data.timeComparison.changes.ctr)}
                <span className="text-sm font-medium">
                  {Math.abs(data.timeComparison.changes.ctr).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.timeComparison.currentPeriod.cpc)}
              </div>
              <div className="text-sm text-gray-500 mb-2">CPC</div>
              <div className={`flex items-center justify-center space-x-1 ${getTrendColor(-data.timeComparison.changes.cpc)}`}>
                {getTrendIcon(-data.timeComparison.changes.cpc)}
                <span className="text-sm font-medium">
                  {Math.abs(data.timeComparison.changes.cpc).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdowns Detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Segmentação</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="device" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="device">Dispositivo</TabsTrigger>
              <TabsTrigger value="platform">Plataforma</TabsTrigger>
              <TabsTrigger value="placement">Posicionamento</TabsTrigger>
            </TabsList>
            
            <TabsContent value="device" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, percentage }) => `${device} ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="spend"
                      >
                        {data.deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Investimento']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {data.deviceBreakdown.map((item, index) => (
                    <div key={item.device} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}>
                          {item.device === 'Mobile' && <Smartphone className="w-4 h-4 text-white" />}
                          {item.device === 'Desktop' && <Monitor className="w-4 h-4 text-white" />}
                          {item.device === 'Tablet' && <Tablet className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.device}</div>
                          <div className="text-sm text-gray-500">
                            {formatPercentage(item.ctr)} CTR • {formatCurrency(item.cpc)} CPC
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(item.spend)}</div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(item.conversions)} conversões
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="platform" className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.platformBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="platform" className="text-sm text-gray-600" />
                    <YAxis className="text-sm text-gray-600" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'spend') return [formatCurrency(value), 'Investimento'];
                        if (name === 'clicks') return [formatNumber(value), 'Cliques'];
                        if (name === 'conversions') return [formatNumber(value), 'Conversões'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="spend" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="placement" className="space-y-4">
              <div className="space-y-3">
                {data.placementBreakdown.map((item, index) => (
                  <div key={item.placement} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-8 bg-gradient-to-b from-camply-blue to-camply-green rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{item.placement}</div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage(item.percentage)} do total • {formatPercentage(item.ctr)} CTR
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(item.spend)}</div>
                      <div className="text-sm text-gray-500">
                        {formatNumber(item.clicks)} cliques • {formatNumber(item.conversions)} conversões
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
