export type FunnelInput = {
  impressions: number;     // Ex.: 353435
  reach: number;           // Ex.: 188000
  clicks: number;          // Ex.: 1200
  cpa: number;             // Ex.: 3.9 (R$)
};

export type FunnelStage = {
  key: 'impressions' | 'reach' | 'clicks' | 'cpa_eff';
  label: string;
  rawValue: number;        // valor original (para CPA mostrar o R$ real)
  widthValue: number;      // valor usado para largura (cpa -> eficiência normalizada)
  formatted: string;       // texto formatado
};

export type MonthlySpend = {
  month: number;   // 1..12
  label: string;   // 'JAN', 'FEV', ...
  value: number;   // gasto do mês em BRL
};

export type SpendCardProps = {
  months: MonthlySpend[]; // sempre 12 posições; meses futuros com value=0 e hidden via lógica
};