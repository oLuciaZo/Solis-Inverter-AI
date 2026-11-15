export type FlowState = 'importing' | 'exporting' | 'idle';
export type BatteryState = 'charging' | 'discharging' | 'idle' | 'full';

const IDLE_THRESHOLD_KW = 0.05;
const FULL_SOC_THRESHOLD = 95;

/**
 * Safely converts an unknown value to a finite number (NaN/Infinity/null/undefined -> 0).
 */
export function num(v: unknown): number {
  if (v === null || v === undefined || v === '') {
    return 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converts a power value to kW using its sibling unit string (W, kW, MW).
 * Unknown or empty unit strings are assumed to already be in kW.
 */
export function toKw(value: unknown, unitStr?: string | null): number {
  const n = num(value);
  const unit = (unitStr ?? '').trim().toLowerCase();
  if (unit === 'w') return n / 1000;
  if (unit === 'mw') return n * 1000;
  return n;
}

/**
 * Converts an energy value to kWh using its sibling unit string (Wh, kWh, MWh).
 * Unknown or empty unit strings are assumed to already be in kWh.
 */
export function toKwh(value: unknown, unitStr?: string | null): number {
  const n = num(value);
  const unit = (unitStr ?? '').trim().toLowerCase();
  if (unit === 'wh') return n / 1000;
  if (unit === 'mwh') return n * 1000;
  return n;
}

/**
 * Derives grid flow state from signed gridPower (kW): >0 exporting, <0 importing, |x|<0.05 idle.
 */
export function deriveGridState(gridPowerKw: number): FlowState {
  if (Math.abs(gridPowerKw) < IDLE_THRESHOLD_KW) {
    return 'idle';
  }
  return gridPowerKw > 0 ? 'exporting' : 'importing';
}

/**
 * Derives battery state from signed batteryPower (kW) and SOC (%):
 * >0 charging, <0 discharging, |x|<0.05 idle (or 'full' when SOC >= 95).
 */
export function deriveBatteryState(batteryPowerKw: number, batterySoc: number): BatteryState {
  if (Math.abs(batteryPowerKw) < IDLE_THRESHOLD_KW) {
    return batterySoc >= FULL_SOC_THRESHOLD ? 'full' : 'idle';
  }
  return batteryPowerKw > 0 ? 'charging' : 'discharging';
}
