import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SolisService } from './solis.service';

@Controller('api/solis')
export class SolisController {
  constructor(private readonly solisService: SolisService) {}

  @Get('overview')
  async getOverview() {
    return this.solisService.getStationOverview();
  }

  @Get('telemetry')
  async getTelemetry(@Query('sn') sn?: string) {
    return this.solisService.getLiveTelemetry(sn);
  }

  @Get('curve')
  async getDailyCurve(@Query('date') date?: string) {
    return this.solisService.getDailyCurve(date);
  }

  @Get('alarms')
  async getAlarms() {
    return this.solisService.getAlarms();
  }

  @Get('config')
  getConfig() {
    return this.solisService.getConfig();
  }
}
