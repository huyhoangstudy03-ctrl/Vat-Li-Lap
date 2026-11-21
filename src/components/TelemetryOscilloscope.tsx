import { useMemo, useState } from 'react';
import { TelemetrySeries } from '../physics/types';

interface TelemetryOscilloscopeProps {
  series: TelemetrySeries;
}

export function TelemetryOscilloscope({ series }: TelemetryOscilloscopeProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 640;
  const height = 220;
  const padL = 48;
  const padR = series.channels.length > 1 ? 48 : 18;
  const padT = 18;
  const padB = 34;

  const { xMin, xMax, channelStats } = useMemo(() => {
    const pts = series.points;
    if (pts.length === 0) {
      return { xMin: 0, xMax: 1, channelStats: {} as Record<string, { min: number; max: number }> };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    const stats: Record<string, { min: number; max: number }> = {};
    for (const ch of series.channels) {
      stats[ch.key] = { min: Infinity, max: -Infinity };
    }
    for (const pt of pts) {
      minX = Math.min(minX, pt.x);
      maxX = Math.max(maxX, pt.x);
      for (const ch of series.channels) {
        const val = pt[ch.key];
        if (val < stats[ch.key].min) stats[ch.key].min = val;
        if (val > stats[ch.key].max) stats[ch.key].max = val;
      }
    }
    return { xMin: minX, xMax: maxX === minX ? minX + 1 : maxX, channelStats: stats };
  }, [series]);

  const toSvgX = (xVal: number) =>
    padL + ((xVal - xMin) / Math.max(1e-9, xMax - xMin)) * (width - padL - padR);

  const toSvgY = (chKey: string, yVal: number) => {
    const st = channelStats[chKey] ?? { min: 0, max: 1 };
    const span = Math.max(1e-6, st.max - st.min);
    const padSpan = span * 0.12;
    const lo = st.min - padSpan;
    const hi = st.max + padSpan;
    return height - padB - ((yVal - lo) / (hi - lo)) * (height - padT - padB);
  };

  // Remap deep blues to bright sky on dark background for crisp readability
  const darkColor = (c: string) => {
    if (c === '#2563eb') return '#38bdf8';
    if (c === '#059669') return '#34d399';
    if (c === '#d97706') return '#fbbf24';
    if (c === '#dc2626') return '#fb7185';
    return c;
  };

  const activePoint =
    hoverIdx !== null && series.points[hoverIdx]
      ? series.points[hoverIdx]
      : series.points[Math.floor(series.points.length / 2)];

  const primaryChannel = series.channels[0];
  const secondaryChannel = series.channels[1];
  const primaryStats = primaryChannel ? channelStats[primaryChannel.key] : { min: 0, max: 1 };
  const secondaryStats = secondaryChannel ? channelStats[secondaryChannel.key] : null;

  return (
    <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Biểu đồ đặc tuyến thời gian thực
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Di chuột lên đồ thị để đọc tọa độ chính xác · Trục hoành: {series.xLabel} ({series.xUnit || 'không đơn vị'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {series.channels.map((ch) => (
            <div key={ch.key} className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span
                className="inline-block w-3 h-0.5 rounded-full"
                style={{ backgroundColor: darkColor(ch.color) }}
                aria-hidden="true"
              />
              <span>{ch.label}</span>
              {activePoint && (
                <span className="font-mono tabular-nums text-slate-100 font-semibold">
                  {activePoint[ch.key]?.toFixed(2)} {ch.unit}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-slate-800 bg-[#080d1a]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 sm:h-56 block select-none"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const norm = Math.max(0, Math.min(1, (relX - padL) / (width - padL - padR)));
            const idx = Math.round(norm * (series.points.length - 1));
            setHoverIdx(idx);
          }}
          role="img"
          aria-label={`Đồ thị đặc tuyến ${series.channels.map((c) => c.label).join(' và ')}`}
        >
          {/* Horizontal grid lines + Dual Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = padT + f * (height - padT - padB);
            const labelVal = primaryStats
              ? primaryStats.max - f * (primaryStats.max - primaryStats.min)
              : 0;
            const labelVal2 = secondaryStats
              ? secondaryStats.max - f * (secondaryStats.max - secondaryStats.min)
              : null;
            return (
              <g key={f}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.14)"
                  strokeWidth={1}
                />
                <text
                  x={padL - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={darkColor(primaryChannel?.color ?? '#94a3b8')}
                  className="text-[10px] font-mono"
                >
                  {labelVal.toFixed(Math.abs(labelVal) >= 100 ? 0 : 1)}
                </text>
                {labelVal2 !== null && secondaryChannel && (
                  <text
                    x={width - padR + 6}
                    y={y + 3.5}
                    textAnchor="start"
                    fill={darkColor(secondaryChannel.color)}
                    className="text-[10px] font-mono"
                  >
                    {labelVal2.toFixed(Math.abs(labelVal2) >= 100 ? 0 : 1)}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const xv = xMin + f * (xMax - xMin);
            const sx = padL + f * (width - padL - padR);
            return (
              <g key={f}>
                <line
                  x1={sx}
                  y1={height - padB}
                  x2={sx}
                  y2={height - padB + 4}
                  stroke="#475569"
                />
                <text
                  x={sx}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {xv.toFixed(Math.abs(xv) >= 100 ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {/* Series paths */}
          {series.channels.map((ch) => {
            const d = series.points
              .map(
                (pt, i) =>
                  `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(1)} ${toSvgY(ch.key, pt[ch.key]).toFixed(1)}`
              )
              .join(' ');
            return (
              <path
                key={ch.key}
                d={d}
                fill="none"
                stroke={darkColor(ch.color)}
                strokeWidth={2.3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}

          {/* Hover crosshair */}
          {activePoint && (
            <g>
              <line
                x1={toSvgX(activePoint.x)}
                y1={padT}
                x2={toSvgX(activePoint.x)}
                y2={height - padB}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {series.channels.map((ch) => (
                <circle
                  key={ch.key}
                  cx={toSvgX(activePoint.x)}
                  cy={toSvgY(ch.key, activePoint[ch.key])}
                  r={4.2}
                  fill={darkColor(ch.color)}
                  stroke="#080d1a"
                  strokeWidth={1.8}
                />
              ))}
            </g>
          )}
        </svg>

        {activePoint && (
          <div className="px-3.5 py-2 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-400">
            <span>
              Điểm đo: {series.xLabel} ={' '}
              <strong className="text-slate-100">
                {activePoint.x.toFixed(2)} {series.xUnit}
              </strong>
            </span>
            <span className="text-slate-300">
              {series.channels
                .map((ch) => `${ch.label}: ${activePoint[ch.key].toFixed(2)} ${ch.unit}`)
                .join('  ·  ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
