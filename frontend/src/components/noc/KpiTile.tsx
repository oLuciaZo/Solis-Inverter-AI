'use client';

import React from 'react';
import { Sun, BatteryCharging, Zap, Home } from 'lucide-react';
import { DailyCurvePoint, SolarTelemetry, StationOverview } from '../../types/solis';

export interface KpiTileProps {
  id?: string;
  title: string;
  gradient: string;
  icon: React.ReactNode;
  value: string;
  unit?: string;
  badge?: string;
  subline1: string;
  subline2?: string;
  explanation: string;
  visual?: React.ReactNode;
}

export function KpiTile({
  id,
  title,
  gradient,
  icon,
  value,
  unit,
  badge,
  subline1,
  subline2,
  explanation,
  visual,
}: KpiTileProps) {
  return (
    <article
      id={id}
      style={{ background: gradient, borderRadius: 'var(--radius-tile)' }}
      className="p-5 text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 flex flex-col justify-between min-h-[184px]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              {icon}
            </span>
            <h3 className="text-sm font-bold tracking-wide uppercase text-white/95">
              {title}
            </h3>
          </div>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/20 text-white backdrop-blur-xs">
              {badge}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight num leading-none">
            {value}
          </span>
          {unit && <span className="text-sm font-semibold text-white/90">{unit}</span>}
        </div>

        <div className="mt-2 space-y-0.5 text-xs font-medium text-white/95 num">
          <div>{subline1}</div>
          {subline2 && <div className="text-white/85">{subline2}</div>}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/20 space-y-2">
        {visual}
        <p className="text-[11px] font-medium text-white/90 leading-snug">
          {explanation}
        </p>
      </div>
    </article>
  );
}

interface KpiTilesGridProps {
  telemetry: SolarTelemetry;
  overview: StationOverview | null;
  curveData: DailyCurvePoint[];
}

