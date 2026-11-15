'use client';

import React from 'react';
import { Menu, RefreshCw, Cpu, Settings } from 'lucide-react';
import { StationOverview, SolarTelemetry } from '../../types/solis';

interface TopBarProps {
  overview: StationOverview | null;
  telemetry: SolarTelemetry;
  isMock: boolean;
  isRefreshing: boolean;
  countdown: number;
  lastUpdatedStr: string;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  onOpenMcp: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  overview,
  telemetry,
  isMock,
  isRefreshing,
  countdown,
  lastUpdatedStr,
  onToggleSidebar,
  onRefresh,
  onOpenMcp,
  onOpenSettings,
}: TopBarProps) {
  const status = overview?.status ?? telemetry.status ?? 'online';
  const effectiveMock =
    telemetry.dataSource !== undefined ? telemetry.dataSource === 'mock' : isMock;

  const statusConfig = {
    online: {
      label: 'Online',
      dot: 'bg-[#22c55e]',
      pill: 'bg-[#22c55e]/12 text-[#15803d] border-[#22c55e]/30',
    },
    offline: {
      label: 'Offline',
      dot: 'bg-[#94a3b8]',
      pill: 'bg-[#94a3b8]/15 text-[#475569] border-[#94a3b8]/30',
    },
    alarm: {
      label: 'Alarm',
      dot: 'bg-[#ef4444]',
      pill: 'bg-[#ef4444]/12 text-[#b91c1c] border-[#ef4444]/30',
    },
  }[status];

  return (
    <header className="h-16 shrink-0 bg-[var(--surface)] border-b border-[var(--line)] px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Left: Hamburger + Station Name + Status + LIVE/MOCK */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="p-2 rounded-md text-[var(--text)] hover:bg-[var(--bg)] transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex items-center gap-2.5 flex-wrap">
          <h1 className="text-sm sm:text-base font-semibold text-[var(--text)] truncate">
            {overview?.stationName ?? 'Solis NOC Monitor'}
          </h1>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              effectiveMock
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {effectiveMock ? 'MOCK' : 'LIVE'}
          </span>
        </div>
      </div>

      {/* Right: Updated timestamp + Refresh + MCP + Settings */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden md:inline-block text-xs text-[var(--muted)] num mr-1">
          Updated {lastUpdatedStr} · next in {countdown}s
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh telemetry now"
          title="Refresh telemetry"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)] active:scale-[0.98] transition-colors disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#f0418c] ${isRefreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          type="button"
          onClick={onOpenMcp}
          aria-label="Open MCP AI Connector"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#f0418c] hover:bg-[#d9337a] active:scale-[0.98] transition-colors shadow-xs"
        >
          <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">MCP</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open SolisCloud settings"
          title="Settings"
          className="p-2 rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
