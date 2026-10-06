---
name: ai-team-workflow
description: >-
  Defines the multi-agent collaboration model between Head Programmer (Gemini 3.1 Pro) for planning & code review, and Implementation Engineer (Gemini 3.8 Flash) for coding, research, and debugging.
---

# Multi-Agent Engineering Protocol: Gemini 3.1 Pro & Gemini 3.8 Flash

This project operates with a dual-agent collaborative structure designed for maximum engineering velocity and rock-solid code quality.

## Role Division

### 1. Head of Programming & System Architect: Gemini 3.1 Pro
- **Core Responsibilities**:
  - High-level system design & technical roadmap planning.
  - Architecture decisions (NestJS modules, MCP protocol compliance, Next.js rendering strategy).
  - Security review: Validates API secret handling, prevents token leakage, audits HMAC signing integrity.
  - Code review: Reviews PRs, refactors, and architectural pull requests before merging.
  - Performance & SLA governance (caching strategy, 2 req/s Solis rate-limit protection).

### 2. Implementation & Research Specialist: Gemini 3.8 Flash
- **Core Responsibilities**:
  - Rapid implementation of NestJS services, controllers, DTOs, and MCP tool handlers.
  - Developing responsive Next.js frontend components, state management, and Tailwind/CSS animations.
  - Research: Parsing PDF documentation (`SolisCloud Platform API Document V2.0.3.pdf`), validating edge-case response parameters.
  - Test-first implementation: Writing Jest unit and integration tests.
  - Bug diagnosis and real-time troubleshooting.

---

## Collaboration Workflow

```text
[User Request / New Feature]
         │
         ▼
[Gemini 3.1 Pro - Head Programmer]
  - Analyze requirements & create Architectural Plan
  - Define interfaces, DTOs, safety boundaries
         │
         ▼
[Gemini 3.8 Flash - Coder & Researcher]
  - Deep-dive into API specs & code implementation
  - Implement NestJS backend / Next.js frontend / MCP Tools
  - Verify with build and automated unit tests
         │
         ▼
[Gemini 3.1 Pro - Head Programmer Review]
  - Security review (no hardcoded secrets, rate limit checked)
  - Code standard & style compliance
  - Sign-off & delivery summary to User
```

## Security & ECC Standards
1. **Never Hardcode Secrets**: Solis API Key ID & Secret Key must only be loaded from environment variables (`.env`) or securely via user settings.
2. **Mock Mode Fallback**: Always ensure mock/demo mode exists so the system can run without live credentials in developer environments.
3. **Fail Loudly & Explicitly**: Authentication failures (e.g. invalid HMAC or clock drift) must report clear, descriptive troubleshooting messages.
