'use client';

import { Battery, BatteryCharging, Cpu, Home, Sun, Zap } from 'lucide-react';
import './energy-flow.css';

export interface EnergyFlowDiagramProps {
  pvKw: number;
  loadKw: number;
  /** +export, -import */
  gridKw: number;
  /** +charge, -discharge */
  batteryKw: number;
  batterySoc: number;
  batteryState: 'charging' | 'discharging' | 'idle' | 'full';
  gridState: 'importing' | 'exporting' | 'idle';
}

const IDLE_THRESHOLD_KW = 0.05;

const COLORS = {
  solar: '#ff9a3c',
  grid: '#4aa8ee',
  battery: '#7a4fd0',
  home: '#ec4899',
  hubStart: '#f0418c',
  hubEnd: '#9b59d0',
  track: '#e9e6f2',
  idleStroke: '#c9c4d8',
  surface: '#ffffff',
  text: '#2b2f3a',
  muted: '#8a8fa3',
} as const;

interface FlowLineSpec {
  id: string;
  d: string;
  color: string;
  markerId: string;
  kw: number;
  reverse: boolean;
}

function formatKw(kw: number): string {
  return `${Math.abs(kw).toFixed(2)} kW`;
}

function getDurationSec(kw: number): number {
  return Math.min(6, Math.max(1.2, 6 / (0.4 + Math.abs(kw))));
}

function getParticleCount(kw: number): number {
  const abs = Math.abs(kw);
  if (abs < 1.2) return 3;
  if (abs < 3.5) return 4;
  return 5;
}

function getGridCaption(
  gridKw: number,
  gridState: EnergyFlowDiagramProps['gridState']
): string {
  if (Math.abs(gridKw) < IDLE_THRESHOLD_KW) {
    return gridState === 'idle' ? 'No exchange' : 'idle';
  }
  return gridKw > 0 ? 'Exporting' : 'Importing';
}

function getBatteryCaption(
  batteryKw: number,
  batteryState: EnergyFlowDiagramProps['batteryState']
): string {
  if (Math.abs(batteryKw) < IDLE_THRESHOLD_KW) {
    return batteryState === 'full' ? 'Full · standby' : 'idle';
  }
  return batteryKw > 0 ? 'Charging' : 'Discharging';
}

function buildAriaLabel(props: EnergyFlowDiagramProps): string {
  const { pvKw, loadKw, gridKw, batteryKw, batterySoc, batteryState, gridState } = props;
  const solarPart =
    pvKw >= IDLE_THRESHOLD_KW ? `Solar ${pvKw.toFixed(1)} kW generating` : 'Solar idle';
  const homePart =
    loadKw >= IDLE_THRESHOLD_KW ? `home ${loadKw.toFixed(1)} kW` : 'home idle';

  const batCap = getBatteryCaption(batteryKw, batteryState).toLowerCase();
  const batteryPart =
    Math.abs(batteryKw) >= IDLE_THRESHOLD_KW
      ? `battery ${batCap} ${Math.abs(batteryKw).toFixed(1)} kW (${Math.round(batterySoc)}%)`
      : `battery ${batCap} (${Math.round(batterySoc)}%)`;

  const gridCap = getGridCaption(gridKw, gridState).toLowerCase();
  const gridPart =
    Math.abs(gridKw) >= IDLE_THRESHOLD_KW
      ? `grid ${gridCap} ${Math.abs(gridKw).toFixed(1)} kW`
      : `grid ${gridCap}`;

  return `${solarPart} to ${homePart}; ${batteryPart}; ${gridPart}`;
}

