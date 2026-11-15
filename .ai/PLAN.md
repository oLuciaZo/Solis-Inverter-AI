# PLAN — NOC Monitor redesign (Lector-style theme)

## Goals
1. Re-theme the Next.js dashboard to the reference "Lector" admin layout: light lavender page, white sidebar
   with gradient logo block, white top bar, white rounded cards, colourful gradient KPI tiles, donut card,
   timeline card, dark-header table with status pills.
2. Fix grid / battery data (see `.ai/research/solis-fields.md`): correct today/month energies, real SOH,
   PF "N/A" when not reported, unit conversion from `*Str` fields, explicit state enums.
3. Make every value NOC-readable: each metric has a plain-language caption, a normal range and an
   OK / WARN / ALARM / N/A status.
4. Animated energy-flow diagram (moving particles whose direction follows power sign and speed follows kW).

## Architecture
- Backend `backend/src/solis/solis.service.ts` maps SolisCloud → `SolarTelemetry` (single source of truth).
  Mock service produces the same shape.
- Frontend `frontend/src/app/page.tsx` (container: fetch + polling, unchanged API routes) →
  presentational components in `frontend/src/components/noc/`.
- Health thresholds live in `frontend/src/lib/health.ts` (pure functions, unit-tested if a runner exists).

## Data contract additions (`frontend/src/types/solis.ts`, mirrored by backend)
```ts
type FlowState = 'importing' | 'exporting' | 'idle';            // grid
type BatteryState = 'charging' | 'discharging' | 'idle' | 'full';
interface SolarTelemetry {            // existing fields kept
  gridState: FlowState;
  batteryState: BatteryState;
  batteryChargeToday: number;     // kWh
  batteryDischargeToday: number;  // kWh
  batteryMinSoc: number | null;   // % reserve (socDischargeSet)
  gridImportMonth: number;        // kWh
  gridExportMonth: number;        // kWh
  acVoltage: number | null;       // V  (uAc1 / gridVoltageA)
  acCurrent: number | null;       // A  (iAc1)
  powerFactor: number | null;     // null = not reported
  powerFactorEstimated: boolean;
  dataSource: 'live' | 'mock';
}
```
Sign rules: gridPower > 0 export, < 0 import. batteryPower > 0 charging, < 0 discharging. |x| < 0.05 kW = idle.
batteryState 'full' when idle and SOC ≥ 95.

## Design spec
- Fonts (next/font/google): Poppins 400/500/600/700 for UI, JetBrains Mono for numeric readouts (tabular-nums).
- Tokens on `:root` in globals.css: --bg #f6eef6, --surface #fff, --text #2b2f3a, --muted #8a8fa3,
  --line #eef0f5, --table-head #2f3546, radius 6px cards / 10px tiles, soft shadow 0 2px 10px rgb(80 60 120 / .06).
  Semantic gradients: --g-solar #ffb330→#ff7a45, --g-battery #8e5fd6→#5b3fc4, --g-grid #43c6f0→#5a8be8,
  --g-load #f0418c→#c54db5, logo #f0418c→#9b59d0. Status: ok #22c55e, warn #f59e0b, alarm #ef4444, na #94a3b8.
- Layout: sidebar 220px (collapsible via hamburger; drawer < 1024px) with anchor nav
  (Overview, Energy Flow, Battery, Grid, PV Strings, Health, Events) active item pink with left bar.
  Top bar: hamburger, station name, Online/Offline/Alarm pill, LIVE/MOCK badge, "updated Ns ago", refresh, MCP, settings.
- Row 1: Generation Overview card (8 col: yield today big number, PV now, 24h smooth area chart, strip of 4
  mini-stats: month yield, lifetime, CO₂ avoided, self-sufficiency today) | "Where today's energy came from"
  donut (4 col: solar-direct / battery / grid share of today's load, big % numbers under it).
- Row 2: 4 gradient KPI tiles: Solar PV, Battery, Grid, Home Load — value, state text, today numbers,
  1-line plain explanation, small sparkline/bar.
- Row 3: Energy Flow card (7 col, `EnergyFlowDiagram`) | System Events timeline (5 col, derived from state).
- Row 4: Device Health table (dark header): Parameter | Value | Normal range | What it means | Status pill.
  Rows: inverter temp, grid freq, AC voltage, battery SOC vs reserve, SOH, battery voltage, PF, each PV string
  (V/A/W) + string mismatch. AI advisor card kept, restyled, last.
- Motion: CSS/SVG only, transform/opacity/offset-distance; honour prefers-reduced-motion. Responsive 320→1920.

## Milestones
### M1 — Data + theme + animation
- T01: Backend telemetry mapping fixes + types + mock parity
- T02: Animated EnergyFlowDiagram component
- T03: Lector theme shell, page layout and NOC components (uses T01 types + T02)
### M2 — Review
- T04: Review M1 diff — SKIPPED (user closed the milestone without review)
### M3 — Follow-ups from live check
- T05: Signed battery/grid series + battery SOC % line in the 24h chart
- T06: PV curtailment event in the system timeline (done by Claude directly)
