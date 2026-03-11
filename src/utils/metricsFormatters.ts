
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString('pt-BR');
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export const getPerformanceLevel = (ctr: number) => {
  if (ctr >= 2.0) return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-50' };
  if (ctr >= 1.0) return { level: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  if (ctr >= 0.5) return { level: 'Médio', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  return { level: 'Baixo', color: 'text-red-600', bgColor: 'bg-red-50' };
};