export function KpiTilesGrid({ telemetry, overview, curveData }: KpiTilesGridProps) {
  const capacityKwp = overview?.capacity && overview.capacity > 0 ? overview.capacity : 9;
  const pvKw = telemetry.pvPower ?? 0;
  const pvPct = Math.min(100, Math.round((pvKw / capacityKwp) * 100));

  // Sample up to 14 bars from today's solar curve for mini sparkline
  const sparkBars = (() => {
    if (!curveData || curveData.length === 0) {
      return [0.1, 0.2, 0.45, 0.7, 0.9, 1, 0.85, 0.65, 0.4, 0.2, 0.05];
    }
    const step = Math.max(1, Math.floor(curveData.length / 14));
    const sampled: number[] = [];
    for (let i = 0; i < curveData.length && sampled.length < 14; i += step) {
      sampled.push(Math.max(0, curveData[i].solar));
    }
    const maxS = Math.max(...sampled, 0.5);
    return sampled.map((v) => Math.max(0.08, v / maxS));
  })();

  // Battery tile data
  const soc = Math.max(0, Math.min(100, Math.round(telemetry.batterySoc ?? 0)));
  const reserve = telemetry.batteryMinSoc ?? 10;
  const batKw = telemetry.batteryPower ?? 0;
  const batState = telemetry.batteryState ?? 'idle';
  const batStateLabel =
    batState === 'full'
      ? 'Full · standby'
      : batState === 'charging' || batKw >= 0.05
        ? `Charging · ${Math.abs(batKw).toFixed(2)} kW`
        : batState === 'discharging' || batKw <= -0.05
          ? `Discharging · ${Math.abs(batKw).toFixed(2)} kW`
          : 'Idle · standby';

  const batChargeToday = telemetry.batteryChargeToday ?? 0;
  const batDischargeToday = telemetry.batteryDischargeToday ?? 0;

  // Grid tile data
  const gridKw = telemetry.gridPower ?? 0;
  const gridState = telemetry.gridState ?? 'idle';
  const gridStateLabel =
    Math.abs(gridKw) < 0.05 || gridState === 'idle'
      ? 'No exchange'
      : gridKw > 0 || gridState === 'exporting'
        ? 'Exporting'
        : 'Importing';
  const gridImportToday = telemetry.gridImportToday ?? 0;
  const gridExportToday = telemetry.gridExportToday ?? 0;
  const gridImportMonth = telemetry.gridImportMonth ?? 0;

  // Home Load tile data
  const loadKw = telemetry.loadPower ?? 0;
  const loadToday = telemetry.loadToday ?? 0;
  const gridImportNow = gridKw < -0.05 ? Math.abs(gridKw) : 0;
  const cleanSupplyPct =
    loadKw > 0.05
      ? Math.max(0, Math.min(100, Math.round(((loadKw - gridImportNow) / loadKw) * 100)))
      : 100;

  return (
    <section
      aria-label="Live power KPIs"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* 1. Solar PV */}
      <KpiTile
        title="Solar PV"
        gradient="var(--g-solar)"
        icon={<Sun className="w-4 h-4 text-white" aria-hidden="true" />}
        value={pvKw.toFixed(2)}
        unit="kW"
        badge={`${pvPct}% cap`}
        subline1={`${pvPct}% of ${capacityKwp.toFixed(1)} kWp capacity`}
        subline2={`Yield today ${(telemetry.yieldToday ?? 0).toFixed(1)} kWh`}
        explanation="Live solar power generated by your rooftop panels right now."
        visual={
          <div className="flex items-end gap-1 h-5" aria-hidden="true">
            {sparkBars.map((ratio, idx) => (
              <span
                key={idx}
                className="flex-1 rounded-xs bg-white/75"
                style={{ height: `${Math.round(ratio * 100)}%` }}
              />
            ))}
          </div>
        }
      />

      {/* 2. Battery */}
      <KpiTile
        id="battery"
        title="Battery"
        gradient="var(--g-battery)"
        icon={<BatteryCharging className="w-4 h-4 text-white" aria-hidden="true" />}
        value={`${soc}`}
        unit="%"
        badge={batStateLabel}
        subline1={`Charged ${batChargeToday.toFixed(1)} · Discharged ${batDischargeToday.toFixed(1)} kWh today`}
        subline2={`Backup reserve ${reserve}%`}
        explanation="Stored battery energy level and active charge or discharge rate."
        visual={
          <div className="relative h-2.5 w-full rounded-full bg-black/25 overflow-visible" aria-hidden="true">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${soc}%` }}
            />
            <span
              title={`Reserve ${reserve}%`}
              className="absolute -top-0.5 w-0.5 h-3.5 bg-amber-300"
              style={{ left: `${Math.min(98, Math.max(2, reserve))}%` }}
            />
          </div>
        }
      />

      {/* 3. Grid */}
      <KpiTile
        id="grid"
        title="Grid"
        gradient="var(--g-grid)"
        icon={<Zap className="w-4 h-4 text-white" aria-hidden="true" />}
        value={Math.abs(gridKw).toFixed(2)}
        unit="kW"
        badge={gridStateLabel}
        subline1={`Import ${gridImportToday.toFixed(1)} · Export ${gridExportToday.toFixed(1)} kWh today`}
        subline2={`Month import ${gridImportMonth.toFixed(1)} kWh`}
        explanation="Power bought from or sold to the utility grid right now."
      />

      {/* 4. Home Load */}
      <KpiTile
        title="Home Load"
        gradient="var(--g-load)"
        icon={<Home className="w-4 h-4 text-white" aria-hidden="true" />}
        value={loadKw.toFixed(2)}
        unit="kW"
        badge={`${cleanSupplyPct}% clean`}
        subline1={`${loadToday.toFixed(1)} kWh used today`}
        subline2={`${cleanSupplyPct}% powered by solar + battery now`}
        explanation="Total electricity your home appliances are drawing right now."
        visual={
          <div className="h-2.5 w-full rounded-full bg-black/25 overflow-hidden" aria-hidden="true">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${cleanSupplyPct}%` }}
            />
          </div>
        }
      />
    </section>
  );
}
