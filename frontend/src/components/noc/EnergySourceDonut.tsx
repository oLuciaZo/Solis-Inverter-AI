'use client';

import React from 'react';
import { SolarTelemetry } from '../../types/solis';

interface EnergySourceDonutProps {
  telemetry: SolarTelemetry;
}

export function EnergySourceDonut({ telemetry }: EnergySourceDonutProps) {
  const loadToday = telemetry.loadToday ?? 0;
  const gridImportToday = telemetry.gridImportToday ?? 0;
  const batteryDischargeToday = telemetry.batteryDischargeToday ?? 0;

  const solarDirectKwh = Math.max(0, loadToday - gridImportToday - batteryDischargeToday);
  const batteryKwh = Math.max(0, batteryDischargeToday);
  const gridKwh = Math.max(0, gridImportToday);

  const total = solarDirectKwh + batteryKwh + gridKwh;

  const solarPct = total > 0 ? Math.round((solarDirectKwh / total) * 100) : 0;
  const batteryPct = total > 0 ? Math.round((batteryKwh / total) * 100) : 0;
  const gridPct = total > 0 ? Math.max(0, 100 - solarPct - batteryPct) : 0;

  // SVG Donut geometry
  const size = 176;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    {
      label: 'Solar Direct',
      pct: solarPct,
      kwh: solarDirectKwh,
      color: '#ff9a3c',
      dotClass: 'bg-[#ff9a3c]',
    },
    {
      label: 'Battery',
      pct: batteryPct,
      kwh: batteryKwh,
      color: '#7a4fd0',
      dotClass: 'bg-[#7a4fd0]',
    },
    {
      label: 'Grid Import',
      pct: gridPct,
      kwh: gridKwh,
      color: '#43c6f0',
      dotClass: 'bg-[#43c6f0]',
    },
  ];

  // Compute cumulative stroke offsets
  let cumulativeRatio = 0;
  const arcs = segments.map((seg) => {
    const ratio = total > 0 ? seg.kwh / total : 0;
    const dashArray = `${ratio * circumference} ${circumference}`;
    const dashOffset = -cumulativeRatio * circumference;
    cumulativeRatio += ratio;
    return { ...seg, dashArray, dashOffset };
  });

  return (
    <section
      aria-labelledby="energy-source-heading"
      className="noc-card p-5 sm:p-6 flex flex-col justify-between lg:col-span-4"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Consumption Mix
        </p>
        <h2
          id="energy-source-heading"
          className="text-base font-bold text-[var(--text)] mt-0.5 leading-snug"
        >
          Where today&apos;s home energy came from
        </h2>
      </div>

      {/* Center SVG Donut */}
      <div className="my-5 flex items-center justify-center">
        <div className="relative w-44 h-44">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`Today's home energy mix: Solar Direct ${solarPct}%, Battery ${batteryPct}%, Grid ${gridPct}%`}
          >
            {/* Track circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#eef0f5"
              strokeWidth={strokeWidth}
            />

            {total > 0 &&
              arcs.map((arc) =>
                arc.kwh > 0 ? (
                  <circle
                    key={arc.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={arc.dashArray}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="butt"
                  />
                ) : null
              )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-medium text-[var(--muted)]">Load today</span>
            <span className="text-xl font-bold text-[var(--text)] num">
              {loadToday.toFixed(1)}
            </span>
            <span className="text-[11px] font-medium text-[var(--muted)]">kWh</span>
          </div>
        </div>
      </div>

      {/* Bottom 3 Big % Numbers + kWh Captions */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--line)] text-center">
        {segments.map((seg) => (
          <div key={seg.label} className="px-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted)]">
              <span className={`w-2 h-2 rounded-full ${seg.dotClass}`} />
              <span className="truncate">{seg.label}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text)] num mt-0.5 leading-none">
              {seg.pct}
              <sup className="text-xs font-semibold ml-0.5">%</sup>
            </div>
            <div className="text-[11px] text-[var(--muted)] num mt-1">
              {seg.kwh.toFixed(1)} kWh
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
