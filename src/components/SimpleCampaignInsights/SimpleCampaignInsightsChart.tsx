
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface Insights {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  reach: number;
  leads: number;
  cpl: number;
}

interface SimpleCampaignInsightsChartProps {
  insights: Insights | null;
}

export const SimpleCampaignInsightsChart: React.FC<SimpleCampaignInsightsChartProps> = ({
  insights
}) => {
  // Dados simulados para o gráfico (em uma implementação real, viriam da API com dados históricos)
  const chartData = insights ? [
    { name: 'Dia 1', impressions: Math.round(insights.impressions * 0.1), clicks: Math.round(insights.clicks * 0.1), ctr: insights.ctr * 0.8 },
    { name: 'Dia 2', impressions: Math.round(insights.impressions * 0.25), clicks: Math.round(insights.clicks * 0.23), ctr: insights.ctr * 0.9 },
    { name: 'Dia 3', impressions: Math.round(insights.impressions * 0.45), clicks: Math.round(insights.clicks * 0.42), ctr: insights.ctr * 0.95 },
    { name: 'Dia 4', impressions: Math.round(insights.impressions * 0.7), clicks: Math.round(insights.clicks * 0.68), ctr: insights.ctr * 1.0 },
    { name: 'Dia 5', impressions: Math.round(insights.impressions * 0.85), clicks: Math.round(insights.clicks * 0.82), ctr: insights.ctr * 0.98 },
    { name: 'Hoje', impressions: insights.impressions, clicks: insights.clicks, ctr: insights.ctr }
  ] : [];

  if (!insights) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dados não disponíveis
        </h3>
        <p className="text-gray-600">
          Aguarde enquanto coletamos os dados de desempenho da sua campanha.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <CardTitle className="text-lg">Evolução do Desempenho</CardTitle>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Impressões e Cliques */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Impressões vs Cliques</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  new Intl.NumberFormat('pt-BR').format(value as number),
                  name === 'impressions' ? 'Impressões' : 'Cliques'
                ]}
              />
              <Bar dataKey="impressions" fill="#3B82F6" name="impressions" />
              <Bar dataKey="clicks" fill="#10B981" name="clicks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de CTR */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Taxa de Cliques (CTR)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${(value as number).toFixed(2)}%`, 'CTR']}
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
      </div>
    </div>
  );
};
