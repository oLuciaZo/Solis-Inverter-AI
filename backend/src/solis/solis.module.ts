import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SolisAuthService } from './solis-auth.service';
import { SolisMockService } from './solis-mock.service';
import { SolisService } from './solis.service';
import { SolisController } from './solis.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SolisController],
  providers: [SolisAuthService, SolisMockService, SolisService],
  exports: [SolisService, SolisAuthService, SolisMockService],
})
export class SolisModule {}
