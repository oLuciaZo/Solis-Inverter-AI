'use client';

import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  GitFork,
  BatteryCharging,
  Zap,
  Sun,
  ShieldCheck,
  Bell,
  X,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview', icon: LayoutDashboard },
  { id: 'energy-flow', label: 'Energy Flow', href: '#energy-flow', icon: GitFork },
  { id: 'battery', label: 'Battery', href: '#battery', icon: BatteryCharging },
  { id: 'grid', label: 'Grid', href: '#grid', icon: Zap },
  { id: 'pv-strings', label: 'PV Strings', href: '#pv-strings', icon: Sun },
  { id: 'health', label: 'Health', href: '#health', icon: ShieldCheck },
  { id: 'events', label: 'Events', href: '#events', icon: Bell },
];

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeId,
  onSelect,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const handleNavClick = (id: string) => {
    onSelect(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--surface)] border-r border-[var(--line)] shadow-sm transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-[220px] lg:w-[72px]' : 'w-[220px]'}`}
      >
        {/* Pink-to-purple gradient logo block */}
        <div
          className="h-16 shrink-0 flex items-center justify-between px-4 text-white"
          style={{ background: 'var(--g-logo)' }}
        >
          <a
            href="#overview"
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-2.5 min-w-0"
          >
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span
              className={`font-bold text-base tracking-tight truncate ${
                collapsed ? 'lg:hidden' : 'block'
              }`}
            >
              Solis NOC
            </span>
          </a>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-md text-white/90 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav aria-label="Dashboard sections" className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={() => handleNavClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-l-[3px] ${
                      isActive
                        ? 'border-[#f0418c] text-[#f0418c] bg-[#f0418c]/[0.06] font-semibold'
                        : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]/60'
                    } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isActive ? 'text-[#f0418c]' : 'text-[var(--muted)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={collapsed ? 'lg:hidden' : 'truncate'}>
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer note */}
        <div
          className={`p-4 border-t border-[var(--line)] text-[11px] text-[var(--muted)] ${
            collapsed ? 'lg:hidden' : 'block'
          }`}
        >
          <div className="font-semibold text-[var(--text)]">SolisCloud V2.0.3</div>
          <div>NOC Telemetry Monitor</div>
        </div>
      </aside>
    </>
  );
}
