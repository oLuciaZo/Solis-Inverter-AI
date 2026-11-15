import { SolarTelemetry } from '../types/solis';
import { THRESHOLDS } from './health';

export type EventTone = 'ok' | 'warn' | 'alarm' | 'info' | 'na';

export interface SystemEvent {
  id: string;
  title: string;
  detail: string;
  relativeTime: string;
  tone: EventTone;
  category: 'battery' | 'grid' | 'solar' | 'inverter' | 'system';
}

export function deriveEvents(telemetry: SolarTelemetry): SystemEvent[] {
  const events: SystemEvent[] = [];

  const pvPower = telemetry.pvPower ?? 0;
  const batteryPower = telemetry.batteryPower ?? 0;
  const batterySoc = telemetry.batterySoc ?? 0;
  const batteryState = telemetry.batteryState ?? 'idle';
  const reserve = telemetry.batteryMinSoc ?? THRESHOLDS.BATTERY_RESERVE_DEFAULT;
  const gridPower = telemetry.gridPower ?? 0;
  const gridState = telemetry.gridState ?? 'idle';
  const temp = telemetry.inverterTemp ?? 0;
  const pf = telemetry.powerFactor ?? null;
  const dataSource = telemetry.dataSource ?? 'mock';

  // 1. Inverter temperature warning/alarm
  if (temp >= THRESHOLDS.INVERTER_TEMP_WARN_MAX) {
    events.push({
      id: 'temp-alarm',
      title: 'Inverter temperature critical',
      detail: `Heatsink at ${temp.toFixed(1)} °C (≥ ${THRESHOLDS.INVERTER_TEMP_WARN_MAX} °C). Check airflow & derating.`,
      relativeTime: 'Now',
      tone: 'alarm',
      category: 'inverter',
    });
  } else if (temp >= THRESHOLDS.INVERTER_TEMP_OK_MAX) {
    events.push({
      id: 'temp-warn',
      title: 'Inverter temperature elevated',
      detail: `Heatsink at ${temp.toFixed(1)} °C (normal < ${THRESHOLDS.INVERTER_TEMP_OK_MAX} °C).`,
      relativeTime: 'Now',
      tone: 'warn',
      category: 'inverter',
    });
  }

  // 2. Battery state
  if (batterySoc <= reserve) {
    events.push({
      id: 'battery-low',
      title: 'Battery at reserve floor',
      detail: `SOC is ${Math.round(batterySoc)}% (reserve ${reserve}%). Discharge paused.`,
      relativeTime: 'Live',
      tone: 'alarm',
      category: 'battery',
    });
  } else if (batterySoc <= reserve + THRESHOLDS.BATTERY_SOC_OK_BUFFER) {
    events.push({
      id: 'battery-near-reserve',
      title: 'Battery nearing reserve',
      detail: `SOC is ${Math.round(batterySoc)}% (reserve ${reserve}%).`,
      relativeTime: 'Live',
      tone: 'warn',
      category: 'battery',
    });
  } else if (batteryState === 'full' || (Math.abs(batteryPower) < 0.05 && batterySoc >= 95)) {
    events.push({
      id: 'battery-full',
      title: 'Battery full · standby',
      detail: `SOC at ${Math.round(batterySoc)}%. Ready for evening peak load.`,
      relativeTime: 'Live',
      tone: 'ok',
      category: 'battery',
    });
  } else if (batteryState === 'charging' || batteryPower >= 0.05) {
    events.push({
      id: 'battery-charging',
      title: 'Battery charging',
      detail: `Storing ${Math.abs(batteryPower).toFixed(2)} kW · SOC ${Math.round(batterySoc)}%.`,
      relativeTime: 'Live',
      tone: 'ok',
      category: 'battery',
    });
  } else if (batteryState === 'discharging' || batteryPower <= -0.05) {
    events.push({
      id: 'battery-discharging',
      title: 'Battery discharging',
      detail: `Supplying ${Math.abs(batteryPower).toFixed(2)} kW to home · SOC ${Math.round(batterySoc)}%.`,
      relativeTime: 'Live',
      tone: 'info',
      category: 'battery',
    });
  } else {
    events.push({
      id: 'battery-idle',
      title: 'Battery idle',
      detail: `Standby at ${Math.round(batterySoc)}% SOC.`,
      relativeTime: 'Live',
      tone: 'info',
      category: 'battery',
    });
  }

  // 3. PV solar generation
  if (pvPower >= 0.05) {
    events.push({
      id: 'pv-producing',
      title: 'Solar PV producing',
      detail: `Generating ${pvPower.toFixed(2)} kW (${(telemetry.yieldToday ?? 0).toFixed(1)} kWh today).`,
      relativeTime: 'Live',
      tone: 'ok',
      category: 'solar',
    });
  } else {
    events.push({
      id: 'pv-standby',
      title: 'Solar PV standby (night / low light)',
      detail: `0.00 kW current output · ${(telemetry.yieldToday ?? 0).toFixed(1)} kWh generated today.`,
      relativeTime: 'Live',
      tone: 'na',
      category: 'solar',
    });
  }

  // 4. Grid exchange
  if (gridState === 'exporting' || gridPower >= 0.05) {
    events.push({
      id: 'grid-export',
      title: 'Exporting to utility grid',
      detail: `Sending ${Math.abs(gridPower).toFixed(2)} kW · ${(telemetry.gridExportToday ?? 0).toFixed(1)} kWh exported today.`,
      relativeTime: 'Live',
      tone: 'ok',
      category: 'grid',
    });
  } else if (gridState === 'importing' || gridPower <= -0.05) {
    events.push({
      id: 'grid-import',
      title: 'Importing from utility grid',
      detail: `Drawing ${Math.abs(gridPower).toFixed(2)} kW · ${(telemetry.gridImportToday ?? 0).toFixed(1)} kWh imported today.`,
      relativeTime: 'Live',
      tone: 'warn',
      category: 'grid',
    });
  } else {
    events.push({
      id: 'grid-idle',
      title: 'Grid no exchange',
      detail: 'Zero net power bought or sold right now.',
      relativeTime: 'Live',
      tone: 'ok',
      category: 'grid',
    });
  }

  // 5. Power Factor not reported
  if (pf === null) {
    events.push({
      id: 'pf-na',
      title: 'Power factor not reported',
      detail: 'Inverter telemetry omits PF; displayed as N/A in health table.',
      relativeTime: 'Telemetry',
      tone: 'na',
      category: 'inverter',
    });
  }

  // 6. Data source
  if (dataSource === 'mock') {
    events.push({
      id: 'source-mock',
      title: 'Simulated telemetry active',
      detail: 'Running in MOCK mode — configure SolisCloud credentials for live feed.',
      relativeTime: 'System',
      tone: 'info',
      category: 'system',
    });
  }

  return events;
}
