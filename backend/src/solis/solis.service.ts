import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SolisAuthService } from './solis-auth.service';
import { SolisMockService, SolarTelemetry } from './solis-mock.service';
import { deriveBatteryState, deriveGridState, num, toKw, toKwh } from './solis-units';

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
        pvPower = toKw(stationData.power, stationData.powerStr);
      } else if (invData?.pvAndAcCoupledPower !== undefined) {
        pvPower = toKw(invData.pvAndAcCoupledPower, invData.pvAndAcCoupledPowerStr);
      } else if (invData?.pac !== undefined) {
        pvPower = toKw(invData.pac, invData.pacStr);
      }

      // Battery status
      const batterySoc = num(d.batteryPercent ?? invData?.batteryCapacitySoc ?? invData?.batteryPercent ?? 0);
      const batterySoh =
        invData?.batteryHealthSoh !== undefined && invData?.batteryHealthSoh !== null
          ? num(invData.batteryHealthSoh)
          : 99;
      const batteryMinSoc =
        invData?.socDischargeSet !== undefined && invData?.socDischargeSet !== null
          ? num(invData.socDischargeSet)
          : null;

      const batUnit = d.batteryPowerStr ?? invData?.batteryPowerStr;
      const rawBat = d.batteryPower ?? invData?.batteryPower;
      const batZheng = num(d.batteryPowerZheng);
      const batFu = num(d.batteryPowerFu);
      let batteryPower = 0;
      if (rawBat !== undefined && rawBat !== null && num(rawBat) < 0) {
        batteryPower = toKw(rawBat, batUnit);
      } else if (batZheng !== 0 || batFu !== 0) {
        batteryPower = toKw(batZheng - batFu, batUnit);
      } else if (rawBat !== undefined && rawBat !== null) {
        batteryPower = toKw(rawBat, batUnit);
      }

      const batteryVoltage = num(invData?.storageBatteryVoltage ?? invData?.batteryVoltage ?? 52.6);
      const batteryCurrent = num(invData?.storageBatteryCurrent ?? invData?.bstteryCurrent ?? 0);

      // Grid power (kW, +export / -import)
      let gridPower = 0;
      if (d.psum !== undefined && d.psum !== null) {
        const psumVal = num(d.psum);
        if (psumVal !== 0) {
          gridPower = toKw(psumVal, d.psumStr);
        } else {
          const psumZheng = num(d.psumZheng);
          const psumFu = num(d.psumFu);
          if (psumZheng !== 0 || psumFu !== 0) {
            gridPower = toKw(psumZheng - psumFu, d.psumStr);
          }
        }
      } else if (invData?.gridDetailVo?.gridPower !== undefined) {
        gridPower = toKw(invData.gridDetailVo.gridPower, invData.gridDetailVo.gridPowerStr);
      }

      // Home load power (kW)
      const hasFamilyLoad = d.familyLoadPower !== undefined && d.familyLoadPower !== null;
      const rawLoadPower = hasFamilyLoad
        ? d.familyLoadPower
        : (invData?.familyLoadPowerV2 ?? invData?.totalAndSmartLoadPower);
      const rawLoadUnit = hasFamilyLoad
        ? d.familyLoadPowerStr
        : (invData?.familyLoadPowerV2 !== undefined
            ? invData?.familyLoadPowerV2Str
            : invData?.totalAndSmartLoadPowerStr);
      let loadPower = rawLoadPower !== undefined && rawLoadPower !== null ? toKw(rawLoadPower, rawLoadUnit) : 0;
      if (!hasFamilyLoad && loadPower === 0 && pvPower > 0) {
        loadPower = parseFloat(Math.max(0, pvPower - batteryPower - gridPower).toFixed(2));
      }

      // String voltages & currents
      const strings = [];
      if (invData?.uPv1 !== undefined || invData?.iPv1 !== undefined) {
        const v1 = num(invData.uPv1);
        const i1 = num(invData.iPv1);
        strings.push({
          name: 'String 1 (PV1 Array)',
          voltage: v1,
          current: i1,
          power: Math.round(v1 * i1),
        });
      }
      if (invData?.uPv2 !== undefined || invData?.iPv2 !== undefined) {
        const v2 = num(invData.uPv2);
        const i2 = num(invData.iPv2);
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

      // Cumulative yields (yieldToday/Month in kWh, yieldYear/Total in MWh)
      const toMwh = (val: unknown, unitStr?: string | null): number => {
        const u = (unitStr ?? '').trim().toLowerCase();
        if (u === 'kwh' || u === 'wh') {
          return toKwh(val, unitStr) / 1000;
        }
        return num(val);
      };

      const yieldToday = toKwh(
        d.dayEnergy ?? invData?.eToday,
        d.dayEnergy !== undefined ? d.dayEnergyStr : invData?.eTodayStr,
      );
      const yieldMonth = toKwh(
        d.monthEnergy ?? invData?.eMonth,
        d.monthEnergy !== undefined ? d.monthEnergyStr : invData?.eMonthStr,
      );
      const yieldYear = toMwh(
        d.yearEnergy ?? invData?.eYear,
        d.yearEnergy !== undefined ? d.yearEnergyStr : invData?.eYearStr,
      );
      const yieldTotal = toMwh(
        d.allEnergy ?? invData?.eTotal,
        d.allEnergy !== undefined ? d.allEnergyStr : invData?.eTotalStr,
      );

      // Battery today energies (NEVER use stationDetail's batteryTodayChargeEnergy — it is 0/wrong)
      const batteryChargeToday =
        invData?.batteryTodayChargeEnergy !== undefined && invData?.batteryTodayChargeEnergy !== null
          ? toKwh(invData.batteryTodayChargeEnergy, invData.batteryTodayChargeEnergyStr)
          : toKwh(stationData?.batteryChargeEnergy, stationData?.batteryChargeEnergyStr);
      const batteryDischargeToday =
        invData?.batteryTodayDischargeEnergy !== undefined && invData?.batteryTodayDischargeEnergy !== null
          ? toKwh(invData.batteryTodayDischargeEnergy, invData.batteryTodayDischargeEnergyStr)
          : toKwh(stationData?.batteryDischargeEnergy, stationData?.batteryDischargeEnergyStr);

      const gridImportToday =
        invData?.gridPurchasedTodayEnergy !== undefined && invData?.gridPurchasedTodayEnergy !== null
          ? toKwh(invData.gridPurchasedTodayEnergy, invData.gridPurchasedTodayEnergyStr)
          : toKwh(d.gridPurchasedDayEnergy, d.gridPurchasedDayEnergyStr);
      const gridExportToday =
        invData?.gridSellTodayEnergy !== undefined && invData?.gridSellTodayEnergy !== null
          ? toKwh(invData.gridSellTodayEnergy, invData.gridSellTodayEnergyStr)
          : toKwh(d.gridSellDayEnergy, d.gridSellDayEnergyStr);

      const gridImportMonth = toKwh(
        d.gridPurchasedMonthEnergy ?? invData?.gridPurchasedMonthEnergy,
        d.gridPurchasedMonthEnergy !== undefined
          ? d.gridPurchasedMonthEnergyStr
          : invData?.gridPurchasedMonthEnergyStr,
      );
      const gridExportMonth = toKwh(
        d.gridSellMonthEnergy ?? invData?.gridSellMonthEnergy,
        d.gridSellMonthEnergy !== undefined ? d.gridSellMonthEnergyStr : invData?.gridSellMonthEnergyStr,
      );

      const loadToday = toKwh(d.homeLoadTodayEnergy, d.homeLoadTodayEnergyStr);

      // AC & Power Factor
      const rawAcVoltage = invData?.uAc1 ?? invData?.gridDetailVo?.gridVoltageA;
      const acVoltage = rawAcVoltage !== undefined && rawAcVoltage !== null ? num(rawAcVoltage) : null;
      const acCurrent = invData?.iAc1 !== undefined && invData?.iAc1 !== null ? num(invData.iAc1) : null;

      const rawPf = invData?.gridDetailVo?.gridPowerFactor ?? invData?.powerFactor;
      const pfVal = rawPf !== undefined && rawPf !== null ? num(rawPf) : 0;
      let powerFactor: number | null = null;
      let powerFactorEstimated = false;

      if (invData?.isShowPowerFactor === 0 || pfVal === 0) {
        const p = num(invData?.acGridPowerA);
        const q = num(invData?.acGridReactivePowerA);
        if (p > 0) {
          const apparent = Math.sqrt(p * p + q * q);
          powerFactor = apparent > 0 ? parseFloat((p / apparent).toFixed(2)) : null;
          powerFactorEstimated = powerFactor !== null;
        }
      } else {
        powerFactor = pfVal;
      }

      const pvPowerRounded = parseFloat(pvPower.toFixed(2));
      const batteryPowerRounded = parseFloat(batteryPower.toFixed(2));
      const gridPowerRounded = parseFloat(gridPower.toFixed(2));
      const loadPowerRounded = parseFloat(loadPower.toFixed(2));

      return {
        timestamp: d.dataTimestamp ? num(d.dataTimestamp) : Date.now(),
        timeStr: d.dataTimestampStr || new Date().toLocaleTimeString(),
        status: 'online',
        pvPower: pvPowerRounded,
        batteryPower: batteryPowerRounded,
        batterySoc,
        batterySoh,
        batteryVoltage,
        batteryCurrent,
        gridPower: gridPowerRounded,
        loadPower: loadPowerRounded,
        gridState: deriveGridState(gridPowerRounded),
        batteryState: deriveBatteryState(batteryPowerRounded, batterySoc),
        inverterTemp: num(invData?.inverterTemperature ?? 38.5),
        frequency: num(invData?.gridDetailVo?.gridFac ?? invData?.fac ?? 50.0),
        acVoltage,
        acCurrent,
        powerFactor,
        powerFactorEstimated,
        strings,
        yieldToday,
        yieldMonth,
        yieldYear,
        yieldTotal,
        batteryChargeToday,
        batteryDischargeToday,
        batteryMinSoc,
        gridImportToday,
        gridExportToday,
        gridImportMonth,
        gridExportMonth,
        loadToday,
        co2AvoidedToday: parseFloat((yieldToday * 0.65).toFixed(2)),
        treesPlantedEquivalent: parseFloat((yieldToday * 0.054).toFixed(1)),
        dataSource: 'live',
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
          const solar = parseFloat(toKw(item.power, item.powerStr).toFixed(2));
          const hasFamilyLoad = item.familyLoadPower !== undefined && item.familyLoadPower !== null;
          const load = parseFloat(
            toKw(
              hasFamilyLoad ? item.familyLoadPower : item.consumeEnergy,
              hasFamilyLoad ? item.familyLoadPowerStr : item.consumeEnergyStr,
            ).toFixed(2),
          );
          const battery = parseFloat(toKw(item.batteryPower, item.batteryPowerStr).toFixed(2));
          const grid = parseFloat(toKw(item.psum, item.psumStr).toFixed(2));

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
