import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SolisService } from './solis/solis.service';
import { startSolisMcpHttpServer } from './mcp/solis-mcp-sse.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`⚡ Solis Inverter Backend API running on http://0.0.0.0:${port}`);

  // Start dedicated MCP HTTP/SSE Server on port 1234 (or MCP_PORT)
  const solisService = app.get(SolisService);
  const mcpPort = Number(process.env.MCP_PORT) || 1234;
  startSolisMcpHttpServer(solisService, mcpPort, '0.0.0.0');
}
bootstrap();
