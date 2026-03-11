import React from 'react';
import { useMemo } from 'react';
import { formatCurrency, formatNumber, normalize } from '@/utils/metrics';
import type { FunnelInput, FunnelStage } from '@/types/metrics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  data: FunnelInput;
  height?: number;           // default 280
  paddingX?: number;         // default 24
  stageGap?: number;         // gap vertical para labels
};

export default function FunnelFlow({
  data,
  height = 300,
  paddingX = 24,
  stageGap = 52
}: Props) {
  // 1) preparar estágios
  const stages: FunnelStage[] = useMemo(() => {
    // Garantir valores seguros (0 se null/undefined)
    const safeImpressions = data.impressions || 0;
    const safeReach = data.reach || 0;
    const safeClicks = data.clicks || 0;
    const safeCpa = data.cpa || 0;

    // eficiência de CPA (quanto menor o CPA, maior a eficiência)
    const cpaEff = safeCpa > 0 ? 1 / safeCpa : 0;

    // Se todos os valores são 0, usar valores mínimos para visualização
    const hasData = safeImpressions > 0 || safeReach > 0 || safeClicks > 0 || safeCpa > 0;
    const widths = hasData 
      ? normalize([safeImpressions, safeReach, safeClicks, cpaEff], 0.10)
      : [0.3, 0.25, 0.2, 0.15]; // valores mínimos visuais quando não há dados

    return [
      {
        key: 'impressions',
        label: 'Impressões',
        rawValue: safeImpressions,
        widthValue: widths[0],
        formatted: formatNumber(safeImpressions)
      },
      {
        key: 'reach',
        label: 'Alcance',
        rawValue: safeReach,
        widthValue: widths[1],
        formatted: formatNumber(safeReach)
      },
      {
        key: 'clicks',
        label: 'Cliques',
        rawValue: safeClicks,
        widthValue: widths[2],
        formatted: formatNumber(safeClicks)
      },
      {
        key: 'cpa_eff',
        label: 'CPA',
        rawValue: safeCpa,
        widthValue: widths[3],
        formatted: formatCurrency(safeCpa)
      }
    ];
  }, [data]);

  // 2) dimensões do SVG - usar valores absolutos
  const innerW = 400; // largura fixa em pixels
  const innerH = height - 70; // espaço para labels
  const centerY = innerH / 2;

  // 3) calcular as "colunas" (uma por estágio)
  const cols = stages.length;
  const colW = innerW / (cols - 1);

  // 4) gerar pontos superiores/inferiores para o polígono da faixa
  const topPts: Array<{x:number; y:number}> = [];
  const botPts: Array<{x:number; y:number}> = [];

  const maxBand = innerH * 0.8; // espessura max do "rio"
  const k = 0.35;                 // curvatura bezier

  stages.forEach((s, i) => {
    const bandH = s.widthValue * maxBand;
    const half = bandH / 2;
    const x = (i * colW);
    topPts.push({ x, y: centerY - half });
    botPts.push({ x, y: centerY + half });
  });

  // 5) helper para path com curvas suaves
  const curvePath = (pts: Array<{x:number; y:number}>) => {
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const dx = (p1.x - p0.x) * k;
      d += ` C ${p0.x + dx},${p0.y} ${p1.x - dx},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const pathTop = curvePath(topPts);
  const pathBot = curvePath([...botPts].reverse());
  const d = `${pathTop} L ${botPts.at(-1)!.x},${botPts.at(-1)!.y} ${pathBot} Z`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{
        height,
        background: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* linhas divisórias entre etapas */}
      <svg width="100%" height={height} viewBox={`0 0 ${innerW} ${height}`} className="absolute inset-0">
        {Array.from({ length: cols }).map((_, i) => {
          const x = (i * colW);
          return (
            <line 
              key={i} 
              x1={x}
              y1={20} 
              x2={x}
              y2={innerH + 20} 
              stroke="rgba(255,255,255,0.06)" 
            />
          );
        })}

        {/* gradiente do fluxo */}
        <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="1.0" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="1.0" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="1.0" />
          </linearGradient>
        </defs>

        <g transform="translate(0, 20)">
          <path d={d} fill="url(#flowGrad)" />
        </g>
      </svg>

      {/* labels + badges abaixo */}
      <div className="absolute left-4 right-4 bottom-4">
        <div 
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          <TooltipProvider>
            {stages.map((s, i) => (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <div 
                    className={`${
                      i === 0 ? 'text-left' : i === cols - 1 ? 'text-right' : 'text-center'
                    }`}
                  >
                    <div className="text-xs text-white/70 mb-1.5">
                      {s.label}
                    </div>
                    <div className="inline-block px-2.5 py-1.5 rounded-md text-xs font-semibold text-white/95 bg-white/8 border border-white/10">
                      {s.key === 'cpa_eff' ? formatCurrency(s.rawValue) : s.formatted}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{s.label}: {s.key === 'cpa_eff' ? formatCurrency(s.rawValue) : s.formatted}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}