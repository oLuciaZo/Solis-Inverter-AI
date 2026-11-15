'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cpu, Bot, Sparkles } from 'lucide-react';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sse' | 'rest' | 'stdio'>('sse');

  if (!isOpen) return null;

  const sseConfig = `{
  "mcpServers": {
    "solis-inverter": {
      "url": "http://localhost:1234/sse"
    }
  }
}`;

  const restCurlExample = `curl -X POST http://localhost:1234/call \\
  -H "Content-Type: application/json" \\
  -d '{"name": "solis_get_telemetry"}'`;

  const mcpConfig = `{
  "mcpServers": {
    "solis-inverter": {
      "command": "node",
      "args": [
        "/path/to/Solis-Inverter AI/backend/dist/mcp-runner.js"
      ],
      "env": {
        "SOLIS_API_URL": "https://www.soliscloud.com:13333",
        "SOLIS_KEY_ID": "YOUR_SOLIS_KEY_ID",
        "SOLIS_KEY_SECRET": "YOUR_SOLIS_KEY_SECRET",
        "SOLIS_STATION_ID": "YOUR_STATION_ID",
        "SOLIS_INVERTER_SN": "YOUR_INVERTER_SN",
        "SOLIS_MOCK_MODE": "false"
      }
    }
  }
}`;

  const currentSnippet =
    activeTab === 'sse' ? sseConfig : activeTab === 'rest' ? restCurlExample : mcpConfig;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-8 shadow-xl text-[var(--text)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close MCP modal"
          className="absolute top-5 right-5 p-2 rounded-md bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg text-white flex items-center justify-center shrink-0"
            style={{ background: 'var(--g-logo)' }}
          >
            <Cpu className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="mcp-modal-title" className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              Model Context Protocol (MCP) Connector
              <Sparkles className="w-4 h-4 text-[#f0418c]" aria-hidden="true" />
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Integrate your live Solis Inverter directly into Claude Desktop, Cursor, or AI Assistants.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 mt-4 border-b border-[var(--line)] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('sse')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'sse'
                ? 'bg-[#f0418c]/10 border border-[#f0418c]/40 text-[#f0418c] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            MCP SSE (Port 1234)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'rest'
                ? 'bg-[#f0418c]/10 border border-[#f0418c]/40 text-[#f0418c] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Direct REST / Gemini Spark
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stdio')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'stdio'
                ? 'bg-[#f0418c]/10 border border-[#f0418c]/40 text-[#f0418c] font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Local Stdio Runner
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#f0418c]" aria-hidden="true" />
              {activeTab === 'sse' && 'MCP SSE Config (Gemini Spark / Cursor / Antigravity):'}
              {activeTab === 'rest' && 'Direct REST Function Calling (Port 1234):'}
              {activeTab === 'stdio' && 'Claude Desktop Local Stdio Config:'}
            </h4>
            <p className="text-[var(--muted)] mb-2">
              {activeTab === 'sse' && (
                <>
                  Connect any MCP client to:{' '}
                  <code className="text-[#f0418c] bg-pink-50 px-1.5 py-0.5 rounded num">
                    http://localhost:1234/sse
                  </code>
                </>
              )}
              {activeTab === 'rest' && (
                <>
                  Execute tools via HTTP POST:{' '}
                  <code className="text-[#f0418c] bg-pink-50 px-1.5 py-0.5 rounded num">
                    http://localhost:1234/call
                  </code>
                </>
              )}
              {activeTab === 'stdio' && (
                <>
                  Add to{' '}
                  <code className="text-[#f0418c] bg-pink-50 px-1.5 py-0.5 rounded num">
                    claude_desktop_config.json
                  </code>
                </>
              )}
            </p>

            <div className="relative">
              <pre className="p-4 rounded-lg bg-[#2f3546] text-gray-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {currentSnippet}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#f0418c] hover:bg-[#d9337a] text-white font-medium text-xs shadow-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Config'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
            <h4 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#8e5fd6]" aria-hidden="true" /> Available MCP Tools for Claude &amp; AI:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--muted)]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0418c]" />
                <code className="text-[var(--text)] font-medium">solis_get_overview</code> - Capacity &amp; weather
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0418c]" />
                <code className="text-[var(--text)] font-medium">solis_get_telemetry</code> - Voltage, freq, temp
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0418c]" />
                <code className="text-[var(--text)] font-medium">solis_get_energy_flow</code> - Real-time kW
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0418c]" />
                <code className="text-[var(--text)] font-medium">solis_get_battery_status</code> - SOC &amp; health
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0418c]" />
                <code className="text-[var(--text)] font-medium">solis_get_daily_curve</code> - 24hr curves
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0418c]" />
                <code className="text-[var(--text)] font-medium">solis_get_alarms</code> - Fault alerts
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[var(--muted)]">
              Tip: Ask Claude &quot;How much solar energy have I generated today and is my battery full?&quot;
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-[#f0418c] hover:bg-[#d9337a] text-white font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
