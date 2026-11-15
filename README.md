# Solis-Inverter AI: Solar & Energy Storage Intelligence Platform

A state-of-the-art solar and energy storage dashboard with real-time dynamic energy flows, string diagnostics, and a **Model Context Protocol (MCP)** server for seamless integration with **Claude Desktop**, Cursor, Antigravity, and AI assistants.

Built directly against the official **SolisCloud Platform API Document V2.0.3**.

---

## 🌟 Highlights

- **Dynamic Energy Flow Hub**: Real-time animated solar distribution visualization (PV Arrays &rarr; Hybrid Inverter &rarr; Battery Storage &rarr; Home Load &rarr; National Grid).
- **MPPT DC String Telemetry**: Per-string voltage, current, and wattage diagnostics (PV1 East roof vs PV2 West roof) to immediately detect shading or string degradation.
- **24-Hour Energy Performance Curve**: Interactive scrubbable time-series generation and load analysis.
- **Model Context Protocol (MCP) Server**: Directly expose Solis inverter tools to Claude Desktop, Cursor, and AI agents.
- **Dual-Agent Architecture**: Collaborative development model featuring **Gemini 3.1 Pro** (Planning, Architecture & Code Review) and **Gemini 3.8 Flash** (Rapid Coding, Documentation Research & Diagnostics).
- **Zero-Setup Mock Simulation**: High-fidelity simulated inverter mode runs out of the box when credentials are not yet configured.

---

## 📁 Project Architecture

```text
Solis-Inverter AI/
├── .agents/
│   └── skills/
│       ├── solis-api-expert/    # SolisCloud V2.0.3 HMAC-SHA1 signature & endpoint specs
│       ├── solis-mcp-agent/     # Model Context Protocol tools & schemas
│       └── ai-team-workflow/    # Gemini 3.1 Pro + Gemini 3.8 Flash collaboration protocol
├── backend/                     # NestJS 11 API & MCP Server
│   ├── src/
│   │   ├── solis/              # Solis HMAC-SHA1 signer, rate limiter & cache
│   │   ├── mcp/                # Solis MCP Tools (@modelcontextprotocol/sdk)
│   │   └── mcp-runner.ts       # Standalone MCP stdio entrypoint
│   └── .env                    # Solis API Credentials & Mock toggle
├── frontend/                    # Next.js 16 (App Router + Tailwind CSS)
│   ├── src/components/         # Energy Flow Hero, Metric Cards, Charts, Modals
│   └── src/app/page.tsx        # Responsive Glassmorphic Dashboard
├── AGENTS.md                    # Repo-wide operating rules & safety standards
└── GEMINI.md                    # Gemini CLI / IDE active skill directives
```

---

## 🚀 Quick Start

### Option A: Run with Docker Compose (Recommended)

1. Copy the example environment file:
```bash
cp .env.example .env
```
*(Optionally set your SolisCloud API credentials in `.env`, or leave `SOLIS_MOCK_MODE=true` for out-of-the-box simulation)*

2. Build and launch all services:
```bash
docker compose up -d
# or: npm run docker:up
```

3. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
   - **Frontend Dashboard**: `http://localhost:3000`
   - **Backend API**: `http://localhost:4000/api/solis/telemetry`

To view logs or stop the containers:
```bash
docker compose logs -f    # or: npm run docker:logs
docker compose down       # or: npm run docker:down
```

---

### Option B: Local Node.js Development

```bash
# In project root:
npm install
npm run dev:backend    # Runs NestJS on http://localhost:4000
npm run dev:frontend   # Runs Next.js on http://localhost:3000
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🤖 Model Context Protocol (MCP) Server (Port 1234)

The platform provides a dedicated high-performance **MCP Server on port `1234`** running alongside the backend. It supports both **SSE (Server-Sent Events)** for AI assistants and **Direct REST Tool Calling**.

### 1. Connect Gemini Spark / Cursor / Antigravity via SSE
Point your MCP client or configuration to the SSE endpoint:
- **SSE URL**: `http://localhost:1234/sse` (or `http://<server-ip>:1234/sse`)

Example MCP configuration (`settings.json` or MCP client config):
```json
{
  "mcpServers": {
    "solis-inverter": {
      "url": "http://localhost:1234/sse"
    }
  }
}
```

### 2. Direct REST Tool Calling (Gemini Spark / HTTP / cURL)
You can directly call inverter tools via standard HTTP POST without needing full SSE:

```bash
# Get live solar & battery telemetry
curl -X POST http://localhost:1234/call \
  -H "Content-Type: application/json" \
  -d '{"name": "solis_get_telemetry"}'

# Get real-time power flow balance
curl -X POST http://localhost:1234/call \
  -H "Content-Type: application/json" \
  -d '{"name": "solis_get_energy_flow"}'

# Inspect available tools and schemas
curl http://localhost:1234/tools
```

### 3. Claude Desktop Local Stdio Runner
File: `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "solis-inverter": {
      "command": "node",
      "args": [
        "/Users/sitita/Documents/GitHub/Solis-Inverter AI/backend/dist/mcp-runner.js"
      ],
      "env": {
        "SOLIS_API_URL": "https://www.soliscloud.com:13333",
        "SOLIS_KEY_ID": "your_solis_api_id",
        "SOLIS_KEY_SECRET": "your_solis_api_secret",
        "SOLIS_STATION_ID": "your_station_id",
        "SOLIS_INVERTER_SN": "your_inverter_sn",
        "SOLIS_MOCK_MODE": "false"
      }
    }
  }
}
```

### Available MCP Tools for AI
- `solis_get_overview`: Station capacity, status, and local solar radiation weather.
- `solis_get_telemetry`: Real-time PV power, MPPT string telemetry, grid frequency, temperature.
- `solis_get_energy_flow`: Instantaneous balance (Solar kW, Battery kW, Home load kW, Grid kW).
- `solis_get_battery_status`: State of Charge (SOC %), health (SOH %), voltage, charging power.
- `solis_get_daily_curve`: 24-hour generation and consumption curve data points.
- `solis_get_alarms`: Active inverter alarms and manufacturer advice.

---

## 👥 AI Agent Team Roles

- **🏛️ Head Programmer (Gemini 3.1 Pro)**: System architecture, security review, HMAC validation, and code review.
- **⚡ Implementation & Research Specialist (Gemini 3.8 Flash)**: Rapid coding, documentation extraction from `SolisCloud Platform API Document V2.0.3.pdf`, automated testing, and UI styling.
