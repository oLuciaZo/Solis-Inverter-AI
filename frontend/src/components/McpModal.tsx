'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cpu, Bot, Sparkles, BookOpen } from 'lucide-react';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const mcpConfig = `{
  "mcpServers": {
    "solis-inverter": {
      "command": "node",
      "args": [
        "${process.cwd() || '/Users/sitita/Documents/GitHub/Solis-Inverter AI'}/backend/dist/mcp-runner.js"
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

  const handleCopy = () => {
    navigator.clipboard.writeText(mcpConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel-glow bg-slate-900/95 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Model Context Protocol (MCP) Connector
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Integrate your live Solis Inverter directly into Claude Desktop, Cursor, or AI Assistants.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400" /> Claude Desktop Setup Instructions:
            </h4>
            <p className="text-slate-400 mb-2">
              Add the following block to your Claude Desktop configuration file at:{' '}
              <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>
            </p>

            <div className="relative group">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {mcpConfig}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Config'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
            <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> Available MCP Tools for Claude & AI:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <code>solis_get_overview</code> - Station capacity & weather
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <code>solis_get_telemetry</code> - Voltage, frequency, temp
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <code>solis_get_energy_flow</code> - Real-time solar/battery/grid kW
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <code>solis_get_battery_status</code> - SOC %, health & charge rate
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <code>solis_get_daily_curve</code> - 24hr power curves
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <code>solis_get_alarms</code> - Active inverter fault alerts
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              💡 Tip: Ask Claude &quot;How much solar energy have I generated today and is my battery full?&quot;
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
