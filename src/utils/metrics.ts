export const formatNumber = (v: number) =>
  Intl.NumberFormat('pt-BR').format(v);

export const formatCurrency = (v: number) =>
  Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/**
 * Normaliza um array [a,b,c,...] para [0..1] mantendo proporções.
 * Evita 0 absoluto aplicando piso mínimo opcional.
 */
export const normalize = (values: number[], minFloor = 0.08) => {
  const max = Math.max(...values);
  if (max === 0) return values.map(() => minFloor);
  return values.map(v => Math.max(v / max, minFloor));
};