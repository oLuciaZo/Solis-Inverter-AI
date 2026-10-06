'use client';

import React from 'react';
import { Sun, RefreshCw, Cpu, Settings, CloudSun, ShieldCheck } from 'lucide-react';
import { StationOverview } from '../types/solis';

interface HeaderProps {
  overview: StationOverview | null;
  isMock: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenMcp: () => void;
  onOpenSettings: () => void;
  countdown: number;
}

export const Header: React.FC<HeaderProps> = ({
  overview,
  isMock,
  onRefresh,
  isRefreshing,
  onOpenMcp,
  onOpenSettings,
  countdown,
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Station Info */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40">
            <Sun className="w-6 h-6 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                SOLIS<span className="text-white font-medium">·AI PLATFORM</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                V2.0.3 API
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-300 font-medium">
                {overview?.stationName || 'Solar Energy Hub'}
              </span>
              <span>•</span>
              <span className="text-slate-400">{overview?.inverterModel || 'Hybrid Inverter'}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">{overview?.serialNumber || 'SN: Live'}</span>
            </div>
          </div>
        </div>

        {/* Center Status Badge & Weather */}
        <div className="flex items-center gap-3">
          {overview?.weather && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span>{overview.weather.tempC}°C</span>
              <span className="text-slate-500">|</span>
              <span>{overview.weather.solarRadiation} W/m²</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isMock
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMock ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400 animate-ping'
              }`}
            />
            <span>{isMock ? 'High-Fidelity Simulation' : 'Live SolisCloud Connected'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenMcp}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm shadow-purple-500/10"
            title="Configure Claude Desktop & Cursor MCP Connector"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>MCP AI Connector</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/70 transition-all disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{countdown}s</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition-all"
            title="API Settings & Credentials"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
