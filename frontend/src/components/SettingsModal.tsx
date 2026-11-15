'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Key, CheckCircle2 } from 'lucide-react';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl bg-[var(--surface)] border border-[var(--line)] p-6 sm:p-8 shadow-xl text-[var(--text)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings modal"
          className="absolute top-5 right-5 p-2 rounded-md bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg text-white flex items-center justify-center shrink-0"
            style={{ background: 'var(--g-solar)' }}
          >
            <Key className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="settings-modal-title" className="text-lg font-bold text-[var(--text)]">
              SolisCloud API Credentials
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Configure your SolisCloud Platform V2.0.3 API Access ({isMock ? 'Currently Mock Mode' : 'Live Mode'})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--text)]">
            <p className="font-semibold mb-1">Where to get credentials:</p>
            <p className="text-[var(--muted)]">
              Log in to <span className="text-[#f0418c] font-medium">soliscloud.com</span> &rarr; Account &rarr; Basic Settings &rarr; API Management to generate your API ID and Key Secret.
            </p>
          </div>

          <div>
            <label htmlFor="solis-key-id" className="block font-semibold text-[var(--text)] mb-1">
              API ID (Key ID)
            </label>
            <input
              id="solis-key-id"
              type="text"
              placeholder="e.g. 1300386381676644416"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md bg-white border border-[var(--line)] text-[var(--text)] num focus:outline-none focus:border-[#f0418c]"
            />
          </div>

          <div>
            <label htmlFor="solis-key-secret" className="block font-semibold text-[var(--text)] mb-1">
              API Secret (Key Secret)
            </label>
            <input
              id="solis-key-secret"
              type="password"
              placeholder="Your SolisCloud Secret Key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-md bg-white border border-[var(--line)] text-[var(--text)] num focus:outline-none focus:border-[#f0418c]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="solis-station-id" className="block font-semibold text-[var(--text)] mb-1">
                Station ID (Optional)
              </label>
              <input
                id="solis-station-id"
                type="text"
                placeholder="e.g. 1298491919448631809"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-white border border-[var(--line)] text-[var(--text)] num focus:outline-none focus:border-[#f0418c]"
              />
            </div>
            <div>
              <label htmlFor="solis-inverter-sn" className="block font-semibold text-[var(--text)] mb-1">
                Inverter Serial (SN)
              </label>
              <input
                id="solis-inverter-sn"
                type="text"
                placeholder="e.g. 120B40198150131"
                value={inverterSn}
                onChange={(e) => setInverterSn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-white border border-[var(--line)] text-[var(--text)] num focus:outline-none focus:border-[#f0418c]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
            <span className="text-[var(--muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#22c55e]" aria-hidden="true" />
              HMAC-SHA1 &amp; MD5 Encrypted
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-[var(--line)] bg-white hover:bg-[var(--bg)] text-[var(--text)] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#f0418c] hover:bg-[#d9337a] text-white font-semibold transition-colors shadow-xs"
              >
                {saved ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : null}
                <span>{saved ? 'Saved!' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
