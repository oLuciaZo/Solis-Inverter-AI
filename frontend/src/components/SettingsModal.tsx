'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Key, Hash, Server, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMock: boolean;
  onSaveConfig: (config: { keyId: string; secret: string; stationId: string; inverterSn: string }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMock,
  onSaveConfig,
}) => {
  const [keyId, setKeyId] = useState('');
  const [secret, setSecret] = useState('');
  const [stationId, setStationId] = useState('');
  const [inverterSn, setInverterSn] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({ keyId, secret, stationId, inverterSn });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-glow bg-slate-900/95 border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">SolisCloud API Credentials</h3>
            <p className="text-xs text-slate-400">Configure your SolisCloud Platform V2.0.3 API Access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-slate-300">
            <p className="font-semibold text-blue-300 mb-1">Where to get credentials:</p>
            <p className="text-slate-400">
              Log in to <span className="text-blue-300 underline">soliscloud.com</span> &rarr; Account &rarr; Basic Settings &rarr; API Management to generate your API ID and Key Secret.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">API ID (Key ID)</label>
            <input
              type="text"
              placeholder="e.g. 1300386381676644416"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">API Secret (Key Secret)</label>
            <input
              type="password"
              placeholder="Your SolisCloud Secret Key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Station ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 1298491919448631809"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Inverter Serial (SN)</label>
              <input
                type="text"
                placeholder="e.g. 120B40198150131"
                value={inverterSn}
                onChange={(e) => setInverterSn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              HMAC-SHA1 & MD5 Encrypted
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
              >
                {saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                <span>{saved ? 'Saved!' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
