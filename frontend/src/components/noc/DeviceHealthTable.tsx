'use client';

import React from 'react';
import { SolarTelemetry, StationOverview } from '../../types/solis';
import { buildHealthRows, HealthStatus } from '../../lib/health';

interface DeviceHealthTableProps {
  telemetry: SolarTelemetry;
  overview: StationOverview | null;
}

const STATUS_PILL: Record<HealthStatus, { label: string; className: string }> = {
  OK: {
    label: 'OK',
    className: 'bg-[#22c55e]/15 text-[#15803d] border-[#22c55e]/30',
  },
  WARN: {
    label: 'WARN',
    className: 'bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/35',
  },
  ALARM: {
    label: 'ALARM',
    className: 'bg-[#ef4444]/15 text-[#b91c1c] border-[#ef4444]/35',
  },
  'N/A': {
    label: 'N/A',
    className: 'bg-[#94a3b8]/15 text-[#475569] border-[#94a3b8]/30',
  },
};

export function DeviceHealthTable({ telemetry, overview }: DeviceHealthTableProps) {
  const rows = buildHealthRows(telemetry);
  const firstPvIndex = rows.findIndex((r) => r.group === 'pv');

  return (
    <section
      id="health"
      aria-labelledby="health-heading"
      className="noc-card overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            NOC Diagnostics &amp; PV Strings
          </p>
          <h2 id="health-heading" className="text-base font-bold text-[var(--text)] mt-0.5">
            Device Health &amp; Parameter Thresholds
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          {overview?.inverterModel && (
            <span className="px-2.5 py-1 rounded-md bg-[var(--bg)] border border-[var(--line)] font-medium text-[var(--text)]">
              {overview.inverterModel}
            </span>
          )}
          {overview?.serialNumber && (
            <span className="px-2.5 py-1 rounded-md bg-[var(--bg)] border border-[var(--line)] num">
              SN: {overview.serialNumber}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal scroll inside card on small screens, never page overflow */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <thead>
            <tr className="bg-[var(--table-head)] text-white text-xs font-semibold uppercase tracking-wider">
              <th scope="col" className="py-3 px-5">
                Parameter
              </th>
              <th scope="col" className="py-3 px-4">
                Value
              </th>
              <th scope="col" className="py-3 px-4">
                Normal range
              </th>
              <th scope="col" className="py-3 px-4">
                What it means
              </th>
              <th scope="col" className="py-3 px-5 text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-sm">
            {rows.map((row, index) => {
              const pill = STATUS_PILL[row.status];
              const isFirstPv = index === firstPvIndex;
              return (
                <tr
                  key={row.id}
                  id={isFirstPv ? 'pv-strings' : undefined}
                  className="hover:bg-[var(--bg)]/50 transition-colors"
                >
                  <td className="py-3.5 px-5 font-semibold text-[var(--text)] whitespace-nowrap">
                    {row.parameter}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text)] num whitespace-nowrap">
                    {row.value}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[var(--muted)] num whitespace-nowrap">
                    {row.normalRange}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[var(--muted)] max-w-md">
                    {row.meaning}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center min-w-[58px] px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pill.className}`}
                    >
                      {pill.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
