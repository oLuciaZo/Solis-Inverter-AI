'use client';

import React from 'react';
import { Layers, Gauge, Thermometer, Radio, CheckCircle2 } from 'lucide-react';
import { SolarTelemetry } from '../types/solis';

interface InverterStringTelemetryProps {
  telemetry: SolarTelemetry;
}

export const InverterStringTelemetry: React.FC<InverterStringTelemetryProps> = ({ telemetry }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* STRING DC MONITORING */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> MPPT DC String Telemetry
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">String Health & Voltage Balance</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Optimal MPPT Tracking</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {telemetry.strings.map((str, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-slate-200">{str.name}</span>
                <span className="text-xs font-mono font-bold text-amber-400">{str.power} W</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Voltage</span>
                  <span className="text-slate-200 font-mono font-semibold">{str.voltage} V</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current</span>
                  <span className="text-slate-200 font-mono font-semibold">{str.current} A</span>
                </div>
              </div>
              {/* Output progress */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (str.power / 4500) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INVERTER INTERNALS & ELECTRICAL PARAMETERS */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-1">
            <Gauge className="w-4 h-4" /> Inverter Diagnostics
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight mb-4">AC Grid & Operational State</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Inverter Operating Temp
              </span>
              <span className="font-semibold text-slate-200 font-mono">{telemetry.inverterTemp} °C</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-blue-400" /> Grid Frequency
              </span>
              <span className="font-semibold text-slate-200 font-mono">{telemetry.frequency} Hz</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Power Factor (cos φ)
              </span>
              <span className="font-semibold text-slate-200 font-mono">{telemetry.powerFactor}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Firmware Version: <strong>V2.0.3 Certified</strong></span>
          <span className="text-emerald-400 font-medium">Nominal Operating Range</span>
        </div>
      </div>
    </div>
  );
};
