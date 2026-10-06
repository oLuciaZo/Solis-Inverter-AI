import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SolisService } from '../solis/solis.service';

export function createSolisMcpServer(solisService: SolisService) {
  const server = new Server(
    {
      name: 'solis-inverter-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  // Expose Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'solis_get_overview',
          description: 'Get Solis solar power station overview, total capacity, weather conditions, and operational status.',
          inputSchema: {
            type: 'object',
            properties: {
              stationId: { type: 'string', description: 'Optional Station ID' },
            },
          },
        },
        {
          name: 'solis_get_telemetry',
          description: 'Get real-time solar inverter electrical telemetry including PV power, string voltages/currents, grid power, AC frequency, and temperature.',
          inputSchema: {
            type: 'object',
            properties: {
              inverterSn: { type: 'string', description: 'Optional Inverter Serial Number' },
            },
          },
        },
        {
          name: 'solis_get_energy_flow',
          description: 'Get real-time energy flow breakdown: Solar generation (kW), Battery charge/discharge (kW), Home load (kW), and Grid import/export (kW).',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'solis_get_battery_status',
          description: 'Get energy storage battery status including State of Charge (SOC %), Health (SOH %), Voltage, Current, and Charge/Discharge power.',
          inputSchema: {
            type: 'object',
            properties: {
              inverterSn: { type: 'string', description: 'Inverter Serial Number' },
            },
          },
        },
        {
          name: 'solis_get_daily_curve',
          description: 'Get daily power generation and load curves sampled across the day.',
          inputSchema: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' },
            },
          },
        },
        {
          name: 'solis_get_alarms',
          description: 'List active or recent inverter alarms, faults, and manufacturer troubleshooting recommendations.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'solis_get_overview') {
        const overview = await solisService.getStationOverview();
        return {
          content: [{ type: 'text', text: JSON.stringify(overview, null, 2) }],
        };
      }

      if (name === 'solis_get_telemetry') {
        const sn = args?.inverterSn as string | undefined;
        const telemetry = await solisService.getLiveTelemetry(sn);
        return {
          content: [{ type: 'text', text: JSON.stringify(telemetry, null, 2) }],
        };
      }

      if (name === 'solis_get_energy_flow') {
        const t = await solisService.getLiveTelemetry();
        const flow = {
          solarGenerationKw: t.pvPower,
          homeConsumptionKw: t.loadPower,
          batteryPowerKw: t.batteryPower,
          batteryState: t.batteryPower > 0 ? 'Charging' : t.batteryPower < 0 ? 'Discharging' : 'Idle',
          batterySocPercent: t.batterySoc,
          gridPowerKw: t.gridPower,
          gridInteraction: t.gridPower > 0 ? 'Exporting to Grid' : t.gridPower < 0 ? 'Importing from Grid' : 'Balanced',
          selfSufficiencyPercent: t.loadPower > 0 ? Math.min(100, Math.round(((t.pvPower + Math.max(0, -t.batteryPower)) / t.loadPower) * 100)) : 100,
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(flow, null, 2) }],
        };
      }

      if (name === 'solis_get_battery_status') {
        const t = await solisService.getLiveTelemetry(args?.inverterSn as string | undefined);
        const battery = {
          soc: `${t.batterySoc}%`,
          soh: `${t.batterySoh}%`,
          voltage: `${t.batteryVoltage} V`,
          current: `${t.batteryCurrent} A`,
          power: `${t.batteryPower} kW`,
          status: t.batteryPower > 0 ? 'Charging' : t.batteryPower < 0 ? 'Discharging' : 'Standby',
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(battery, null, 2) }],
        };
      }

      if (name === 'solis_get_daily_curve') {
        const date = args?.date as string | undefined;
        const curve = await solisService.getDailyCurve(date);
        return {
          content: [{ type: 'text', text: JSON.stringify(curve, null, 2) }],
        };
      }

      if (name === 'solis_get_alarms') {
        const alarms = await solisService.getAlarms();
        return {
          content: [{ type: 'text', text: JSON.stringify(alarms, null, 2) }],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing ${name}: ${err.message}` }],
      };
    }
  });

  // Expose Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'solis://inverter/telemetry',
          name: 'Live Inverter Telemetry',
          mimeType: 'application/json',
          description: 'Live electrical parameters of the Solis solar inverter',
        },
        {
          uri: 'solis://station/overview',
          name: 'Station Overview',
          mimeType: 'application/json',
          description: 'Overview of the solar power plant and weather',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === 'solis://inverter/telemetry') {
      const data = await solisService.getLiveTelemetry();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    if (uri === 'solis://station/overview') {
      const data = await solisService.getStationOverview();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  return server;
}

export async function runMcpStdio(solisService: SolisService) {
  const server = createSolisMcpServer(solisService);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Solis Inverter MCP Server running on stdio');
}
