export type FlowState = 'importing' | 'exporting' | 'idle';
export type BatteryState = 'charging' | 'discharging' | 'idle' | 'full';

export interface SolarTelemetry {
  timestamp: number;
  timeStr: string;
  status: 'online' | 'offline' | 'alarm';
  pvPower: number; // kW
  batteryPower: number; // positive = charging, negative = discharging
  batterySoc: number; // %
  batterySoh: number; // %
  batteryVoltage: number; // V
  batteryCurrent: number; // A
  gridPower: number; // positive = exporting, negative = importing
  loadPower: number; // kW
  gridState: FlowState;
  batteryState: BatteryState;
  inverterTemp: number; // °C
  frequency: number; // Hz
  acVoltage: number | null; // V (uAc1 / gridVoltageA)
  acCurrent: number | null; // A (iAc1)
  powerFactor: number | null; // null = not reported
  powerFactorEstimated: boolean;
  strings: {
    name: string;
    voltage: number;
    current: number;
    power: number;
  }[];
  yieldToday: number; // kWh
  yieldMonth: number; // kWh
  yieldYear: number; // MWh
  yieldTotal: number; // MWh
  batteryChargeToday: number; // kWh
  batteryDischargeToday: number; // kWh
  batteryMinSoc: number | null; // % reserve (socDischargeSet)
  gridImportToday: number;
  gridExportToday: number;
  gridImportMonth: number; // kWh
  gridExportMonth: number; // kWh
  loadToday: number;
  co2AvoidedToday: number;
  treesPlantedEquivalent: number;
  dataSource: 'live' | 'mock';
}

export interface StationOverview {
  id: string;
  stationName: string;
  capacity: number;
  capacityUnit: string;
  inverterCount: number;
  inverterModel: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'alarm';
  address: string;
  weather: {
    condition: string;
    tempC: number;
    humidity: number;
    solarRadiation: number;
  };
}

export interface DailyCurvePoint {
  time: string;
  solar: number;
  load: number;
  battery: number;
  grid: number;
}
