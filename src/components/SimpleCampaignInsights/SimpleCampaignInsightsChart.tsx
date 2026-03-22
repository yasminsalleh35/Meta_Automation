
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { DailyInsight } from '@/hooks/useSimpleCampaignInsights';

interface SimpleCampaignInsightsChartProps {
  dailyInsights: DailyInsight[];
}

export const SimpleCampaignInsightsChart: React.FC<SimpleCampaignInsightsChartProps> = ({
  dailyInsights
}) => {
  if (!dailyInsights || dailyInsights.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dados históricos não disponíveis
        </h3>
        <p className="text-gray-600">
          As métricas diárias aparecerão aqui após a campanha começar a receber impressões.
        </p>
      </div>
    );
  }

  // Format dates for display
  const chartData = dailyInsights.map(day => ({
    ...day,
    dateLabel: new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <CardTitle className="text-lg">Evolução do Desempenho (últimos 7 dias)</CardTitle>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions vs Clicks Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Impressões vs Cliques</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('pt-BR').format(value),
                  name === 'impressions' ? 'Impressões' : 'Cliques'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend formatter={(value) => value === 'impressions' ? 'Impressões' : 'Cliques'} />
              <Bar dataKey="impressions" fill="#3B82F6" name="impressions" />
              <Bar dataKey="clicks" fill="#10B981" name="clicks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CTR Line Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Taxa de Cliques (CTR)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'CTR']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="ctr"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spend Line Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Gasto Diário (R$)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                  'Gasto'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Conversations Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Conversas Iniciadas</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR').format(value),
                  'Conversas'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Bar dataKey="conversations" fill="#F59E0B" name="conversations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
