import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChartData {
  date: string;
  impressions: number;
  clicks: number;
  reach: number;
  spend: number;
  ctr: number;
}

interface MetricsChartsProps {
  data: ChartData[];
  isLoading?: boolean;
}

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6'
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare pie chart data for distribution
  const distributionData = data.length > 0 ? [
    { name: 'Impressões', value: data.reduce((sum, item) => sum + item.impressions, 0), color: colors.primary },
    { name: 'Alcance', value: data.reduce((sum, item) => sum + item.reach, 0), color: colors.secondary },
    { name: 'Cliques', value: data.reduce((sum, item) => sum + item.clicks, 0), color: colors.accent }
  ] : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse bg-muted h-6 w-32 rounded" />
            </CardHeader>
            <CardContent>
              <div className="animate-pulse bg-muted h-64 w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Impressões e Alcance */}
      <Card>
        <CardHeader>
          <CardTitle>Impressões e Alcance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatNumber(value), 
                  name === 'impressions' ? 'Impressões' : 'Alcance'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="impressions" 
                stroke={colors.primary} 
                strokeWidth={2}
                name="impressions"
              />
              <Line 
                type="monotone" 
                dataKey="reach" 
                stroke={colors.secondary} 
                strokeWidth={2}
                name="reach"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cliques e CTR */}
      <Card>
        <CardHeader>
          <CardTitle>Cliques e CTR</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" tickFormatter={formatNumber} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatPercentage} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'clicks') {
                    return [formatNumber(value), 'Cliques'];
                  }
                  return [formatPercentage(value), 'CTR'];
                }}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar 
                yAxisId="left"
                dataKey="clicks" 
                fill={colors.accent}
                name="clicks"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ctr" 
                stroke={colors.purple} 
                strokeWidth={2}
                name="ctr"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Valor Gasto */}
      <Card>
        <CardHeader>
          <CardTitle>Investimento por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor Gasto']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar 
                dataKey="spend" 
                fill={colors.danger}
                name="spend"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatNumber(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};