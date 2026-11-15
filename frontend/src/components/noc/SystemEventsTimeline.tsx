'use client';

import React from 'react';
import {
  BatteryCharging,
  Zap,
  Sun,
  Thermometer,
  Info,
} from 'lucide-react';
import { SolarTelemetry } from '../../types/solis';
import { deriveEvents, EventTone, SystemEvent } from '../../lib/events';

interface SystemEventsTimelineProps {
  telemetry: SolarTelemetry;
}

const TONE_BADGE_CLASS: Record<EventTone, string> = {
  ok: 'bg-[#22c55e] text-white',
  warn: 'bg-[#f59e0b] text-white',
  alarm: 'bg-[#ef4444] text-white',
  info: 'bg-[#8e5fd6] text-white',
  na: 'bg-[#94a3b8] text-white',
};

function getCategoryIcon(category: SystemEvent['category']) {
  switch (category) {
    case 'battery':
      return <BatteryCharging className="w-4 h-4" aria-hidden="true" />;
    case 'grid':
      return <Zap className="w-4 h-4" aria-hidden="true" />;
    case 'solar':
      return <Sun className="w-4 h-4" aria-hidden="true" />;
    case 'inverter':
      return <Thermometer className="w-4 h-4" aria-hidden="true" />;
    default:
      return <Info className="w-4 h-4" aria-hidden="true" />;
  }
}

export function SystemEventsTimeline({ telemetry }: SystemEventsTimelineProps) {
  const events = deriveEvents(telemetry);

  return (
    <section
      id="events"
      aria-labelledby="events-heading"
      className="noc-card p-5 sm:p-6 flex flex-col lg:col-span-5"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            System Events
          </p>
          <h2 id="events-heading" className="text-base font-bold text-[var(--text)] mt-0.5">
            Recent Activities
          </h2>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] num">
          {events.length} active
        </span>
      </div>

      <ol className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--line)]">
        {events.map((ev) => (
          <li key={ev.id} className="relative flex items-start gap-3.5 pl-0">
            <span
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs ${TONE_BADGE_CLASS[ev.tone]}`}
            >
              {getCategoryIcon(ev.category)}
            </span>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text)] leading-snug">
                  {ev.title}
                </p>
                <span className="text-[11px] font-medium text-[var(--muted)] shrink-0 num">
                  {ev.relativeTime}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
                {ev.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
