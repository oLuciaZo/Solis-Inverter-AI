import { Injectable } from '@nestjs/common';

export interface SolarTelemetry {
  timestamp: number;
  timeStr: string;
  status: 'online' | 'offline' | 'alarm';
  // Power flows in kW
  pvPower: number; // Solar generation kW
  batteryPower: number; // Positive = charging, Negative = discharging
  batterySoc: number; // 0 - 100%
  batterySoh: number; // 0 - 100%
  batteryVoltage: number; // Volts
  batteryCurrent: number; // Amps
  gridPower: number; // Positive = exporting to grid, Negative = importing from grid
  loadPower: number; // Total consumption kW
  // Inverter internals
  inverterTemp: number; // Celsius
  frequency: number; // Hz (e.g. 50.0)
  powerFactor: number;
  // Strings
  strings: {
    name: string;
    voltage: number; // V
    current: number; // A
    power: number; // W
  }[];
  // Energy yields
  yieldToday: number; // kWh
  yieldMonth: number; // kWh
  yieldYear: number; // MWh
  yieldTotal: number; // MWh
  gridImportToday: number; // kWh
  gridExportToday: number; // kWh
  loadToday: number; // kWh
  // Environmental
  co2AvoidedToday: number; // kg
  treesPlantedEquivalent: number;
}

@Injectable()
export class SolisMockService {
  /**
   * Generates realistic dynamic telemetry simulating a 10 kW hybrid inverter setup
   * with a 15 kWh battery storage.
   */
  public getLiveTelemetry(): SolarTelemetry {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;

    // Solar generation model (Gaussian sun bell curve between 6:00 and 18:30)
    let pvPower = 0;
    if (hour >= 6.0 && hour <= 18.5) {
      const peakHour = 12.5;
      const sigma = 2.8;
      const peakPower = 8.4; // 8.4 kW peak solar
      const gaussian = Math.exp(-Math.pow(hour - peakHour, 2) / (2 * Math.pow(sigma, 2)));
      // Add slight micro fluctuation
      const noise = (Math.random() - 0.5) * 0.15;
      pvPower = Math.max(0, parseFloat((peakPower * gaussian + noise).toFixed(2)));
    }

    // Household load profile (peaks in morning 7-9 and evening 17-22)
    let baseLoad = 1.2;
    if (hour >= 7 && hour <= 9) baseLoad = 3.2;
    else if (hour >= 17 && hour <= 22) baseLoad = 4.5;
    const loadNoise = (Math.random() - 0.5) * 0.2;
    const loadPower = parseFloat(Math.max(0.6, baseLoad + loadNoise).toFixed(2));

    // Battery SOC cycle simulation:
    // Discharges overnight down to ~25%, charges during peak sun up to ~98%
    let batterySoc = 75;
    if (hour >= 0 && hour < 6) {
      batterySoc = Math.max(20, Math.round(50 - (hour * 4)));
    } else if (hour >= 6 && hour < 14) {
      batterySoc = Math.min(98, Math.round(25 + ((hour - 6) * 9)));
    } else if (hour >= 14 && hour < 19) {
      batterySoc = Math.max(85, Math.round(98 - ((hour - 14) * 2)));
    } else {
      batterySoc = Math.max(40, Math.round(85 - ((hour - 19) * 8)));
    }

    // Battery charge/discharge power
    let batteryPower = 0;
    if (pvPower > loadPower && batterySoc < 98) {
      // Excess solar charges battery (positive)
      batteryPower = parseFloat(Math.min(pvPower - loadPower, 3.6).toFixed(2));
    } else if (pvPower < loadPower && batterySoc > 15) {
      // Deficit discharged from battery (negative)
      batteryPower = -parseFloat(Math.min(loadPower - pvPower, 3.2).toFixed(2));
    }

    // Grid interaction
    // Grid Power = PV - Load - BatteryCharging
    // Positive = Exporting, Negative = Importing
    const netBalance = pvPower - loadPower - batteryPower;
    const gridPower = parseFloat(netBalance.toFixed(2));

    // String details (2 MPPT strings)
    const pv1Ratio = 0.58;
    const pv2Ratio = 0.42;
    const pv1W = pvPower * 1000 * pv1Ratio;
    const pv2W = pvPower * 1000 * pv2Ratio;
    const uPv1 = pvPower > 0 ? parseFloat((375 + (Math.random() - 0.5) * 6).toFixed(1)) : 12.0;
    const iPv1 = pvPower > 0 ? parseFloat((pv1W / uPv1).toFixed(2)) : 0;
    const uPv2 = pvPower > 0 ? parseFloat((368 + (Math.random() - 0.5) * 6).toFixed(1)) : 11.5;
    const iPv2 = pvPower > 0 ? parseFloat((pv2W / uPv2).toFixed(2)) : 0;

    // Daily cumulative energy yields
    const yieldToday = parseFloat((pvPower > 0 ? Math.min(38.4, 2.5 * Math.max(0, hour - 6.5)) : 28.6).toFixed(2));
    const loadToday = parseFloat((1.8 * hour).toFixed(2));
    const gridImportToday = parseFloat((Math.max(1.2, loadToday * 0.35)).toFixed(2));
    const gridExportToday = parseFloat((Math.max(0, yieldToday * 0.45)).toFixed(2));

    return {
      timestamp: now.getTime(),
      timeStr: now.toLocaleTimeString(),
      status: 'online',
      pvPower,
      batteryPower,
      batterySoc,
      batterySoh: 99,
      batteryVoltage: 51.8,
      batteryCurrent: parseFloat((Math.abs(batteryPower) * 1000 / 51.8).toFixed(1)),
      gridPower,
      loadPower,
      inverterTemp: parseFloat((36.5 + (pvPower * 2.1)).toFixed(1)),
      frequency: 50.0,
      powerFactor: 0.99,
      strings: [
        { name: 'String 1 (East Roof - 10x 450W)', voltage: uPv1, current: iPv1, power: Math.round(pv1W) },
        { name: 'String 2 (West Roof - 8x 450W)', voltage: uPv2, current: iPv2, power: Math.round(pv2W) },
      ],
      yieldToday,
      yieldMonth: 842.5,
      yieldYear: 6.84,
      yieldTotal: 24.92,
      gridImportToday,
      gridExportToday,
      loadToday,
      co2AvoidedToday: parseFloat((yieldToday * 0.65).toFixed(2)),
      treesPlantedEquivalent: parseFloat((yieldToday * 0.054).toFixed(1)),
    };
  }

