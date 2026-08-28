import React, { useId, useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/utils/metrics';
import type { FunnelInput } from '@/types/metrics';

type Props = {
  data: FunnelInput;
  height?: number;
  /** @deprecated kept for backward compatibility — no longer used */
  paddingX?: number;
  /** @deprecated kept for backward compatibility — no longer used */
  stageGap?: number;
};

/**
 * Horizontal performance funnel — a smooth, symmetric "flow" that starts wide on the left
 * (highest-volume stage) and tapers to a thin neck on the right, over a dark panel with a cyan→blue
 * gradient. Impressões → Alcance → Cliques → CPA. The three volume stages drive the taper
 * (perceptually compressed so orders-of-magnitude differences still read as a smooth funnel); CPA is
 * a cost, so it renders as the neck. Labels sit on top, values in pills at the bottom.
 */
export default function FunnelFlow({ data, height = 340 }: Props) {
  const uid = useId().replace(/:/g, '');

  const stages = useMemo(() => {
    const impressions = Math.max(0, data.impressions || 0);
    const reach = Math.max(0, data.reach || 0);
    const clicks = Math.max(0, data.clicks || 0);
    const cpa = Math.max(0, data.cpa || 0);

    const NECK = 0.16; // thinnest visible band, as a fraction of the max thickness
    const POW = 0.45;  // perceptual compression so large ratios still taper smoothly

    const counts = [impressions, reach, clicks];
    const maxCount = Math.max(...counts, 1);
    // volume stages → compressed widths; CPA (a cost, not a volume) → the neck
    let widths = [
      ...counts.map((c) => NECK + (1 - NECK) * Math.pow(c / maxCount, POW)),
      NECK * 0.82,
    ];

    // No data yet → a clean decorative taper so it still looks like a funnel.
    if (impressions + reach + clicks + cpa <= 0) widths = [1, 0.68, 0.4, 0.18];

    // Always narrow to the right.
    for (let i = 1; i < widths.length; i++) widths[i] = Math.min(widths[i], widths[i - 1]);

    return [
      { key: 'impressions', label: 'Impressões', value: formatNumber(impressions), width: widths[0] },
      { key: 'reach', label: 'Alcance', value: formatNumber(reach), width: widths[1] },
      { key: 'clicks', label: 'Cliques', value: formatNumber(clicks), width: widths[2] },
      { key: 'cpa', label: 'CPA', value: formatCurrency(cpa), width: widths[3] },
    ];
  }, [data]);

  const cols = stages.length;

  // Layout: top label row, SVG chart, bottom value row.
  const topH = 30;
  const bottomH = 60;
  const W = 1000;                          // viewBox width units (x is stretched to the container)
  const chartH = Math.max(120, height - topH - bottomH);
  const centerY = chartH / 2;
  const maxBand = chartH * 0.84;

  const xAt = (i: number) => (i / (cols - 1)) * W;

  // Smooth cubic path through points with horizontal tangent handles.
  const curve = (pts: Array<{ x: number; y: number }>) => {
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const dx = (p1.x - p0.x) * 0.5;
      d += ` C ${p0.x + dx},${p0.y} ${p1.x - dx},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const top = stages.map((s, i) => ({ x: xAt(i), y: centerY - (s.width * maxBand) / 2 }));
  const bot = stages.map((s, i) => ({ x: xAt(i), y: centerY + (s.width * maxBand) / 2 }));
  const last = bot[bot.length - 1];
  const band =
    curve(top) +
    ` L ${last.x},${last.y} ` +
    curve([...bot].reverse()).replace(/^M/, 'L') +
    ' Z';

  const gradId = `funnelFlow-${uid}`;
  const sheenId = `funnelSheen-${uid}`;
  const glowId = `funnelGlow-${uid}`;
  const clipId = `funnelClip-${uid}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ height, background: '#0b1220', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Stage labels (top) */}
      <div
        className="absolute left-0 right-0 grid px-4"
        style={{ top: 0, height: topH, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {stages.map((s, i) => (
          <div
            key={s.key}
            className={`flex items-center text-[11px] sm:text-xs font-medium uppercase tracking-wide text-white/55 ${
              i === 0 ? 'justify-start' : i === cols - 1 ? 'justify-end' : 'justify-center'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="absolute left-0 right-0" style={{ top: topH, height: chartH }}>
        <svg width="100%" height={chartH} viewBox={`0 0 ${W} ${chartH}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38e0f2" />
              <stop offset="55%" stopColor="#2aa9f0" />
              <stop offset="100%" stopColor="#2f6bed" />
            </linearGradient>
            {/* soft top highlight + bottom shade for a rounded, 3D "ribbon" look */}
            <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="48%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <clipPath id={clipId}>
              <path d={band} />
            </clipPath>
          </defs>

          {/* Subtle stage dividers behind the flow */}
          {stages.map((_, i) => (
            <line
              key={i}
              x1={xAt(i)}
              y1={8}
              x2={xAt(i)}
              y2={chartH - 8}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Glow */}
          <path d={band} fill={`url(#${gradId})`} opacity={0.35} filter={`url(#${glowId})`} />
          {/* Main flow */}
          <path d={band} fill={`url(#${gradId})`} />
          {/* Sheen (clipped to the flow) */}
          <rect x={0} y={0} width={W} height={chartH} fill={`url(#${sheenId})`} clipPath={`url(#${clipId})`} />
          {/* Fold seam down the middle */}
          <line
            x1={0}
            y1={centerY}
            x2={W}
            y2={centerY}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            clipPath={`url(#${clipId})`}
          />
        </svg>
      </div>

      {/* Values (bottom) */}
      <div
        className="absolute left-0 right-0 grid px-4"
        style={{ bottom: 0, height: bottomH, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {stages.map((s, i) => (
          <div
            key={s.key}
            className={`flex items-center ${
              i === 0 ? 'justify-start' : i === cols - 1 ? 'justify-end' : 'justify-center'
            }`}
          >
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-white/90 tabular-nums">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
