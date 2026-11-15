'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Calendar,
  Award,
  Leaf,
  ShieldCheck,
  Clock,
  Sun,
} from 'lucide-react';
import { DailyCurvePoint, SolarTelemetry, StationOverview } from '../../types/solis';

interface GenerationOverviewCardProps {
  telemetry: SolarTelemetry;
  overview: StationOverview | null;
  curveData: DailyCurvePoint[];
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return Math.min(1440, Math.max(0, h * 60 + m));
}

export function GenerationOverviewCard({
  telemetry,
  overview,
  curveData,
}: GenerationOverviewCardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState({
    solar: true,
    load: true,
    battery: false,
    grid: false,
  });

  const points = useMemo(() => {
    if (!curveData || curveData.length === 0) return [];
    return [...curveData].sort(
      (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
    );
  }, [curveData]);

  const capacityKwp = overview?.capacity && overview.capacity > 0 ? overview.capacity : 10;
  const pvNow = telemetry.pvPower ?? 0;
  const yieldToday = telemetry.yieldToday ?? 0;
  const capacityPct = Math.min(100, Math.round((pvNow / capacityKwp) * 100));

  const yieldMonth = telemetry.yieldMonth ?? 0;
  const yieldTotal = telemetry.yieldTotal ?? 0;
  const co2Avoided = telemetry.co2AvoidedToday ?? 0;
  const loadToday = telemetry.loadToday ?? 0;
  const gridImportToday = telemetry.gridImportToday ?? 0;
  const selfSufficiencyToday =
    loadToday > 0
      ? Math.max(0, Math.min(100, Math.round(((loadToday - gridImportToday) / loadToday) * 100)))
      : pvNow > 0.05
        ? 100
        : 0;

  // Chart calculations
  const maxSolar = points.length ? Math.max(...points.map((d) => d.solar), 1) : 1;
  const maxLoad = points.length ? Math.max(...points.map((d) => d.load), 1) : 1;
  const maxBat = points.length ? Math.max(...points.map((d) => Math.abs(d.battery || 0)), 1) : 1;
  const maxGrd = points.length ? Math.max(...points.map((d) => Math.abs(d.grid || 0)), 1) : 1;
  const maxVal = Math.max(maxSolar, maxLoad, maxBat, maxGrd, 6.0);

  const svgWidth = 860;
  const svgHeight = 220;
  const paddingX = 52;
  const paddingY = 24;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const getXFromMinutes = (mins: number) => paddingX + (mins / 1440) * chartWidth;
  const getY = (val: number) =>
    paddingY + chartHeight - (Math.max(0, val) / maxVal) * chartHeight;

  const buildPath = (key: 'solar' | 'load' | 'battery' | 'grid') => {
    return points
      .map((pt, i) => {
        const x = getXFromMinutes(parseTimeToMinutes(pt.time));
        const raw = pt[key] ?? 0;
        const y = getY(key === 'battery' || key === 'grid' ? Math.abs(raw) : raw);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const buildArea = (path: string) => {
    if (points.length === 0) return '';
    const firstPtX = getXFromMinutes(parseTimeToMinutes(points[0].time));
    const lastPtX = getXFromMinutes(parseTimeToMinutes(points[points.length - 1].time));
    const baseY = (paddingY + chartHeight).toFixed(1);
    return `${path} L ${lastPtX.toFixed(1)} ${baseY} L ${firstPtX.toFixed(1)} ${baseY} Z`;
  };

  const solarPath = points.length ? buildPath('solar') : '';
  const loadPath = points.length ? buildPath('load') : '';
  const batteryPath = points.length ? buildPath('battery') : '';
  const gridPath = points.length ? buildPath('grid') : '';

  const solarArea = buildArea(solarPath);
  const loadArea = buildArea(loadPath);
  const batteryArea = buildArea(batteryPath);
  const gridArea = buildArea(gridPath);

  const latestRecordedMins = points.length
    ? parseTimeToMinutes(points[points.length - 1].time)
    : 0;
  const latestRecordedX = getXFromMinutes(latestRecordedMins);

  const activePoint =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
      ? points[hoverIndex]
      : points.length > 0
        ? points[points.length - 1]
        : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio =
      (clientX - (paddingX / svgWidth) * rect.width) /
      ((chartWidth / svgWidth) * rect.width);
    const targetMins = Math.max(0, Math.min(1440, ratio * 1440));

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

  const hourMarkers = [0, 4, 8, 12, 16, 20, 24];

  return (
    <section
      id="overview"
      aria-labelledby="overview-heading"
      className="noc-card p-5 sm:p-6 flex flex-col justify-between lg:col-span-8"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Generation Overview
          </p>
          <h2 id="overview-heading" className="text-lg font-bold text-[var(--text)] mt-0.5">
            Today&apos;s Solar Yield &amp; 24h Profile
          </h2>

          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mt-2">
            <div>
              <span className="text-xs text-[var(--muted)] block">Yield today</span>
              <span className="text-2xl sm:text-3xl font-bold text-[var(--text)] num">
                {yieldToday.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-[var(--muted)] ml-1">kWh</span>
            </div>

            <div className="h-8 w-px bg-[var(--line)] hidden sm:block" aria-hidden="true" />

            <div>
              <span className="text-xs text-[var(--muted)] block">PV now</span>
              <span className="text-lg font-bold text-[#ff7a45] num">
                {pvNow.toFixed(2)} kW
              </span>
              <span className="text-xs text-[var(--muted)] ml-1.5 num">
                ({capacityPct}% of {capacityKwp.toFixed(1)} kWp)
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Legend Chips + Scrubber */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, solar: !s.solar }))}
              aria-pressed={visibleSeries.solar}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                visibleSeries.solar
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-gray-50 text-[var(--muted)] border-[var(--line)] line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ff7a45]" />
              Solar
            </button>

            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, load: !s.load }))}
              aria-pressed={visibleSeries.load}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                visibleSeries.load
                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                  : 'bg-gray-50 text-[var(--muted)] border-[var(--line)] line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#f0418c]" />
              Load
            </button>

            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, battery: !s.battery }))}
              aria-pressed={visibleSeries.battery}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                visibleSeries.battery
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-gray-50 text-[var(--muted)] border-[var(--line)] line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#8e5fd6]" />
              Battery
            </button>

            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, grid: !s.grid }))}
              aria-pressed={visibleSeries.grid}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                visibleSeries.grid
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-gray-50 text-[var(--muted)] border-[var(--line)] line-through'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#43c6f0]" />
              Grid
            </button>
          </div>

          {activePoint && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg)] border border-[var(--line)] text-[11px] text-[var(--text)] num">
              <Clock className="w-3 h-3 text-[var(--muted)]" aria-hidden="true" />
              <span className="font-semibold">{activePoint.time}</span>
              <span className="text-[var(--muted)]">·</span>
              <span>
                PV <strong className="text-[#ff7a45]">{activePoint.solar.toFixed(2)}</strong>
              </span>
              <span className="text-[var(--muted)]">·</span>
              <span>
                Load <strong className="text-[#f0418c]">{activePoint.load.toFixed(2)}</strong> kW
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 24h SVG Area Chart */}
      <div className="relative w-full overflow-hidden select-none my-1">
        {points.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-[var(--muted)]">
            Loading 24-hour generation curve...
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-56 cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIndex(null)}
              role="img"
              aria-label="24-hour solar generation and home load area chart"
            >
              <defs>
                <linearGradient id="nocSolarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb330" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#ff7a45" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="nocLoadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0418c" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#f0418c" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="nocBatteryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8e5fd6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#8e5fd6" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="nocGridGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#43c6f0" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#43c6f0" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & kW Axis Labels */}
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
                      stroke="#eef0f5"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3.5}
                      fill="#8a8fa3"
                      fontSize="10"
                      fontFamily="var(--font-mono), monospace"
                      textAnchor="end"
                    >
                      {kwLabel} kW
                    </text>
                  </g>
                );
              })}

              {/* Vertical 4-Hour Grid Lines */}
              {hourMarkers.map((hour, idx) => {
                const x = getXFromMinutes(hour * 60);
                return (
                  <line
                    key={idx}
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={paddingY + chartHeight}
                    stroke="#eef0f5"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Areas */}
              {visibleSeries.solar && <path d={solarArea} fill="url(#nocSolarGrad)" />}
              {visibleSeries.load && <path d={loadArea} fill="url(#nocLoadGrad)" />}
              {visibleSeries.battery && <path d={batteryArea} fill="url(#nocBatteryGrad)" />}
              {visibleSeries.grid && <path d={gridArea} fill="url(#nocGridGrad)" />}

              {/* Lines */}
              {visibleSeries.solar && (
                <path
                  d={solarPath}
                  fill="none"
                  stroke="#ff7a45"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visibleSeries.load && (
                <path
                  d={loadPath}
                  fill="none"
                  stroke="#f0418c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visibleSeries.battery && (
                <path
                  d={batteryPath}
                  fill="none"
                  stroke="#8e5fd6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {visibleSeries.grid && (
                <path
                  d={gridPath}
                  fill="none"
                  stroke="#43c6f0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* "Now" Vertical Marker */}
              <line
                x1={latestRecordedX}
                y1={paddingY}
                x2={latestRecordedX}
                y2={paddingY + chartHeight}
                stroke="#f0418c"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              <text
                x={latestRecordedX}
                y={paddingY - 7}
                fill="#f0418c"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                Now ({points[points.length - 1].time})
              </text>

              {/* Active Hover Scrubber */}
              {activePoint && hoverIndex !== null && (
                <g>
                  <line
                    x1={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                    y1={paddingY}
                    x2={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                    y2={paddingY + chartHeight}
                    stroke="#2b2f3a"
                    strokeWidth="1.2"
                    opacity="0.4"
                  />
                  {visibleSeries.solar && (
                    <circle
                      cx={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                      cy={getY(activePoint.solar)}
                      r="4.5"
                      fill="#ff7a45"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                  {visibleSeries.load && (
                    <circle
                      cx={getXFromMinutes(parseTimeToMinutes(activePoint.time))}
                      cy={getY(activePoint.load)}
                      r="4"
                      fill="#f0418c"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}
            </svg>

            {/* 24h X-Axis Labels */}
            <div className="relative w-full h-5 mt-1 text-[11px] text-[var(--muted)] num">
              {hourMarkers.map((hour, idx) => {
                const leftPercent = (hour / 24) * 100;
                const timeLabel = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <span
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `calc(${leftPercent}% * (${chartWidth} / ${svgWidth}) + ${(paddingX / svgWidth) * 100}%)`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {timeLabel}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom 4 Mini-Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-3 border-t border-[var(--line)]">
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--g-solar)' }}
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] text-[var(--muted)] block truncate">Month yield</span>
            <span className="text-sm font-bold text-[var(--text)] num">
              {yieldMonth.toFixed(1)} kWh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--g-battery)' }}
          >
            <Award className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] text-[var(--muted)] block truncate">Lifetime</span>
            <span className="text-sm font-bold text-[var(--text)] num">
              {yieldTotal.toFixed(2)} MWh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--g-grid)' }}
          >
            <Leaf className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] text-[var(--muted)] block truncate">CO₂ avoided</span>
            <span className="text-sm font-bold text-[var(--text)] num">
              {co2Avoided.toFixed(1)} kg
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ background: 'var(--g-load)' }}
          >
            {selfSufficiencyToday >= 50 ? (
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Sun className="w-4 h-4" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] text-[var(--muted)] block truncate">
              Self-sufficiency
            </span>
            <span className="text-sm font-bold text-[var(--text)] num">
              {selfSufficiencyToday}% today
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