  public getDailyCurve(dateStr?: string) {
    const points: any[] = [];
    const date = dateStr || new Date().toISOString().split('T')[0];
    for (let h = 5; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const timeVal = h + m / 60;
        const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        let pv = 0;
        if (timeVal >= 6.0 && timeVal <= 18.5) {
          const gaussian = Math.exp(-Math.pow(timeVal - 12.5, 2) / (2 * Math.pow(2.8, 2)));
          pv = parseFloat((8.2 * gaussian).toFixed(2));
        }

        let load = 1.1;
        if (timeVal >= 7 && timeVal <= 9) load = 2.9;
        else if (timeVal >= 17 && timeVal <= 21) load = 4.2;

        const battery = pv > load ? Math.min(pv - load, 3.2) : -Math.min(load - pv, 2.8);
        const grid = pv - load - battery;

        points.push({
          time: timeFormatted,
          solar: pv,
          load: parseFloat(load.toFixed(2)),
          battery: parseFloat(battery.toFixed(2)),
          grid: parseFloat(grid.toFixed(2)),
        });
      }
    }
    return { date, points };
  }

  public getStationOverview() {
    return {
      id: '1298491919448631809',
      stationName: 'Solaria Resident Smart Solar Hub',
      capacity: 10.0,
      capacityUnit: 'kWp',
      inverterCount: 1,
      inverterModel: 'Solis RHI-5K-48ES-5G',
      serialNumber: '120B40198150131',
      status: 'online',
      address: 'Bangkok, Thailand',
      weather: {
        condition: 'Clear Sky / Sunny',
        tempC: 32.5,
        humidity: 62,
        solarRadiation: 845, // W/m2
      },
    };
  }

  public getAlarms() {
    return [
      {
        id: 'ALM-102',
        alarmCode: 'W-03',
        level: 'tip',
        deviceSn: '120B40198150131',
        message: 'Grid Voltage Transient Fluctuation (Self-recovered)',
        advice: 'Normal grid fluctuation detected. System operating within nominal safety thresholds.',
        state: 'restored',
        timestamp: Date.now() - 3600000 * 4,
      },
    ];
  }
}
