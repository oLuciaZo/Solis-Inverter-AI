'use client';

import React, { useState, useRef, useMemo } from 'react';
import { DailyCurvePoint } from '../types/solis';
import { TrendingUp, Clock, Sun, Home, Battery, Zap } from 'lucide-react';

interface DailyGenerationChartProps {
  curveData: DailyCurvePoint[];
}

// Convert "HH:MM" or "HH:MM:SS" into minutes of the day (0 - 1440)
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return Math.min(1440, Math.max(0, h * 60 + m));
}

function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const DailyGenerationChart: React.FC<DailyGenerationChartProps> = ({ curveData }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState({
    solar: true,
    load: true,
    battery: false,
    grid: false,
  });

  // Sort and filter valid points
  const points = useMemo(() => {
    if (!curveData || curveData.length === 0) return [];
    return [...curveData].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  }, [curveData]);

  if (points.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400 mb-6">
        Loading 24-hour generation curve...
      </div>
    );
  }

  // Calculate chart boundaries
  const maxSolar = Math.max(...points.map((d) => d.solar), 1);
  const maxLoad = Math.max(...points.map((d) => d.load), 1);
  const maxBat = Math.max(...points.map((d) => Math.abs(d.battery || 0)), 1);
  const maxGrd = Math.max(...points.map((d) => Math.abs(d.grid || 0)), 1);
  const maxVal = Math.max(maxSolar, maxLoad, maxBat, maxGrd, 6.0);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Accurate 24-hour X coordinate scaling (00:00 = 0 mins -> 24:00 = 1440 mins)
  const getXFromMinutes = (mins: number) => paddingX + (mins / 1440) * chartWidth;
  const getY = (val: number) => paddingY + chartHeight - (Math.max(0, val) / maxVal) * chartHeight;

  // Build SVG Paths
  const buildPath = (key: 'solar' | 'load' | 'battery' | 'grid') => {
    return points
      .map((pt, i) => {
        const x = getXFromMinutes(parseTimeToMinutes(pt.time));
        const y = getY((pt as any)[key] || 0);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const solarPath = buildPath('solar');
  const loadPath = buildPath('load');
  const batteryPath = buildPath('battery');
  const gridPath = buildPath('grid');

  // Closed area under solar curve
  const firstPtX = getXFromMinutes(parseTimeToMinutes(points[0].time));
  const lastPtX = getXFromMinutes(parseTimeToMinutes(points[points.length - 1].time));
  const solarArea = `${solarPath} L ${lastPtX.toFixed(1)} ${(paddingY + chartHeight).toFixed(1)} L ${firstPtX.toFixed(1)} ${(paddingY + chartHeight).toFixed(1)} Z`;

  // Current recorded time (latest data point from inverter)
  const latestRecordedMins = parseTimeToMinutes(points[points.length - 1].time);
  const latestRecordedX = getXFromMinutes(latestRecordedMins);

  // Handle active hover point
  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
    ? points[hoverIndex]
    : points[points.length - 1]; // default to latest live point

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX - (paddingX / svgWidth) * rect.width) / ((chartWidth / svgWidth) * rect.width);
    const targetMins = Math.max(0, Math.min(1440, ratio * 1440));

    // Find closest data point
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const diff = Math.abs(parseTimeToMinutes(points[i].time) - targetMins);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoverIndex(closestIdx);
  };

  // Hour markers every 2 hours: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00, 24:00
  const hourMarkers = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  return (
    <div className="glass-panel rounded-2xl p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> 24-Hour Energy Profile (00:00 – 24:00)
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">Today's Generation & Consumption</h3>
        </div>

        {/* Dynamic Scrubber Display */}
        {activePoint && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 shadow-inner text-xs text-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-amber-300">{activePoint.time}</span>
            <span className="text-slate-500">•</span>
            <span>Solar: <strong className="text-amber-400">{activePoint.solar.toFixed(2)} kW</strong></span>
            <span className="text-slate-500">•</span>
            <span>Load: <strong className="text-purple-400">{activePoint.load.toFixed(2)} kW</strong></span>
          </div>
        )}

        {/* Legend & Series Toggles */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
          <button
            onClick={() => setVisibleSeries((s) => ({ ...s, solar: !s.solar }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              visibleSeries.solar
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Solar (kW)</span>
          </button>

          <button
            onClick={() => setVisibleSeries((s) => ({ ...s, load: !s.load }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              visibleSeries.load
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>Load (kW)</span>
          </button>

          <button
            onClick={() => setVisibleSeries((s) => ({ ...s, battery: !s.battery }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              visibleSeries.battery
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Battery</span>
          </button>

          <button
            onClick={() => setVisibleSeries((s) => ({ ...s, grid: !s.grid }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              visibleSeries.grid
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900/40 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* SVG 24-HOUR CHART */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 sm:h-72 cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="solarDayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Power Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * (1 - ratio);
            const kwLabel = (maxVal * ratio).toFixed(1);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <text x={paddingX - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                  {kwLabel}k
                </text>
              </g>
            );
          })}

          {/* Vertical 2-Hour Time Grid lines */}
          {hourMarkers.map((hour, idx) => {
            const x = getXFromMinutes(hour * 60);
            return (
              <line
                key={idx}
                x1={x}
                y1={paddingY}
                x2={x}
                y2={paddingY + chartHeight}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="2 4"
              />
            );
          })}

          {/* Solar Filled Area */}
          {visibleSeries.solar && <path d={solarArea} fill="url(#solarDayGrad)" />}

          {/* Solar Power Line */}
          {visibleSeries.solar && (
            <path
              d={solarPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Home Load Line */}
          {visibleSeries.load && (
            <path
              d={loadPath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
          )}

          {/* Battery Line */}
          {visibleSeries.battery && (
            <path
              d={batteryPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Grid Line */}
          {visibleSeries.grid && (
            <path
              d={gridPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}

          {/* Vertical "Current Recorded Time" Marker */}
          <line
            x1={latestRecordedX}
            y1={paddingY}
            x2={latestRecordedX}
            y2={paddingY + chartHeight}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.75"
          />
          <text
            x={latestRecordedX}
            y={paddingY - 8}
            fill="#f59e0b"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            Now ({points[points.length - 1].time})
          </text>

          {/* Active Hover Cursor & Tooltip Marker */}
          {activePoint && hoverIndex !== null && (
            <g>
              <line
                x1={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                y1={paddingY}
                x2={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                y2={paddingY + chartHeight}
                stroke="#38bdf8"
                strokeWidth="1.8"
              />
              <circle
                cx={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                cy={getY(activePoint.solar)}
                r="5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                cy={getY(activePoint.load)}
                r="4"
                fill="#a855f7"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* 24-Hour X-Axis Labels placed at exact matching mathematical positions */}
        <div className="relative w-full h-6 mt-1 text-[11px] text-slate-500 font-mono">
          {hourMarkers.map((hour, idx) => {
            const leftPercent = (hour / 24) * 100;
            const timeLabel = `${String(hour === 24 ? 24 : hour).padStart(2, '0')}:00`;
            return (
              <span
                key={idx}
                style={{
                  position: 'absolute',
                  left: `calc(${leftPercent}% * (${chartWidth} / ${svgWidth}) + ${(paddingX / svgWidth) * 100}%)`,
                  transform: 'translateX(-50%)',
                }}
                className={hour % 4 === 0 ? 'text-slate-400 font-medium' : 'text-slate-600'}
              >
                {timeLabel}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
