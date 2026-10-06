import * as dotenv from 'dotenv';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { SolisAuthService } from './solis/solis-auth.service';
import { SolisMockService } from './solis/solis-mock.service';
import { SolisService } from './solis/solis.service';
import { runMcpStdio } from './mcp/solis-mcp.server';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  const configService = new ConfigService();
  const authService = new SolisAuthService();
  const mockService = new SolisMockService();
  const solisService = new SolisService(configService, authService, mockService);

  await runMcpStdio(solisService);
}

bootstrap().catch((err) => {
  console.error('Fatal MCP Error:', err);
  process.exit(1);
});
