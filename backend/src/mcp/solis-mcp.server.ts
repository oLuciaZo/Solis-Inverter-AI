import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SolisService } from '../solis/solis.service';

export const SOLIS_TOOLS = [
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
];

export async function executeSolisTool(
  solisService: SolisService,
  name: string,
  args?: Record<string, any>,
): Promise<any> {
  if (name === 'solis_get_overview') {
    return solisService.getStationOverview();
  }

  if (name === 'solis_get_telemetry') {
    const sn = args?.inverterSn as string | undefined;
    return solisService.getLiveTelemetry(sn);
  }

  if (name === 'solis_get_energy_flow') {
    const t = await solisService.getLiveTelemetry();
    return {
      solarGenerationKw: t.pvPower,
      homeConsumptionKw: t.loadPower,
      batteryPowerKw: t.batteryPower,
      batteryState: t.batteryPower > 0 ? 'Charging' : t.batteryPower < 0 ? 'Discharging' : 'Idle',
      batterySocPercent: t.batterySoc,
      gridPowerKw: t.gridPower,
      gridInteraction: t.gridPower > 0 ? 'Exporting to Grid' : t.gridPower < 0 ? 'Importing from Grid' : 'Balanced',
      selfSufficiencyPercent:
        t.loadPower > 0
          ? Math.min(100, Math.round(((t.pvPower + Math.max(0, -t.batteryPower)) / t.loadPower) * 100))
          : 100,
    };
  }

  if (name === 'solis_get_battery_status') {
    const t = await solisService.getLiveTelemetry(args?.inverterSn as string | undefined);
    return {
      soc: `${t.batterySoc}%`,
      soh: `${t.batterySoh}%`,
      voltage: `${t.batteryVoltage} V`,
      current: `${t.batteryCurrent} A`,
      power: `${t.batteryPower} kW`,
      status: t.batteryPower > 0 ? 'Charging' : t.batteryPower < 0 ? 'Discharging' : 'Standby',
    };
  }

  if (name === 'solis_get_daily_curve') {
    const date = args?.date as string | undefined;
    return solisService.getDailyCurve(date);
  }

  if (name === 'solis_get_alarms') {
    return solisService.getAlarms();
  }

  throw new Error(`Unknown tool: ${name}`);
}

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
      tools: SOLIS_TOOLS,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await executeSolisTool(solisService, name, args as any);
      return {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
      };
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
