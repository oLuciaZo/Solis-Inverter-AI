import * as http from 'http';
import { Logger } from '@nestjs/common';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { SolisService } from '../solis/solis.service';
import { createSolisMcpServer, executeSolisTool, SOLIS_TOOLS } from './solis-mcp.server';

const logger = new Logger('SolisMcpHttpServer');

interface McpSession {
  transport: SSEServerTransport;
  server: ReturnType<typeof createSolisMcpServer>;
}

export function startSolisMcpHttpServer(
  solisService: SolisService,
  port = 1234,
  host = '0.0.0.0',
): http.Server {
  const sessions = new Map<string, McpSession>();

  const server = http.createServer(async (req, res) => {
    // 1. CORS headers (allow any origin so AI web interfaces and extensions can connect)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Session-Id');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const hostHeader = req.headers.host || `localhost:${port}`;
    const url = new URL(req.url || '/', `http://${hostHeader}`);

    try {
      // 2. Standard MCP Server-Sent Events (SSE) Endpoint
      if (req.method === 'GET' && url.pathname === '/sse') {
        logger.log('Client initializing MCP SSE connection');
        const transport = new SSEServerTransport('/messages', res);
        const mcpServer = createSolisMcpServer(solisService);

        sessions.set(transport.sessionId, { transport, server: mcpServer });

        transport.onclose = () => {
          logger.log(`MCP session closed: ${transport.sessionId}`);
          sessions.delete(transport.sessionId);
        };

        res.on('close', () => {
          sessions.delete(transport.sessionId);
        });

        await mcpServer.connect(transport);
        return;
      }

      // 3. MCP Message Endpoint for SSE Sessions
      if (req.method === 'POST' && url.pathname === '/messages') {
        const sessionId = url.searchParams.get('sessionId') || (req.headers['x-session-id'] as string);
        if (!sessionId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing sessionId query parameter' }));
          return;
        }

        const session = sessions.get(sessionId);
        if (!session) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Session ${sessionId} not found or expired` }));
          return;
        }

        await session.transport.handlePostMessage(req, res);
        return;
      }

      // 4. REST Tool Calling List (GET /tools)
      if (req.method === 'GET' && (url.pathname === '/tools' || url.pathname === '/api/tools')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            {
              success: true,
              count: SOLIS_TOOLS.length,
              tools: SOLIS_TOOLS,
            },
            null,
            2,
          ),
        );
        return;
      }

      // 5. Direct REST Tool Execution (POST /call or POST /tools/:name)
      if (req.method === 'POST' && (url.pathname === '/call' || url.pathname.startsWith('/tools/'))) {
        let bodyText = '';
        req.on('data', (chunk) => {
          bodyText += chunk;
        });

        req.on('end', async () => {
          try {
            let body: any = {};
            if (bodyText) {
              body = JSON.parse(bodyText);
            }

            const toolName = url.pathname.startsWith('/tools/')
              ? url.pathname.replace('/tools/', '').trim()
              : body.name || body.tool;

            const toolArgs = body.arguments || body.args || body.parameters || {};

            if (!toolName) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing tool name in body {"name": "..."}' }));
              return;
            }

            logger.log(`Direct REST execution for tool: ${toolName}`);
            const result = await executeSolisTool(solisService, toolName, toolArgs);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify(
                {
                  success: true,
                  tool: toolName,
                  result,
                },
                null,
                2,
              ),
            );
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                error: err.message,
              }),
            );
          }
        });
        return;
      }

      // 6. Health Check (GET /health)
      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            activeSessions: sessions.size,
            uptimeSec: Math.floor(process.uptime()),
          }),
        );
        return;
      }

      // 7. Welcome & Instructions Info (GET /)
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            {
              service: 'Solis Inverter Model Context Protocol (MCP) Server',
              version: '1.0.0',
              status: 'online',
              mcpSseEndpoint: `http://${hostHeader}/sse`,
              mcpMessageEndpoint: `http://${hostHeader}/messages`,
              directToolCallEndpoint: `http://${hostHeader}/call`,
              toolsListEndpoint: `http://${hostHeader}/tools`,
              activeSessions: sessions.size,
              availableTools: SOLIS_TOOLS.map((t) => ({
                name: t.name,
                description: t.description,
              })),
              connectionGuide: {
                mcpClientConfig: {
                  mcpServers: {
                    'solis-inverter': {
                      url: `http://${hostHeader}/sse`,
                    },
                  },
                },
                directHttpCurlExample: `curl -X POST http://${hostHeader}/call -H "Content-Type: application/json" -d '{"name": "solis_get_telemetry"}'`,
              },
            },
            null,
            2,
          ),
        );
        return;
      }

      // 404 fallback
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Path not found: ${url.pathname}` }));
    } catch (error: any) {
      logger.error('Unhandled MCP HTTP error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  server.listen(port, host, () => {
    logger.log(`⚡ Solis Inverter MCP Server (SSE + REST) running on http://${host}:${port}`);
    logger.log(`📡 MCP SSE URL: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/sse`);
    logger.log(`🛠️ REST Tools URL: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/tools`);
  });

  return server;
}
