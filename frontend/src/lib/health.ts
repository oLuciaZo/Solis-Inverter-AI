import { SolarTelemetry } from '../types/solis';

export type HealthStatus = 'OK' | 'WARN' | 'ALARM' | 'N/A';

export interface HealthRow {
  id: string;
  parameter: string;
  value: string;
  normalRange: string;
  meaning: string;
  status: HealthStatus;
  group: 'inverter' | 'grid' | 'battery' | 'pv';
}

export const THRESHOLDS = {
  INVERTER_TEMP_OK_MAX: 60,
  INVERTER_TEMP_WARN_MAX: 75,
  GRID_FREQ_OK_MIN: 49.5,
  GRID_FREQ_OK_MAX: 50.5,
  GRID_FREQ_WARN_MIN: 49.0,
  GRID_FREQ_WARN_MAX: 51.0,
  AC_VOLTAGE_OK_MIN: 207,
  AC_VOLTAGE_OK_MAX: 253,
  AC_VOLTAGE_WARN_MIN: 195,
  AC_VOLTAGE_WARN_MAX: 265,
  BATTERY_RESERVE_DEFAULT: 10,
  BATTERY_SOC_OK_BUFFER: 5,
  BATTERY_SOH_OK_MIN: 80,
  BATTERY_SOH_WARN_MIN: 70,
  BATTERY_VOLTAGE_OK_MIN: 48,
  BATTERY_VOLTAGE_OK_MAX: 58.4,
  BATTERY_VOLTAGE_WARN_MIN: 46,
  BATTERY_VOLTAGE_WARN_MAX: 60,
  PF_OK_MIN: 0.9,
  STRING_MISMATCH_OK_MAX: 10,
  STRING_MISMATCH_WARN_MAX: 20,
  STRING_ACTIVE_MIN_WATTS: 100,
} as const;

