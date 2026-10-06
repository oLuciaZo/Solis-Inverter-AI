# Gemini CLI & IDE Project Directives: Solis-Inverter AI

## Operational Context
You are collaborating on the **Solis-Inverter AI** project.
- **Head of Programming (Architecture, Planning & Code Review)**: Gemini 3.1 Pro
- **Lead Coder & Researcher (Implementation, Tests, Diagnostics)**: Gemini 3.8 Flash

## Active Skills in this Project
1. `solis-api-expert` ([.agents/skills/solis-api-expert/SKILL.md](file:///.agents/skills/solis-api-expert/SKILL.md)): Complete SolisCloud V2.0.3 signature algorithms, endpoints, and DTO specifications.
2. `solis-mcp-agent` ([.agents/skills/solis-mcp-agent/SKILL.md](file:///.agents/skills/solis-mcp-agent/SKILL.md)): Specifications for exposing inverter tools to Claude and AI assistants via MCP.
3. `ai-team-workflow` ([.agents/skills/ai-team-workflow/SKILL.md](file:///.agents/skills/ai-team-workflow/SKILL.md)): Protocol for Gemini 3.1 Pro & Gemini 3.8 Flash collaboration.

## Project Structure
- `backend/`: NestJS backend server with SolisCloud API client, caching, REST/SSE endpoints, and MCP Server.
- `frontend/`: Next.js frontend with premium solar energy flow animations, metrics cards, graphs, and live controls.
- `packages/mcp-server/`: Model Context Protocol server bundle for Claude Desktop and Cursor.
