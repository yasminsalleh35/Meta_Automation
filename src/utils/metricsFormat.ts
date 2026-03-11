/**
 * Formatação e fallbacks padronizados para métricas de campanhas
 * Centraliza todas as conversões e placeholders para garantir consistência
 */

/**
 * Converte valor para número finito, retorna 0 se inválido
 */
export const asCount = (v: unknown): number => {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Formata valor como moeda BRL, retorna R$ 0,00 se inválido
 */
export const asMoneyBRL = (v: unknown): string => {
  const num = Number(v);
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(Number.isFinite(num) ? num : 0);
};

/**
 * Calcula porcentagem (num/den * 100), retorna '0%' se inválido
 */
export const asPercent = (num: unknown, den: unknown): string => {
  const n = Number(num);
  const d = Number(den);
  
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) {
    return '0%';
  }
  
  const pct = (n / d) * 100;
  return `${Math.round(pct)}%`;
};

/**
 * Formata número com abreviação (K/M)
 */
export const asCompactNumber = (v: unknown): string => {
  const num = asCount(v);
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('pt-BR').format(num);
};

/**
 * Placeholders padronizados para valores ausentes
 */
export const PH = {
  NONE: '—',              // dado não coletado/inexistente
  COUNT: '0',             // contagens zeradas
  MONEY: asMoneyBRL(0),   // valores monetários zerados
  PCT0: '0%'              // percentuais zerados
} as const;

/**
 * Formata data de sync para exibição
 */
export const formatSyncDate = (dateStr?: string): string => {
  if (!dateStr) return PH.NONE;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return PH.NONE;
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return PH.NONE;
  }
};
