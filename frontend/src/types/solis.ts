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
  inverterTemp: number; // °C
  frequency: number; // Hz
  powerFactor: number;
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
  gridImportToday: number;
  gridExportToday: number;
  loadToday: number;
  co2AvoidedToday: number;
  treesPlantedEquivalent: number;
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
