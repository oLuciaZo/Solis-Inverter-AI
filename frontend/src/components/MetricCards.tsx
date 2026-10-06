'use client';

import React from 'react';
import { Sun, Battery, ArrowDownLeft, ArrowUpRight, Leaf, Trees, Activity } from 'lucide-react';
import { SolarTelemetry } from '../types/solis';

interface MetricCardsProps {
  telemetry: SolarTelemetry;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ telemetry }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* CARD 1: SOLAR YIELD */}
      <div className="glass-panel rounded-2xl p-5 hover:border-amber-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Solar Generation</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{telemetry.yieldToday.toFixed(1)}</span>
          <span className="text-sm font-semibold text-amber-400">kWh Today</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>Month: <strong className="text-slate-200">{telemetry.yieldMonth.toFixed(0)} kWh</strong></span>
          <span>Lifetime: <strong className="text-slate-200">{telemetry.yieldTotal.toFixed(1)} MWh</strong></span>
        </div>
      </div>

      {/* CARD 2: BATTERY STORAGE */}
      <div className="glass-panel rounded-2xl p-5 hover:border-emerald-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Battery Health & SOC</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <Battery className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{telemetry.batterySoc}%</span>
          <span className="text-xs font-semibold text-slate-400">State of Charge</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>SOH: <strong className="text-emerald-400">{telemetry.batterySoh}%</strong></span>
          <span>Current: <strong className="text-slate-200">{telemetry.batteryCurrent} A</strong></span>
        </div>
      </div>

      {/* CARD 3: GRID IMPORT & EXPORT */}
      <div className="glass-panel rounded-2xl p-5 hover:border-cyan-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grid Interaction</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">{telemetry.gridExportToday.toFixed(1)}</span>
          <span className="text-sm font-semibold text-cyan-400">kWh Export</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
            Import: <strong>{telemetry.gridImportToday.toFixed(1)} kWh</strong>
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Net Yield +
          </span>
        </div>
      </div>

      {/* CARD 4: ECO IMPACT */}
      <div className="glass-panel rounded-2xl p-5 hover:border-green-500/40 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environmental Offset</span>
          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
            <Leaf className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{telemetry.co2AvoidedToday}</span>
          <span className="text-sm font-semibold text-green-400">kg CO₂</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <Trees className="w-4 h-4 text-emerald-400" />
          <span>Equivalent to <strong className="text-emerald-300">{telemetry.treesPlantedEquivalent} trees</strong> planted</span>
        </div>
      </div>
    </div>
  );
};
