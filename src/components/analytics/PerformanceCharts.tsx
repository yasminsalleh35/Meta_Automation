
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ChartData {
  timeSeriesData: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  campaignComparison: Array<{
    name: string;
    spend: number;
    ctr: number;
    cpc: number;
  }>;
  platformDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface PerformanceChartsProps {
  data?: ChartData;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
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

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div className="space-y-6">
      {/* Gráfico de Tendências Temporais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Tendências de Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="date" 
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  className="text-sm text-gray-600"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'spend') return [formatCurrency(value), 'Investimento'];
                    if (name === 'impressions') return [formatNumber(value), 'Impressões'];
                    if (name === 'clicks') return [formatNumber(value), 'Cliques'];
                    if (name === 'conversions') return [formatNumber(value), 'Conversões'];
                    return [value, name];
                  }}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grade de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparação de Campanhas */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.campaignComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm text-gray-600"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis className="text-sm text-gray-600" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'spend') return [formatCurrency(value), 'Investimento'];
                      if (name === 'ctr') return [`${value.toFixed(2)}%`, 'CTR'];
                      if (name === 'cpc') return [formatCurrency(value), 'CPC'];
                      return [value, name];
                    }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="spend" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.platformDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Investimento']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
