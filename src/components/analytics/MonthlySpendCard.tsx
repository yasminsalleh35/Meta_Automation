import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/metrics';

type Item = { label: string; value: number; visible: boolean };

type Props = {
  items: Item[]; // 12 posições; items[i].visible controla exibição (até mês atual)
  height?: number; // altura total do card; default 280
};

export default function MonthlySpendCard({ items, height = 300 }: Props) {
  const visibleItems = items.filter(i => i.visible);
  const total = visibleItems.reduce((acc, i) => acc + i.value, 0);
  const max = Math.max(...visibleItems.map(i => i.value), 1);

  return (
    <Card 
      className="w-full flex flex-col relative isolate overflow-hidden"
      style={{
        minHeight: height,
        maxHeight: height,
        background: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(255,255,255,0.08)'
      }}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-white/80">
          Valor investido até o momento
        </CardTitle>
        <div className="text-2xl font-bold text-cyan-400">
          {formatCurrency(total)}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-y-auto relative z-10 pb-4">
        {visibleItems.map((item) => {
          const pct = Math.max(item.value / max, 0.04); // piso visual
          return (
            <div key={item.label} className="grid grid-cols-[44px,1fr,auto] items-center gap-2">
              <span className="text-xs text-white/65">
                {item.label}
              </span>
              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${pct * 100}%`,
                    background: 'linear-gradient(90deg,#22d3ee,#3b82f6,#0ea5e9)'
                  }}
                />
              </div>
              <span className="text-xs text-white/90 font-semibold">
                {formatCurrency(item.value)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}