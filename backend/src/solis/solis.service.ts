import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SolisAuthService } from './solis-auth.service';
import { SolisMockService, SolarTelemetry } from './solis-mock.service';

@Injectable()
export class SolisService {
  private readonly logger = new Logger(SolisService.name);
  private readonly httpClient: AxiosInstance;
  private readonly cache = new Map<string, { data: any; expiry: number }>();
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs = 550; // enforce max 2 requests/sec

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: SolisAuthService,
    private readonly mockService: SolisMockService,
  ) {
    const baseURL = this.configService.get<string>('SOLIS_API_URL') || 'https://www.soliscloud.com:13333';
    this.httpClient = axios.create({
      baseURL,
      timeout: 15000,
    });
  }

  public isMockMode(): boolean {
    const explicitMock = this.configService.get<string>('SOLIS_MOCK_MODE');
    if (explicitMock === 'true') return true;
    const keyId = this.configService.get<string>('SOLIS_KEY_ID');
    const secret = this.configService.get<string>('SOLIS_KEY_SECRET');
    return !keyId || !secret;
  }

  /**
   * Rate limited & cached SolisCloud API caller
   */
  private async postSolisApi<T>(resource: string, body: Record<string, any>, cacheTtlMs = 45000): Promise<T> {
    const cacheKey = `${resource}:${JSON.stringify(body)}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > now) {
      return cached.data as T;
    }

    // SolisCloud 2 req/s limit safety
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();

    const keyId = this.configService.get<string>('SOLIS_KEY_ID') || '';
    const secret = this.configService.get<string>('SOLIS_KEY_SECRET') || '';

    const headers = this.authService.generateHeaders(keyId, secret, resource, body);

    try {
      this.logger.log(`Invoking SolisCloud API: ${resource}`);
      const response = await this.httpClient.post(resource, body, { headers });
      const data = response.data;

      if (data && data.code === '0') {
        this.cache.set(cacheKey, { data, expiry: Date.now() + cacheTtlMs });
        return data as T;
      } else {
        this.logger.warn(`SolisCloud API returned non-zero code: ${data?.code} - ${data?.msg}`);
        return data as T;
      }
    } catch (err: any) {
      this.logger.error(`Failed to invoke SolisCloud API ${resource}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Unified real-time telemetry from SolisCloud station & inverter
   */
  public async getLiveTelemetry(inverterSn?: string): Promise<SolarTelemetry> {
    if (this.isMockMode()) {
      return this.mockService.getLiveTelemetry();
    }

    const stationId = this.configService.get<string>('SOLIS_STATION_ID');
    const sn = inverterSn || this.configService.get<string>('SOLIS_INVERTER_SN');

    try {
      // 1. Fetch station detail (contains aggregated power, grid purchased/sell, home load, weather)
      let stationData: any = null;
      if (stationId) {
        const stationRes: any = await this.postSolisApi('/v1/api/stationDetail', { id: stationId }, 30000);
        stationData = stationRes?.data;
      }

      // 2. Fetch inverter detail (contains DC strings, battery voltage, temperature)
      let invData: any = null;
      if (sn) {
        const invRes: any = await this.postSolisApi('/v1/api/inverterDetail', { sn }, 30000);
        invData = invRes?.data;
      }

      if (!stationData && !invData) {
        return this.mockService.getLiveTelemetry();
      }

      const d = stationData || invData;

      // Extract real-time power (kW)
      let pvPower = 0;
      if (stationData?.power !== undefined) {
        pvPower = Number(stationData.power);
      } else if (invData?.pvAndAcCoupledPower !== undefined) {
        pvPower = Number(invData.pvAndAcCoupledPower);
      } else if (invData?.pac !== undefined) {
        pvPower = Number(invData.pac);
      }

      // Battery status
      const batterySoc = Number(d.batteryPercent ?? invData?.batteryPercent ?? d.batteryCapacitySoc ?? 0);
      const batteryPower = Number(d.batteryPower ?? invData?.batteryPower ?? 0);
      const batteryVoltage = Number(invData?.storageBatteryVoltage ?? invData?.batteryVoltage ?? 52.6);
      const batteryCurrent = Number(invData?.storageBatteryCurrent ?? invData?.bstteryCurrent ?? 0);

      // Grid power (kW)
      const gridPower = Number(d.psum ?? invData?.gridDetailVo?.gridPower ?? 0);

      // Home load power (kW)
      let loadPower = Number(d.familyLoadPower ?? invData?.familyLoadPowerV2 ?? invData?.totalAndSmartLoadPower ?? 0);
      if (loadPower === 0 && pvPower > 0) {
        loadPower = parseFloat(Math.max(0, pvPower - batteryPower - gridPower).toFixed(2));
      }

      // String voltages & currents
      const strings = [];
      if (invData?.uPv1 !== undefined || invData?.iPv1 !== undefined) {
        const v1 = Number(invData.uPv1 || 0);
        const i1 = Number(invData.iPv1 || 0);
        strings.push({
          name: 'String 1 (PV1 Array)',
          voltage: v1,
          current: i1,
          power: Math.round(v1 * i1),
        });
      }
      if (invData?.uPv2 !== undefined || invData?.iPv2 !== undefined) {
        const v2 = Number(invData.uPv2 || 0);
        const i2 = Number(invData.iPv2 || 0);
        strings.push({
          name: 'String 2 (PV2 Array)',
          voltage: v2,
          current: i2,
          power: Math.round(v2 * i2),
        });
      }

      if (strings.length === 0) {
        strings.push(
          { name: 'String 1 (PV1 Array)', voltage: 372.0, current: parseFloat((pvPower * 550 / 372).toFixed(2)), power: Math.round(pvPower * 550) },
          { name: 'String 2 (PV2 Array)', voltage: 368.0, current: parseFloat((pvPower * 450 / 368).toFixed(2)), power: Math.round(pvPower * 450) },
        );
      }

      // Cumulative yields
      const yieldToday = Number(d.dayEnergy ?? invData?.eToday ?? 0);
      const yieldMonth = Number(d.monthEnergy ?? invData?.eMonth ?? 0);
      const yieldYear = Number(d.yearEnergy ?? invData?.eYear ?? 0);
      const yieldTotal = Number(d.allEnergy ?? invData?.eTotal ?? 0);

      const gridImportToday = Number(d.gridPurchasedDayEnergy ?? 0);
      const gridExportToday = Number(d.gridSellDayEnergy ?? 0);
      const loadToday = Number(d.homeLoadTodayEnergy ?? 0);

      return {
        timestamp: d.dataTimestamp ? Number(d.dataTimestamp) : Date.now(),
        timeStr: d.dataTimestampStr || new Date().toLocaleTimeString(),
        status: 'online',
        pvPower: parseFloat(pvPower.toFixed(2)),
        batteryPower: parseFloat(batteryPower.toFixed(2)),
        batterySoc,
        batterySoh: 99,
        batteryVoltage,
        batteryCurrent,
        gridPower: parseFloat(gridPower.toFixed(2)),
        loadPower: parseFloat(loadPower.toFixed(2)),
        inverterTemp: Number(invData?.inverterTemperature ?? 38.5),
        frequency: Number(invData?.gridDetailVo?.gridFac ?? invData?.fac ?? 50.0),
        powerFactor: Number(invData?.gridDetailVo?.gridPowerFactor ?? invData?.powerFactor ?? 1.0),
        strings,
        yieldToday,
        yieldMonth,
        yieldYear,
        yieldTotal,
        gridImportToday,
        gridExportToday,
        loadToday,
        co2AvoidedToday: parseFloat((yieldToday * 0.65).toFixed(2)),
        treesPlantedEquivalent: parseFloat((yieldToday * 0.054).toFixed(1)),
      };
    } catch (err: any) {
      this.logger.error(`Error fetching live telemetry: ${err.message}`);
      return this.mockService.getLiveTelemetry();
    }
  }

  public async getDailyCurve(dateStr?: string) {
    if (this.isMockMode()) {
      return this.mockService.getDailyCurve(dateStr);
    }

    const stationId = this.configService.get<string>('SOLIS_STATION_ID');
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    try {
      const response: any = await this.postSolisApi('/v1/api/stationDay', {
        id: stationId,
        money: 'THB',
        time: targetDate,
        timeZone: 7,
      }, 120000);

      if (Array.isArray(response?.data) && response.data.length > 0) {
        const points = response.data.map((item: any) => {
          const rawSolar = item.power ?? 0;
          const rawLoad = item.familyLoadPower ?? item.consumeEnergy ?? 0;
          const rawBat = item.batteryPower ?? 0;
          const rawGrid = item.psum ?? 0;

          // Normalize values (if > 10 it is in Watts, divide by 1000)
          const solar = rawSolar > 15 ? parseFloat((rawSolar / 1000).toFixed(2)) : parseFloat(rawSolar.toFixed(2));
          const load = rawLoad > 15 ? parseFloat((rawLoad / 1000).toFixed(2)) : parseFloat(rawLoad.toFixed(2));
          const battery = rawBat > 15 || rawBat < -15 ? parseFloat((rawBat / 1000).toFixed(2)) : parseFloat(rawBat.toFixed(2));
          const grid = rawGrid > 15 || rawGrid < -15 ? parseFloat((rawGrid / 1000).toFixed(2)) : parseFloat(rawGrid.toFixed(2));

          return {
            time: item.timeStr?.length > 5 ? item.timeStr.substring(0, 5) : item.timeStr || '',
            solar,
            load,
            battery,
            grid,
          };
        });
        return { date: targetDate, points };
      }
    } catch (err: any) {
      this.logger.warn(`Could not load stationDay curve: ${err.message}`);
    }

    return this.mockService.getDailyCurve(dateStr);
  }

  public async getStationOverview() {
    if (this.isMockMode()) {
      return this.mockService.getStationOverview();
    }

    const stationId = this.configService.get<string>('SOLIS_STATION_ID');
    const sn = this.configService.get<string>('SOLIS_INVERTER_SN');

    try {
      const response: any = await this.postSolisApi('/v1/api/stationDetail', { id: stationId });
      const d = response?.data;
      if (!d) return this.mockService.getStationOverview();

      // Clean weather format
      let weatherCond = 'Sunny';
      if (d.weather) {
        weatherCond = d.weather.replace(/日出.*?\s/g, '').replace(/日落.*?\s/g, '').trim();
      }

      return {
        id: d.id,
        stationName: d.stationName || 'Baan ninya ratchapruek',
        capacity: d.capacity || 9.0,
        capacityUnit: d.capacityStr || 'kWp',
        inverterCount: d.inverterCount || 1,
        inverterModel: 'Solis RHI Hybrid',
        serialNumber: sn || d.sno || '',
        status: 'online',
        address: d.addr || 'Nonthaburi, Thailand',
        weather: {
          condition: weatherCond || 'Clear Sky',
          tempC: d.tmpMax ? Number(d.tmpMax) : 29,
          humidity: Number(d.hum || 59),
          solarRadiation: 850,
        },
      };
    } catch {
      return this.mockService.getStationOverview();
    }
  }

  public async getAlarms() {
    if (this.isMockMode()) {
      return this.mockService.getAlarms();
    }

    try {
      const response: any = await this.postSolisApi('/v1/api/alarmList', { pageNo: '1', pageSize: '10' });
      return response?.data?.records || [];
    } catch {
      return this.mockService.getAlarms();
    }
  }

  public getConfig() {
    return {
      mockMode: this.isMockMode(),
      hasKeyId: !!this.configService.get<string>('SOLIS_KEY_ID'),
      hasKeySecret: !!this.configService.get<string>('SOLIS_KEY_SECRET'),
      stationId: this.configService.get<string>('SOLIS_STATION_ID') || '',
      inverterSn: this.configService.get<string>('SOLIS_INVERTER_SN') || '',
      apiUrl: this.configService.get<string>('SOLIS_API_URL') || 'https://www.soliscloud.com:13333',
    };
  }
}
