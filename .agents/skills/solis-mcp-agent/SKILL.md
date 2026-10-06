---
name: solis-mcp-agent
description: >-
  Model Context Protocol (MCP) server design, tool registration, and prompts for exposing Solis inverter telemetry, historical generation, alarms, and battery states to Claude, Antigravity, and AI assistants.
---

# Solis Model Context Protocol (MCP) Server Guide

This skill guides the construction and maintenance of the Solis Inverter MCP server, enabling LLMs (Claude Desktop, Antigravity, Cursor, etc.) to query live solar data.

## 1. Architecture

The MCP server connects Claude or external AI agents to the Solis Inverter via the NestJS Solis Cloud Service.

```
┌─────────────────────────┐
│ Claude / AI Assistant   │
└────────────┬────────────┘
             │ JSON-RPC (stdio / SSE / Stream)
┌────────────▼────────────┐
│   Solis MCP Server      │
│  (@modelcontextprotocol)│
└────────────┬────────────┘
             │ Internal Service / REST
┌────────────▼────────────┐
│ Solis Inverter Backend  │
│  (NestJS + Solis Cloud) │
└─────────────────────────┘
```

## 2. Standard MCP Tools Specification

The following tools must be exposed:

1. `solis_get_station_overview`
   - Description: "Get high-level power station stats including total power, today's energy yield, monthly yield, battery state, and weather."
   - Input: `{ stationId?: string }`

2. `solis_get_inverter_telemetry`
   - Description: "Get real-time electrical telemetry for an inverter (AC power, DC string voltages/currents, inverter temperature, grid frequency, power factor)."
   - Input: `{ inverterSn?: string }`

3. `solis_get_battery_status`
   - Description: "Get battery state of charge (SOC), health (SOH), charging/discharging power, battery voltage and current."
   - Input: `{ inverterSn?: string }`

4. `solis_get_energy_flow`
   - Description: "Get instantaneous energy balance: solar PV generation (kW), home consumption (kW), battery charge/discharge (kW), grid import/export (kW)."
   - Input: `{}`

5. `solis_get_daily_curve`
   - Description: "Get 5-minute sampling intervals of power generation and load for a specific day."
   - Input: `{ date?: string /* YYYY-MM-DD */, inverterSn?: string }`

6. `solis_get_alarms`
   - Description: "List any active or recent inverter alarms, faults, and diagnostic recommendations."
   - Input: `{ status?: "all" | "active" | "resolved" }`

## 3. Configuration with Claude Desktop

File: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "solis-inverter": {
      "command": "node",
      "args": ["/Users/sitita/Documents/GitHub/Solis-Inverter AI/backend/dist/mcp-cli.js"],
      "env": {
        "SOLIS_KEY_ID": "your_api_id",
        "SOLIS_KEY_SECRET": "your_api_secret"
      }
    }
  }
}
```
