'use client';

import React from 'react';
import { Bot, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { SolarTelemetry } from '../types/solis';

interface AiAdvisorCardProps {
  telemetry: SolarTelemetry;
  onOpenMcp: () => void;
}

export const AiAdvisorCard: React.FC<AiAdvisorCardProps> = ({ telemetry, onOpenMcp }) => {
  const { pvPower, batterySoc, loadPower, gridPower } = telemetry;

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
      1
    )} kW back to the utility grid, generating feed-in revenue.`;
    recommendation =
      'Consider pre-cooling your home or heating water tanks to maximize self-consumption value.';
  }

  return (
    <section
      aria-labelledby="ai-advisor-heading"
      className="noc-card p-5 sm:p-6 border-l-4 border-l-[#f0418c]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
            style={{ background: 'var(--g-logo)' }}
          >
            <Bot className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#f0418c] inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> AI Solar Advisor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                MCP Connected
              </span>
            </div>
            <h2 id="ai-advisor-heading" className="text-base font-bold text-[var(--text)] mt-0.5">
              {title}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
            <div className="inline-flex items-center gap-2 mt-2.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>
                <strong>Recommendation:</strong> {recommendation}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMcp}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#f0418c] hover:bg-[#d9337a] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Ask Solis MCP in Claude</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
