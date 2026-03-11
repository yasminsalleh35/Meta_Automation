
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DemographicData {
  ageGroups: Array<{
    age: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  genderDistribution: Array<{
    gender: string;
    spend: number;
    percentage: number;
    color: string;
  }>;
  topLocations: Array<{
    location: string;
    spend: number;
    clicks: number;
    impressions: number;
  }>;
}

interface DemographicAnalysisProps {
  data?: DemographicData;
}

export const DemographicAnalysis: React.FC<DemographicAnalysisProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded"></div>
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
      {/* Análise por Idade */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ageGroups} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="age" 
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
                    if (name === 'ctr') return [`${value.toFixed(2)}%`, 'CTR'];
                    return [value, name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar yAxisId="left" dataKey="spend" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="ctr" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Análise por Gênero */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Gênero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ gender, percentage }) => `${gender} ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="spend"
                >
                  {data.genderDistribution.map((entry, index) => (
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

      {/* Top Localizações */}
      <Card>
        <CardHeader>
          <CardTitle>Top Localizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topLocations.map((location, index) => (
              <div key={location.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-camply-blue text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{location.location}</div>
                    <div className="text-sm text-gray-500">
                      {formatNumber(location.impressions)} impressões
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(location.spend)}</div>
                  <div className="text-sm text-gray-500">
                    {formatNumber(location.clicks)} cliques
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
