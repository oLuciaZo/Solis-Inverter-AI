'use client';

import React from 'react';
import { Bot, Sparkles, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { SolarTelemetry } from '../types/solis';

interface AiAdvisorCardProps {
  telemetry: SolarTelemetry;
  onOpenMcp: () => void;
}

export const AiAdvisorCard: React.FC<AiAdvisorCardProps> = ({ telemetry, onOpenMcp }) => {
  const { pvPower, batteryPower, batterySoc, loadPower, gridPower } = telemetry;

  // Generate dynamic AI insight based on solar conditions
  let title = 'Solar Peak Utilization Active';
  let description =
    'Solar output is exceeding current household demand. Surplus generation is actively charging your energy storage battery to ensure evening energy independence.';
  let recommendation = 'Optimal time for heavy appliance usage (dishwasher, laundry, EV charging).';

  if (pvPower < 0.5 && batterySoc > 30) {
    title = 'Night Battery Discharge Active';
    description =
      'Home consumption is being powered seamlessly by stored solar battery reserves, avoiding peak utility grid tariffs.';
    recommendation = `Estimated battery runtime remaining: ~${(
      (batterySoc * 0.15) /
      Math.max(0.5, loadPower)
    ).toFixed(1)} hours.`;
  } else if (gridPower > 2.0) {
    title = 'High Grid Feed-In Export';
    description = `Your system is exporting ${gridPower.toFixed(
      1,
    )} kW back to the utility grid, generating feed-in revenue.`;
    recommendation = 'Consider pre-cooling your home or heating water tanks to maximize self-consumption value.';
  }

  return (
    <div className="relative overflow-hidden glass-panel rounded-2xl p-6 mb-6 border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-blue-950/30 shadow-xl shadow-purple-950/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30">
            <Bot className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Solar Advisor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Gemini 3.1 Pro & 3.8 Flash Powered
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">{title}</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 w-fit">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Recommendation:</strong> {recommendation}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenMcp}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <span>Ask Solis MCP in Claude</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
