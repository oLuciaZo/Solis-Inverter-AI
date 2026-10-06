'use client';

import React from 'react';
import { Sun, BatteryCharging, Battery, Home, Zap, ArrowDown, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react';
import { SolarTelemetry } from '../types/solis';

interface EnergyFlowHeroProps {
  telemetry: SolarTelemetry;
}

export const EnergyFlowHero: React.FC<EnergyFlowHeroProps> = ({ telemetry }) => {
  const {
    pvPower,
    batteryPower,
    batterySoc,
    batterySoh,
    gridPower,
    loadPower,
    inverterTemp,
    frequency,
    yieldToday,
  } = telemetry;

  const isBatteryCharging = batteryPower > 0.05;
  const isBatteryDischarging = batteryPower < -0.05;
  const isGridExporting = gridPower > 0.05;
  const isGridImporting = gridPower < -0.05;
  const isSolarGenerating = pvPower > 0.05;

  // Self sufficiency percentage calculation
  const selfSufficiency =
    loadPower > 0
      ? Math.min(100, Math.round(((pvPower + (isBatteryDischarging ? Math.abs(batteryPower) : 0)) / loadPower) * 100))
      : 100;

  return (
    <div className="relative glass-panel rounded-3xl p-6 lg:p-8 overflow-hidden mb-6 border border-slate-700/60 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Self Sufficiency pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Real-Time Power Distribution
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Dynamic Energy Flow
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-right">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Self-Sufficiency</div>
            <div className="text-lg font-bold text-emerald-400">{selfSufficiency}%</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-right">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Inverter Temp</div>
            <div className="text-lg font-bold text-amber-300">{inverterTemp}°C</div>
          </div>
        </div>
      </div>

      {/* Energy Diagram Grid */}
      <div className="relative z-10 max-w-4xl mx-auto py-4">
        {/* TOP: SOLAR PV ARRAY */}
        <div className="flex justify-center mb-6">
          <div className="group relative flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-slate-900/80 border border-amber-500/30 shadow-lg shadow-amber-500/10 transition-all hover:border-amber-400/60 min-w-[220px]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 shadow-inner border border-amber-500/30 group-hover:scale-105 transition-transform">
              <Sun className="w-7 h-7 stroke-[2.2] animate-[spin_25s_linear_infinite]" />
            </div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Solar PV Array</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight my-0.5">
              {pvPower.toFixed(2)} <span className="text-sm font-semibold text-amber-400/80">kW</span>
            </div>
            <span className="text-[11px] text-slate-400">Today: {yieldToday.toFixed(1)} kWh</span>
          </div>
        </div>

        {/* MIDDLE ROW: GRID (LEFT) <---> INVERTER (CENTER) <---> LOAD (RIGHT) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-4">
          {/* GRID NODE (LEFT) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[220px] p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-cyan-500/15 to-slate-900/80 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 border border-cyan-500/30">
                <Zap className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">National Grid</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight my-0.5">
                {Math.abs(gridPower).toFixed(2)} <span className="text-sm font-semibold text-cyan-400/80">kW</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                {isGridExporting && (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <ArrowLeft className="w-3 h-3" /> Exporting
                  </span>
                )}
                {isGridImporting && (
                  <span className="text-cyan-400 flex items-center gap-0.5">
                    <ArrowRight className="w-3 h-3" /> Importing
                  </span>
                )}
                {!isGridExporting && !isGridImporting && (
                  <span className="text-slate-400">Balanced (0.00 kW)</span>
                )}
              </div>
            </div>
          </div>

          {/* INVERTER NODE (CENTER) */}
          <div className="flex flex-col items-center">
            <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-950 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20 text-center w-full max-w-[240px]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase shadow">
                Solis Hybrid
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1 uppercase">Inverter Hub</div>
              <div className="text-3xl font-black text-white tracking-tight my-1">
                {(pvPower + Math.max(0, -batteryPower) + Math.max(0, -gridPower)).toFixed(2)}
                <span className="text-sm font-medium text-slate-400 ml-1">kW</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <div>
                  <span className="block text-slate-500">Grid Freq</span>
                  <span className="font-semibold text-slate-200">{frequency} Hz</span>
                </div>
                <div>
                  <span className="block text-slate-500">Efficiency</span>
                  <span className="font-semibold text-emerald-400">98.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* HOME CONSUMPTION (RIGHT) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[220px] p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-500/15 to-slate-900/80 border border-purple-500/30 shadow-lg shadow-purple-500/10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 border border-purple-500/30">
                <Home className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Home Load</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 tracking-tight my-0.5">
                {loadPower.toFixed(2)} <span className="text-sm font-semibold text-purple-400/80">kW</span>
              </div>
              <span className="text-[11px] text-slate-400">Daily: {telemetry.loadToday.toFixed(1)} kWh</span>
            </div>
          </div>
        </div>

        {/* BOTTOM: BATTERY STORAGE */}
        <div className="flex justify-center mt-6">
          <div className="w-full max-w-[240px] p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-500/15 to-slate-900/80 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/30">
              {isBatteryCharging ? (
                <BatteryCharging className="w-7 h-7 stroke-[2.2] animate-bounce" />
              ) : (
                <Battery className="w-7 h-7 stroke-[2.2]" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Battery Storage</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight my-0.5">
              {batterySoc}% <span className="text-xs font-normal text-slate-400">SOC</span>
            </div>

            {/* Battery state of charge progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 my-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, batterySoc))}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-[11px] text-slate-400 px-1">
              <span>{Math.abs(batteryPower).toFixed(2)} kW</span>
              <span className="font-semibold text-emerald-400">
                {isBatteryCharging ? 'Charging' : isBatteryDischarging ? 'Discharging' : 'Idle'}
              </span>
              <span>{telemetry.batteryVoltage} V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