export function EnergyFlowDiagram(props: EnergyFlowDiagramProps) {
  const { pvKw, loadKw, gridKw, batteryKw, batterySoc, batteryState, gridState } = props;

  const clampedSoc = Math.min(100, Math.max(0, batterySoc));
  const socRadius = 39;
  const socCircumference = 2 * Math.PI * socRadius;
  const socDashOffset = socCircumference * (1 - clampedSoc / 100);

  const solarActive = pvKw >= IDLE_THRESHOLD_KW;
  const loadActive = loadKw >= IDLE_THRESHOLD_KW;
  const gridActive = Math.abs(gridKw) >= IDLE_THRESHOLD_KW;
  const batteryActive = Math.abs(batteryKw) >= IDLE_THRESHOLD_KW;
  const anyFlow = solarActive || loadActive || gridActive || batteryActive;

  const lines: FlowLineSpec[] = [
    {
      id: 'noc-path-solar',
      d: 'M 222 86 C 258 106, 276 122, 294 140',
      color: COLORS.solar,
      markerId: 'noc-arrow-solar',
      kw: pvKw,
      reverse: false,
    },
    {
      id: 'noc-path-grid',
      d: 'M 280 166 C 228 148, 174 148, 122 166',
      color: COLORS.grid,
      markerId: 'noc-arrow-grid',
      kw: gridKw,
      reverse: gridKw < 0,
    },
    {
      id: 'noc-path-battery',
      d: 'M 320 206 C 342 224, 342 244, 320 262',
      color: COLORS.battery,
      markerId: 'noc-arrow-battery',
      kw: batteryKw,
      reverse: batteryKw < 0,
    },
    {
      id: 'noc-path-home',
      d: 'M 360 166 C 412 148, 466 148, 518 166',
      color: COLORS.home,
      markerId: 'noc-arrow-home',
      kw: loadKw,
      reverse: false,
    },
  ];

  const solarCaption = solarActive ? 'Generating' : 'idle';
  const homeCaption = loadActive ? 'Consuming' : 'idle';
  const gridCaption = getGridCaption(gridKw, gridState);
  const batteryCaption = getBatteryCaption(batteryKw, batteryState);

  const monoStyle = {
    fontFamily: 'var(--font-mono), "JetBrains Mono", ui-monospace, monospace',
    fontVariantNumeric: 'tabular-nums' as const,
  };

  return (
    <div className="w-full select-none">
      <svg
        viewBox="0 0 640 380"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={buildAriaLabel(props)}
      >
        <defs>
          <linearGradient id="noc-hub-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.hubStart} />
            <stop offset="100%" stopColor={COLORS.hubEnd} />
          </linearGradient>

          <filter id="noc-particle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {[
            { id: 'noc-arrow-solar', color: COLORS.solar },
            { id: 'noc-arrow-grid', color: COLORS.grid },
            { id: 'noc-arrow-battery', color: COLORS.battery },
            { id: 'noc-arrow-home', color: COLORS.home },
          ].map((m) => (
            <marker
              key={m.id}
              id={m.id}
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill={m.color} />
            </marker>
          ))}
        </defs>

        {/* Power lines & particles */}
        {lines.map((line) => {
          const isActive = Math.abs(line.kw) >= IDLE_THRESHOLD_KW;
          const dur = getDurationSec(line.kw);
          const count = getParticleCount(line.kw);

          return (
            <g key={line.id}>
              {/* Base track */}
              <path
                id={line.id}
                d={line.d}
                fill="none"
                stroke={isActive ? COLORS.track : COLORS.idleStroke}
                strokeWidth={isActive ? 4 : 2.5}
                strokeDasharray={isActive ? undefined : '5 5'}
                strokeLinecap="round"
              />

              {isActive && (
                <>
                  {/* Active coloured overlay */}
                  <path
                    d={line.d}
                    fill="none"
                    stroke={line.color}
                    strokeOpacity={0.38}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                  />

                  {/* Static directional arrowheads for prefers-reduced-motion */}
                  <path
                    d={line.d}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    className="noc-flow-reduced-arrows"
                    markerEnd={line.reverse ? undefined : `url(#${line.markerId})`}
                    markerStart={line.reverse ? `url(#${line.markerId})` : undefined}
                  />

                  {/* Moving glowing particles */}
                  <g className="noc-flow-particles" filter="url(#noc-particle-glow)">
                    {Array.from({ length: count }).map((_, idx) => (
                      <circle key={idx} r={4} fill={line.color}>
                        <animateMotion
                          dur={`${dur.toFixed(2)}s`}
                          repeatCount="indefinite"
                          keyPoints={line.reverse ? '1;0' : '0;1'}
                          keyTimes="0;1"
                          calcMode="linear"
                          begin={`${(-(dur / count) * idx).toFixed(2)}s`}
                        >
                          <mpath href={`#${line.id}`} />
                        </animateMotion>
                      </circle>
                    ))}
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Solar Node (top centre-left) */}
        <g>
          {solarActive && (
            <circle
              cx={195}
              cy={68}
              r={37}
              fill={COLORS.solar}
              className="noc-node-glow"
            />
          )}
          <circle
            cx={195}
            cy={68}
            r={32}
            fill={COLORS.surface}
            stroke={COLORS.solar}
            strokeWidth={3}
          />
          <Sun x={183} y={56} width={24} height={24} color={COLORS.solar} strokeWidth={2} />
          <text
            x={195}
            y={25}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={COLORS.muted}
          >
            SOLAR PV
          </text>
          <text
            x={152}
            y={64}
            textAnchor="end"
            fontSize={15}
            fontWeight={700}
            fill={COLORS.text}
            style={monoStyle}
          >
            {formatKw(pvKw)}
          </text>
          <text
            x={152}
            y={80}
            textAnchor="end"
            fontSize={11.5}
            fontWeight={500}
            fill={solarActive ? COLORS.solar : COLORS.muted}
          >
            {solarCaption}
          </text>
        </g>

        {/* Grid Node (left) */}
        <g>
          {gridActive && (
            <circle
              cx={88}
              cy={166}
              r={37}
              fill={COLORS.grid}
              className="noc-node-glow"
            />
          )}
          <circle
            cx={88}
            cy={166}
            r={32}
            fill={COLORS.surface}
            stroke={COLORS.grid}
            strokeWidth={3}
          />
          <Zap x={76} y={154} width={24} height={24} color={COLORS.grid} strokeWidth={2} />
          <text
            x={88}
            y={123}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={COLORS.muted}
          >
            GRID
          </text>
          <text
            x={88}
            y={217}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={COLORS.text}
            style={monoStyle}
          >
            {formatKw(gridKw)}
          </text>
          <text
            x={88}
            y={233}
            textAnchor="middle"
            fontSize={11.5}
            fontWeight={500}
            fill={gridActive ? COLORS.grid : COLORS.muted}
          >
            {gridCaption}
          </text>
        </g>

        {/* Inverter Hub (centre) */}
        <g>
          {anyFlow && (
            <circle
              cx={320}
              cy={166}
              r={44}
              fill="url(#noc-hub-gradient)"
              className="noc-node-glow"
            />
          )}
          <circle
            cx={320}
            cy={166}
            r={43}
            fill="none"
            stroke="url(#noc-hub-gradient)"
            strokeWidth={1.75}
            strokeDasharray="5 5"
            className="noc-hub-ring"
          />
          <circle
            cx={320}
            cy={166}
            r={36}
            fill={COLORS.surface}
            stroke="url(#noc-hub-gradient)"
            strokeWidth={3.5}
          />
          <Cpu
            x={308}
            y={146}
            width={24}
            height={24}
            color={COLORS.hubStart}
            strokeWidth={2}
          />
          <text
            x={320}
            y={184}
            textAnchor="middle"
            fontSize={9.5}
            fontWeight={700}
            letterSpacing="0.06em"
            fill={COLORS.text}
          >
            INVERTER
          </text>
        </g>

        {/* Home Node (right) */}
        <g>
          {loadActive && (
            <circle
              cx={552}
              cy={166}
              r={37}
              fill={COLORS.home}
              className="noc-node-glow"
            />
          )}
          <circle
            cx={552}
            cy={166}
            r={32}
            fill={COLORS.surface}
            stroke={COLORS.home}
            strokeWidth={3}
          />
          <Home x={540} y={154} width={24} height={24} color={COLORS.home} strokeWidth={2} />
          <text
            x={552}
            y={123}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={COLORS.muted}
          >
            HOME LOAD
          </text>
          <text
            x={552}
            y={217}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={COLORS.text}
            style={monoStyle}
          >
            {formatKw(loadKw)}
          </text>
          <text
            x={552}
            y={233}
            textAnchor="middle"
            fontSize={11.5}
            fontWeight={500}
            fill={loadActive ? COLORS.home : COLORS.muted}
          >
            {homeCaption}
          </text>
        </g>

        {/* Battery Node (bottom) with SOC arc ring */}
        <g>
          {batteryActive && (
            <circle
              cx={320}
              cy={302}
              r={43}
              fill={COLORS.battery}
              className="noc-node-glow"
            />
          )}
          {/* SOC background track */}
          <circle
            cx={320}
            cy={302}
            r={socRadius}
            fill="none"
            stroke={COLORS.track}
            strokeWidth={4}
          />
          {/* SOC progress arc */}
          <circle
            cx={320}
            cy={302}
            r={socRadius}
            fill="none"
            stroke={COLORS.battery}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={socCircumference}
            strokeDashoffset={socDashOffset}
            transform="rotate(-90 320 302)"
          />
          <circle
            cx={320}
            cy={302}
            r={33}
            fill={COLORS.surface}
            stroke={COLORS.battery}
            strokeWidth={2}
            strokeOpacity={0.25}
          />
          {batteryState === 'charging' ? (
            <BatteryCharging
              x={309}
              y={280}
              width={22}
              height={22}
              color={COLORS.battery}
              strokeWidth={2}
            />
          ) : (
            <Battery
              x={309}
              y={280}
              width={22}
              height={22}
              color={COLORS.battery}
              strokeWidth={2}
            />
          )}
          <text
            x={320}
            y={319}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill={COLORS.battery}
            style={monoStyle}
          >
            {Math.round(clampedSoc)}%
          </text>
          <text
            x={320}
            y={356}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            fill={COLORS.text}
            style={monoStyle}
          >
            {formatKw(batteryKw)}
          </text>
          <text
            x={320}
            y={372}
            textAnchor="middle"
            fontSize={11.5}
            fontWeight={500}
            fill={batteryActive ? COLORS.battery : COLORS.muted}
          >
            {batteryCaption}
          </text>
        </g>
      </svg>

      <p className="mt-2 text-center text-xs text-[#8a8fa3]">
        ● moving dots = power flow · faster = more kW · grey dashed = no flow
      </p>
    </div>
  );
}