export function buildHealthRows(telemetry: SolarTelemetry): HealthRow[] {
  const rows: HealthRow[] = [];

  // 1. Inverter Temperature
  const temp = telemetry.inverterTemp ?? 0;
  const tempStatus: HealthStatus =
    temp < THRESHOLDS.INVERTER_TEMP_OK_MAX
      ? 'OK'
      : temp < THRESHOLDS.INVERTER_TEMP_WARN_MAX
        ? 'WARN'
        : 'ALARM';
  rows.push({
    id: 'inverter-temp',
    parameter: 'Inverter Temperature',
    value: `${temp.toFixed(1)} °C`,
    normalRange: `< ${THRESHOLDS.INVERTER_TEMP_OK_MAX} °C`,
    meaning: 'Internal heatsink temperature; high heat reduces efficiency or triggers derating.',
    status: tempStatus,
    group: 'inverter',
  });

  // 2. Grid Frequency
  const freq = telemetry.frequency ?? 50;
  const freqStatus: HealthStatus =
    freq >= THRESHOLDS.GRID_FREQ_OK_MIN && freq <= THRESHOLDS.GRID_FREQ_OK_MAX
      ? 'OK'
      : freq >= THRESHOLDS.GRID_FREQ_WARN_MIN && freq <= THRESHOLDS.GRID_FREQ_WARN_MAX
        ? 'WARN'
        : 'ALARM';
  rows.push({
    id: 'grid-freq',
    parameter: 'Grid Frequency',
    value: `${freq.toFixed(2)} Hz`,
    normalRange: `${THRESHOLDS.GRID_FREQ_OK_MIN} – ${THRESHOLDS.GRID_FREQ_OK_MAX} Hz`,
    meaning: 'Utility AC grid frequency; out-of-range frequency disconnects the inverter.',
    status: freqStatus,
    group: 'grid',
  });

  // 3. AC Voltage
  const acVoltage = telemetry.acVoltage ?? null;
  const acVoltageStatus: HealthStatus =
    acVoltage === null
      ? 'N/A'
      : acVoltage >= THRESHOLDS.AC_VOLTAGE_OK_MIN && acVoltage <= THRESHOLDS.AC_VOLTAGE_OK_MAX
        ? 'OK'
        : acVoltage >= THRESHOLDS.AC_VOLTAGE_WARN_MIN && acVoltage <= THRESHOLDS.AC_VOLTAGE_WARN_MAX
          ? 'WARN'
          : 'ALARM';
  rows.push({
    id: 'ac-voltage',
    parameter: 'AC Grid Voltage',
    value: acVoltage !== null ? `${acVoltage.toFixed(1)} V` : 'N/A',
    normalRange: `${THRESHOLDS.AC_VOLTAGE_OK_MIN} – ${THRESHOLDS.AC_VOLTAGE_OK_MAX} V`,
    meaning: 'Single-phase grid voltage at the inverter AC terminal.',
    status: acVoltageStatus,
    group: 'grid',
  });

  // 4. Battery SOC vs Reserve
  const soc = telemetry.batterySoc ?? 0;
  const reserve = telemetry.batteryMinSoc ?? THRESHOLDS.BATTERY_RESERVE_DEFAULT;
  const socStatus: HealthStatus =
    soc >= reserve + THRESHOLDS.BATTERY_SOC_OK_BUFFER
      ? 'OK'
      : soc >= reserve
        ? 'WARN'
        : 'ALARM';
  rows.push({
    id: 'battery-soc',
    parameter: 'Battery SOC vs Reserve',
    value: `${Math.round(soc)}% (reserve ${reserve}%)`,
    normalRange: `≥ ${reserve + THRESHOLDS.BATTERY_SOC_OK_BUFFER}%`,
    meaning: 'Current charge level compared to minimum backup discharge reserve.',
    status: socStatus,
    group: 'battery',
  });

  // 5. Battery SOH
  const soh = telemetry.batterySoh ?? 100;
  const sohStatus: HealthStatus =
    soh >= THRESHOLDS.BATTERY_SOH_OK_MIN
      ? 'OK'
      : soh >= THRESHOLDS.BATTERY_SOH_WARN_MIN
        ? 'WARN'
        : 'ALARM';
  rows.push({
    id: 'battery-soh',
    parameter: 'Battery Health (SOH)',
    value: `${Math.round(soh)}%`,
    normalRange: `≥ ${THRESHOLDS.BATTERY_SOH_OK_MIN}%`,
    meaning: 'Remaining usable battery capacity relative to factory-new specification.',
    status: sohStatus,
    group: 'battery',
  });

  // 6. Battery Voltage
  const batV = telemetry.batteryVoltage ?? 0;
  const batVStatus: HealthStatus =
    batV >= THRESHOLDS.BATTERY_VOLTAGE_OK_MIN && batV <= THRESHOLDS.BATTERY_VOLTAGE_OK_MAX
      ? 'OK'
      : batV >= THRESHOLDS.BATTERY_VOLTAGE_WARN_MIN && batV <= THRESHOLDS.BATTERY_VOLTAGE_WARN_MAX
        ? 'WARN'
        : 'ALARM';
  rows.push({
    id: 'battery-voltage',
    parameter: 'Battery DC Voltage',
    value: `${batV.toFixed(1)} V`,
    normalRange: `${THRESHOLDS.BATTERY_VOLTAGE_OK_MIN} – ${THRESHOLDS.BATTERY_VOLTAGE_OK_MAX} V`,
    meaning: '48V LiFePO4 battery bank terminal voltage.',
    status: batVStatus,
    group: 'battery',
  });

  // 7. Power Factor
  const pf = telemetry.powerFactor ?? null;
  const pfEstimated = telemetry.powerFactorEstimated ?? false;
  const pfStatus: HealthStatus =
    pf === null ? 'N/A' : pf >= THRESHOLDS.PF_OK_MIN ? 'OK' : 'WARN';
  rows.push({
    id: 'power-factor',
    parameter: 'Power Factor',
    value: pf === null ? 'N/A' : `${pf.toFixed(2)}${pfEstimated ? ' (est.)' : ''}`,
    normalRange: `≥ ${THRESHOLDS.PF_OK_MIN.toFixed(1)}`,
    meaning:
      pf === null
        ? 'Inverter does not report PF'
        : pfEstimated
          ? 'Estimated ratio of real power to apparent power.'
          : 'Ratio of real power to apparent power delivered to AC load/grid.',
    status: pfStatus,
    group: 'grid',
  });

  // 8. PV Strings
  const strings = telemetry.strings ?? [];
  const isDaytimePv = (telemetry.pvPower ?? 0) >= 0.1;

  strings.forEach((s, idx) => {
    const strStatus: HealthStatus =
      s.power > 0 ? 'OK' : isDaytimePv ? 'WARN' : 'OK';
    rows.push({
      id: `pv-string-${idx + 1}`,
      parameter: s.name || `PV String ${idx + 1}`,
      value: `${s.voltage.toFixed(1)} V · ${s.current.toFixed(1)} A · ${Math.round(s.power)} W`,
      normalRange: '120 – 550 V DC',
      meaning: 'DC voltage, current, and power from this solar panel array string.',
      status: strStatus,
      group: 'pv',
    });
  });

  // 9. String Mismatch %
  if (strings.length >= 2) {
    const powers = strings.map((s) => Math.max(0, s.power));
    const maxP = Math.max(...powers);
    const minP = Math.min(...powers);

    if (maxP < THRESHOLDS.STRING_ACTIVE_MIN_WATTS) {
      rows.push({
        id: 'pv-string-mismatch',
        parameter: 'PV String Mismatch',
        value: 'N/A (idle)',
        normalRange: `≤ ${THRESHOLDS.STRING_MISMATCH_OK_MAX}%`,
        meaning: 'Power difference between strings; evaluated when arrays generate ≥ 100 W.',
        status: 'N/A',
        group: 'pv',
      });
    } else {
      const mismatchPct = ((maxP - minP) / maxP) * 100;
      const mismatchStatus: HealthStatus =
        mismatchPct <= THRESHOLDS.STRING_MISMATCH_OK_MAX
          ? 'OK'
          : mismatchPct <= THRESHOLDS.STRING_MISMATCH_WARN_MAX
            ? 'WARN'
            : 'ALARM';
      rows.push({
        id: 'pv-string-mismatch',
        parameter: 'PV String Mismatch',
        value: `${mismatchPct.toFixed(1)}%`,
        normalRange: `≤ ${THRESHOLDS.STRING_MISMATCH_OK_MAX}%`,
        meaning: 'Output imbalance between strings; >20% may indicate shading or a fault.',
        status: mismatchStatus,
        group: 'pv',
      });
    }
  }

  return rows;
}
