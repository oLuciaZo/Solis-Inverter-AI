# Solis-Inverter AI: Operating & Team Directives

## Project Overview
This repository integrates with the **SolisCloud Inverter Platform (API V2.0.3)** to provide:
1. **Professional Solar & Storage Dashboard**: A state-of-the-art Next.js web application offering real-time animated energy flows, string monitoring, battery telemetry, weather integration, and financial analytics far superior to the standard vendor apps.
2. **Model Context Protocol (MCP) Server**: A high-speed MCP bridge exposing inverter telemetry, historical statistics, alarms, and controls directly to Claude, Antigravity, and AI assistants.
3. **Enterprise Backend**: A modular NestJS API with Solis HMAC-SHA1 client, intelligent caching, rate-limit governance, and mock-data simulation.

---

## AI Agent Team Hierarchy

### 🏛️ Lead Architect & Reviewer (Head of Programming): **Gemini 3.1 Pro**
- Oversees system design, data architecture, security compliance, and plan generation.
- Conducts code reviews before production readiness.
- Enforces strict rate limits (max 2 req/s) and token sanitization.

### ⚡ Implementation & Research Specialist: **Gemini 3.8 Flash**
- Executes code authoring, NestJS service wiring, Next.js UI component design, and unit testing.
- Conducts rapid document research from `SolisCloud Platform API Document V2.0.3.pdf`.
- Implements test suites, mocks, and real-time state listeners.

---

## Engineering & Security Standards
1. **Security**:
   - Zero hardcoded API keys or secret credentials. All secrets load via `.env` or secure runtime configuration.
   - All external API responses must validate schema boundaries.
2. **Resilience & Rate Limiting**:
   - SolisCloud API has a strict 2 req/second constraint. A rate-limiter and in-memory/Redis cache are mandatory. Telemetry updates at the server every 5 minutes; avoid wasteful polling.
3. **Mock Mode Availability**:
   - When `SOLIS_MOCK_MODE=true` or when credentials are not yet configured, provide high-fidelity simulated solar, battery, grid, and load telemetry.
4. **Technology Stack**:
   - Backend: **NestJS** (TypeScript, RxJS, Axios / HttpService, `@modelcontextprotocol/sdk`)
   - Frontend: **Next.js** (App Router, Tailwind CSS, Lucide icons, Recharts / Framer Motion or rich SVG power animations)
   - Protocol: **Model Context Protocol (MCP)** over stdio and HTTP/SSE.
