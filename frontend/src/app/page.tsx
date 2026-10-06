'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { EnergyFlowHero } from '../components/EnergyFlowHero';
import { MetricCards } from '../components/MetricCards';
import { DailyGenerationChart } from '../components/DailyGenerationChart';
import { InverterStringTelemetry } from '../components/InverterStringTelemetry';
import { AiAdvisorCard } from '../components/AiAdvisorCard';
import { McpModal } from '../components/McpModal';
import { SettingsModal } from '../components/SettingsModal';
import { SolarTelemetry, StationOverview, DailyCurvePoint } from '../types/solis';
import { ShieldAlert, Info } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api/solis';

// Default high-fidelity fallback state
const defaultTelemetry: SolarTelemetry = {
  timestamp: Date.now(),
  timeStr: new Date().toLocaleTimeString(),
  status: 'online',
  pvPower: 6.84,
  batteryPower: 2.15,
  batterySoc: 78,
  batterySoh: 99,
  batteryVoltage: 51.8,
  batteryCurrent: 41.5,
  gridPower: 1.85,
  loadPower: 2.84,
  inverterTemp: 42.1,
  frequency: 50.0,
  powerFactor: 0.99,
  strings: [
    { name: 'String 1 (East Array)', voltage: 374.5, current: 10.6, power: 3969 },
    { name: 'String 2 (West Array)', voltage: 368.2, current: 7.8, power: 2871 },
  ],
  yieldToday: 32.4,
  yieldMonth: 842.5,
  yieldYear: 6.84,
  yieldTotal: 24.92,
  gridImportToday: 3.2,
  gridExportToday: 18.5,
  loadToday: 17.1,
  co2AvoidedToday: 21.06,
  treesPlantedEquivalent: 1.7,
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

export default function DashboardPage() {
  const [telemetry, setTelemetry] = useState<SolarTelemetry>(defaultTelemetry);
  const [overview, setOverview] = useState<StationOverview | null>(defaultOverview);
  const [curveData, setCurveData] = useState<DailyCurvePoint[]>([]);
  const [isMock, setIsMock] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch overview
      const resOverview = await fetch(`${API_BASE}/overview`, { cache: 'no-store' });
      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }

      // 2. Fetch live telemetry
      const resTelemetry = await fetch(`${API_BASE}/telemetry`, { cache: 'no-store' });
      if (resTelemetry.ok) {
        const data = await resTelemetry.json();
        setTelemetry(data);
      }

      // 3. Fetch daily curve
      const resCurve = await fetch(`${API_BASE}/curve`, { cache: 'no-store' });
      if (resCurve.ok) {
        const data = await resCurve.json();
        if (data?.points) {
          setCurveData(data.points);
        }
      }

      // 4. Check config
      const resConfig = await fetch(`${API_BASE}/config`, { cache: 'no-store' });
      if (resConfig.ok) {
        const conf = await resConfig.json();
        setIsMock(conf.mockMode);
      }
    } catch {
      // Backend not running yet or unreachable, generate realistic synthetic curve
      if (curveData.length === 0) {
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
            const ld = parseFloat((1.1 + (timeVal >= 7 && timeVal <= 9 ? 1.8 : timeVal >= 18 ? 2.5 : 0.4)).toFixed(2));
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
        setCurveData(pts);
      }
    } finally {
      setIsRefreshing(false);
      setCountdown(10);
    }
  }, [curveData.length]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
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

  const handleSaveConfig = async (config: {
    keyId: string;
    secret: string;
    stationId: string;
    inverterSn: string;
  }) => {
    // In local development, trigger refresh with updated state
    setIsMock(false);
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen text-slate-100 pb-16 selection:bg-amber-500/30">
      {/* Top Navigation & Status Bar */}
      <Header
        overview={overview}
        isMock={isMock}
        onRefresh={fetchDashboardData}
        isRefreshing={isRefreshing}
        onOpenMcp={() => setIsMcpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        countdown={countdown}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Dynamic AI Advisor Bar */}
        <AiAdvisorCard telemetry={telemetry} onOpenMcp={() => setIsMcpOpen(true)} />

        {/* Centerpiece: Real-Time Dynamic Energy Flow */}
        <EnergyFlowHero telemetry={telemetry} />

        {/* Key Metrics Cards */}
        <MetricCards telemetry={telemetry} />

        {/* 24h Generation & Load Curve */}
        <DailyGenerationChart curveData={curveData} />

        {/* Inverter String DC Telemetry & Diagnostics */}
        <InverterStringTelemetry telemetry={telemetry} />
      </main>

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
