export const brl = (v = 0) =>
  Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const num = (v = 0) =>
  Intl.NumberFormat('pt-BR').format(v);

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const statusColor = (s: string) => {
  switch (s) {
    case 'active': return { bg: 'bg-green-100', fg: 'text-green-800', label: 'Ativa' };
    case 'paused': return { bg: 'bg-yellow-100', fg: 'text-yellow-800', label: 'Pausada' };
    case 'disabled': return { bg: 'bg-red-100', fg: 'text-red-800', label: 'Desativada' };
    default: return { bg: 'bg-gray-100', fg: 'text-gray-800', label: 'Rascunho' };
  }
};