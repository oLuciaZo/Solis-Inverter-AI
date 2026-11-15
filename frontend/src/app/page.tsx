'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/noc/Sidebar';
import { TopBar } from '../components/noc/TopBar';
import { GenerationOverviewCard } from '../components/noc/GenerationOverviewCard';
import { EnergySourceDonut } from '../components/noc/EnergySourceDonut';
import { KpiTilesGrid } from '../components/noc/KpiTile';
import { EnergyFlowDiagram } from '../components/noc/EnergyFlowDiagram';
import { SystemEventsTimeline } from '../components/noc/SystemEventsTimeline';
import { DeviceHealthTable } from '../components/noc/DeviceHealthTable';
import { AiAdvisorCard } from '../components/AiAdvisorCard';
import { McpModal } from '../components/McpModal';
import { SettingsModal } from '../components/SettingsModal';
import { SolarTelemetry, StationOverview, DailyCurvePoint } from '../types/solis';
import { Thermometer, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/solis';

// Default high-fidelity fallback state matching SolarTelemetry contract
const defaultTelemetry: SolarTelemetry = {
  timestamp: 0, // 0 = not fetched yet; avoids SSR/client hydration mismatch
  timeStr: '12:00:00',
  status: 'online',
  pvPower: 6.84,
  batteryPower: 2.15,
  batterySoc: 78,
  batterySoh: 99,
  batteryVoltage: 51.8,
  batteryCurrent: 41.5,
  gridPower: 1.85,
  loadPower: 2.84,
  gridState: 'exporting',
  batteryState: 'charging',
  inverterTemp: 42.1,
  frequency: 50.0,
  acVoltage: 230.4,
  acCurrent: 12.3,
  powerFactor: 0.99,
  powerFactorEstimated: false,
  strings: [
    { name: 'String 1 (East Array)', voltage: 374.5, current: 10.6, power: 3969 },
    { name: 'String 2 (West Array)', voltage: 368.2, current: 7.8, power: 2871 },
  ],
  yieldToday: 32.4,
  yieldMonth: 842.5,
  yieldYear: 6.84,
  yieldTotal: 24.92,
  batteryChargeToday: 11.2,
  batteryDischargeToday: 4.6,
  batteryMinSoc: 15,
  gridImportToday: 3.2,
  gridExportToday: 18.5,
  gridImportMonth: 47.1,
  gridExportMonth: 412.8,
  loadToday: 17.1,
  co2AvoidedToday: 21.06,
  treesPlantedEquivalent: 1.7,
  dataSource: 'mock',
};

const defaultOverview: StationOverview = {
  id: '1298491919448631809',
  stationName: 'Solaria Resident Smart Solar Hub',
  capacity: 10.0,
  capacityUnit: 'kWp',
  inverterCount: 1,
  inverterModel: 'Solis RHI-5K-48ES-5G (Hybrid)',
  serialNumber: '120B40198150131',
  status: 'online',
  address: 'Bangkok, Thailand',
  weather: {
    condition: 'Sunny / High Solar Irradiance',
    tempC: 33.0,
    humidity: 58,
    solarRadiation: 860,
  },
};

function formatTimeHms(ts?: number, fallbackTimeStr?: string): string {
  if (typeof ts !== 'number' || Number.isNaN(ts) || ts <= 0) {
    return fallbackTimeStr || '--:--:--';
  }
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return fallbackTimeStr || '--:--:--';
  return d.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function DashboardPage() {
  const [telemetry, setTelemetry] = useState<SolarTelemetry>(defaultTelemetry);
  const [overview, setOverview] = useState<StationOverview | null>(defaultOverview);
  const [curveData, setCurveData] = useState<DailyCurvePoint[]>([]);
  const [isMock, setIsMock] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const resOverview = await fetch(`${API_BASE}/overview`, { cache: 'no-store' });
      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }

      const resTelemetry = await fetch(`${API_BASE}/telemetry`, { cache: 'no-store' });
      if (resTelemetry.ok) {
        const data = await resTelemetry.json();
        setTelemetry(data);
      }

      const resCurve = await fetch(`${API_BASE}/curve`, { cache: 'no-store' });
      if (resCurve.ok) {
        const data = await resCurve.json();
        if (data?.points) {
          setCurveData(data.points);
        }
      }

      const resConfig = await fetch(`${API_BASE}/config`, { cache: 'no-store' });
      if (resConfig.ok) {
        const conf = await resConfig.json();
        setIsMock(Boolean(conf.mockMode));
      }
    } catch {
      // Backend not running yet or unreachable, generate realistic synthetic curve
      setCurveData((prev) => {
        if (prev.length > 0) return prev;
        const pts: DailyCurvePoint[] = [];
        for (let h = 5; h <= 21; h++) {
          for (let m = 0; m < 60; m += 15) {
            const timeVal = h + m / 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            let sol = 0;
            if (timeVal >= 6.0 && timeVal <= 18.5) {
              const g = Math.exp(-Math.pow(timeVal - 12.5, 2) / (2 * Math.pow(2.8, 2)));
              sol = parseFloat((8.2 * g).toFixed(2));
            }
            const ld = parseFloat(
              (1.1 + (timeVal >= 7 && timeVal <= 9 ? 1.8 : timeVal >= 18 ? 2.5 : 0.4)).toFixed(2)
            );
            const bat = sol > ld ? Math.min(sol - ld, 3.2) : -Math.min(ld - sol, 2.5);
            const grd = sol - ld - bat;
            pts.push({
              time: timeStr,
              solar: sol,
              load: ld,
              battery: parseFloat(bat.toFixed(2)),
              grid: parseFloat(grd.toFixed(2)),
            });
          }
        }
        return pts;
      });
    } finally {
      setIsRefreshing(false);
      setCountdown(10);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const id = setTimeout(() => {
      void fetchDashboardData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchDashboardData]);

  // Polling timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const handleSaveConfig = async () => {
    setIsMock(false);
    fetchDashboardData();
  };

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setMobileNavOpen((prev) => !prev);
    }
  };

  // Safe defaults for EnergyFlowDiagram & header chips
  const pvKw = telemetry.pvPower ?? 0;
  const loadKw = telemetry.loadPower ?? 0;
  const gridKw = telemetry.gridPower ?? 0;
  const batteryKw = telemetry.batteryPower ?? 0;
  const batterySoc = telemetry.batterySoc ?? 0;
  const batteryState =
    telemetry.batteryState ??
    (Math.abs(batteryKw) < 0.05
      ? batterySoc >= 95
        ? 'full'
        : 'idle'
      : batteryKw > 0
        ? 'charging'
        : 'discharging');
  const gridState =
    telemetry.gridState ??
    (Math.abs(gridKw) < 0.05 ? 'idle' : gridKw > 0 ? 'exporting' : 'importing');

  const loadToday = telemetry.loadToday ?? 0;
  const gridImportToday = telemetry.gridImportToday ?? 0;
  const selfSufficiencyPct =
    loadToday > 0
      ? Math.max(0, Math.min(100, Math.round(((loadToday - gridImportToday) / loadToday) * 100)))
      : pvKw > 0.05
        ? 100
        : 0;
  const inverterTemp = telemetry.inverterTemp ?? 0;
  const lastUpdatedStr = formatTimeHms(telemetry.timestamp, telemetry.timeStr);

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] selection:bg-[#f0418c]/20">
      <Sidebar
        activeId={activeNav}
        onSelect={setActiveNav}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          overview={overview}
          telemetry={telemetry}
          isMock={isMock}
          isRefreshing={isRefreshing}
          countdown={countdown}
          lastUpdatedStr={lastUpdatedStr}
          onToggleSidebar={handleToggleSidebar}
          onRefresh={fetchDashboardData}
          onOpenMcp={() => setIsMcpOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Row 1: Generation Overview (8 col) + Where today's energy came from Donut (4 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <GenerationOverviewCard
              telemetry={telemetry}
              overview={overview}
              curveData={curveData}
            />
            <EnergySourceDonut telemetry={telemetry} />
          </div>

          {/* Row 2: 4 Gradient KPI Tiles */}
          <KpiTilesGrid
            telemetry={telemetry}
            overview={overview}
            curveData={curveData}
          />

          {/* Row 3: Energy Flow (7 col) + System Events Timeline (5 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section
              id="energy-flow"
              aria-labelledby="energy-flow-heading"
              className="noc-card p-5 sm:p-6 lg:col-span-7 flex flex-col justify-between"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    Live Power Topology
                  </p>
                  <h2
                    id="energy-flow-heading"
                    className="text-base font-bold text-[var(--text)] mt-0.5"
                  >
                    Real-Time Energy Flow
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold num">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Self-sufficiency {selfSufficiencyPct}%
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold num ${
                      inverterTemp >= 60
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-[var(--bg)] text-[var(--text)] border-[var(--line)]'
                    }`}
                  >
                    <Thermometer className="w-3.5 h-3.5 text-[#f0418c]" aria-hidden="true" />
                    Inverter {inverterTemp.toFixed(1)} °C
                  </span>
                </div>
              </div>

              <EnergyFlowDiagram
                pvKw={pvKw}
                loadKw={loadKw}
                gridKw={gridKw}
                batteryKw={batteryKw}
                batterySoc={batterySoc}
                batteryState={batteryState}
                gridState={gridState}
              />
            </section>

            <SystemEventsTimeline telemetry={telemetry} />
          </div>

          {/* Row 4: Device Health & PV Strings Table (12 col) */}
          <DeviceHealthTable telemetry={telemetry} overview={overview} />

          {/* Row 5: AI Advisor Card (restyled, last) */}
          <AiAdvisorCard telemetry={telemetry} onOpenMcp={() => setIsMcpOpen(true)} />
        </main>
      </div>

      {/* Modals */}
      <McpModal isOpen={isMcpOpen} onClose={() => setIsMcpOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMock={isMock}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
