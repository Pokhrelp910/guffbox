// GuffBox Cricket Studio — Premium TV Broadcast Wagon Wheel & Pitch Map Suite

import React, { useState } from 'react';
import { InningsState, Team } from '../core/types';
import {
  CRICKET_SHOT_SECTORS,
  resolveDeliveryShotZone,
  resolveDeliveryPitchLength,
  calculateShotCoordinates,
} from '../utils/wagonWheelHelper';
import { X, Filter, BarChart3, Target, Disc3 } from 'lucide-react';

interface WagonWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  innings: InningsState;
  battingTeam: Team;
  bowlingTeam: Team;
}

export const WagonWheelModal: React.FC<WagonWheelModalProps> = ({
  isOpen,
  onClose,
  innings,
  battingTeam,
  bowlingTeam,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'wagon' | 'pitch' | 'manhattan'>('wagon');
  const [selectedBatterId, setSelectedBatterId] = useState<string>('all');
  const [shotFilter, setShotFilter] = useState<'all' | 'boundaries' | 'dots' | 'wickets'>('all');

  const batters = Object.values(innings.batterStats);
  const deliveries = innings.deliveries;

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((del) => {
    if (selectedBatterId !== 'all' && del.strikerId !== selectedBatterId) return false;
    if (shotFilter === 'boundaries' && !del.isFour && !del.isSix) return false;
    if (shotFilter === 'dots' && (del.runsBat > 0 || del.runsExtras > 0 || del.wicket)) return false;
    if (shotFilter === 'wickets' && !del.wicket) return false;
    return true;
  });

  // Calculate Manhattan over totals
  const maxOvers = Math.max(1, Math.ceil(innings.legalBalls / 6));
  const overRuns: { overIndex: number; runs: number; wickets: number }[] = [];
  for (let o = 0; o < maxOvers; o++) {
    const overDeliveries = deliveries.filter((d) => d.overIndex === o);
    const runs = overDeliveries.reduce((sum, d) => sum + d.runsBat + d.runsExtras, 0);
    const wickets = overDeliveries.filter((d) => Boolean(d.wicket)).length;
    overRuns.push({ overIndex: o + 1, runs, wickets });
  }

  // Summary stats for filtered batter
  const totalFilteredRuns = filteredDeliveries.reduce((sum, d) => sum + d.runsBat, 0);
  const totalFours = filteredDeliveries.filter((d) => d.isFour).length;
  const totalSixes = filteredDeliveries.filter((d) => d.isSix).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        background: 'rgba(2, 4, 12, 0.88)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="w-full max-w-5xl border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        style={{
          background: 'linear-gradient(145deg, #070d1e 0%, #1c050a 100%)',
          borderColor: '#facc15',
          boxShadow: '0 0 50px rgba(0,0,0,0.9), 0 0 30px rgba(250,204,21,0.2)',
        }}
      >
        {/* ═══ MODAL HEADER ═══ */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: 'linear-gradient(90deg, rgba(8,16,38,0.98) 0%, rgba(32,5,11,0.98) 50%, rgba(8,16,38,0.98) 100%)',
            borderColor: 'rgba(250,204,21,0.25)',
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center font-black text-slate-950 font-['Teko'] text-2xl shadow">
              GB
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider text-yellow-400 font-['Teko'] uppercase">
                CRICKET BROADCAST ANALYTICS
              </h2>
              <p className="text-xs text-white/80 -mt-1 font-medium">
                {battingTeam.name} vs {bowlingTeam.name} • Innings {innings.inningsNumber}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-[#050914] p-1 rounded-xl border border-yellow-500/30 text-xs">
            <button
              onClick={() => setActiveTab('wagon')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'wagon'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow'
                  : 'text-white hover:text-yellow-300'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span>Wagon Wheel</span>
            </button>
            <button
              onClick={() => setActiveTab('pitch')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'pitch'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow'
                  : 'text-white hover:text-yellow-300'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Pitch Map</span>
            </button>
            <button
              onClick={() => setActiveTab('manhattan')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'manhattan'
                  ? 'bg-yellow-400 text-slate-950 font-black shadow'
                  : 'text-white hover:text-yellow-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Manhattan</span>
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-red-950 hover:bg-red-900 text-yellow-300 hover:text-white flex items-center justify-center transition border border-yellow-500/40 cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ═══ FILTER TOOLBAR ═══ */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-[#060b1c]/90 border-b border-yellow-500/20 gap-3 text-xs">
          {/* Batter Selector */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-white font-semibold">Batter:</span>
            <select
              value={selectedBatterId}
              onChange={(e) => setSelectedBatterId(e.target.value)}
              className="bg-[#081026] text-yellow-300 font-bold px-3 py-1 rounded-lg border border-yellow-500/40 outline-none cursor-pointer"
            >
              <option value="all">All Batters (Team Total: {innings.totalRuns} runs)</option>
              {batters.map((b) => (
                <option key={b.playerId} value={b.playerId}>
                  {b.name} ({b.runs} off {b.ballsFaced}b • 4s:{b.fours} 6s:{b.sixes})
                </option>
              ))}
            </select>
          </div>

          {/* Shot Filter Pills */}
          <div className="flex items-center space-x-1">
            <span className="text-white/80 font-semibold mr-1">Shots:</span>
            {(['all', 'boundaries', 'dots', 'wickets'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setShotFilter(filter)}
                className={`px-2.5 py-1 rounded-lg capitalize font-bold transition cursor-pointer ${
                  shotFilter === filter
                    ? 'bg-yellow-400 text-slate-950 font-black shadow'
                    : 'text-white hover:text-yellow-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="text-white">
              Filtered: <strong className="text-yellow-400">{totalFilteredRuns}</strong> runs ({filteredDeliveries.length} balls)
            </span>
            <span className="text-white font-bold">4s: <strong className="text-white">{totalFours}</strong></span>
            <span className="text-yellow-300 font-bold">6s: <strong className="text-yellow-300">{totalSixes}</strong></span>
          </div>
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center">

          {/* ── TAB 1: WAGON WHEEL ── */}
          {activeTab === 'wagon' && (
            <div className="relative flex flex-col items-center w-full">
              <svg
                viewBox="0 0 540 540"
                className="w-full max-w-[500px] h-auto drop-shadow-2xl"
              >
                <defs>
                  {/* Radial Grass Gradient */}
                  <radialGradient id="grassGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0b381a" />
                    <stop offset="70%" stopColor="#062812" />
                    <stop offset="100%" stopColor="#03160a" />
                  </radialGradient>
                  {/* Glow filter for boundary lines */}
                  <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Outer Field Circle */}
                <circle cx="270" cy="270" r="240" fill="url(#grassGrad)" stroke="#1e293b" strokeWidth="2" />

                {/* Boundary Rope */}
                <circle cx="270" cy="270" r="220" fill="none" stroke="#facc15" strokeWidth="2.5" strokeOpacity="0.4" />
                <circle cx="270" cy="270" r="222" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="6,4" strokeOpacity="0.3" />

                {/* 30-Yard Circle */}
                <circle cx="270" cy="270" r="130" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,6" strokeOpacity="0.35" />

                {/* Sector Guideline Rays */}
                {CRICKET_SHOT_SECTORS.map((sec) => {
                  const rad = ((sec.angleDeg - 90) * Math.PI) / 180;
                  const x = 270 + 220 * Math.cos(rad);
                  const y = 270 + 220 * Math.sin(rad);
                  return (
                    <g key={sec.zone}>
                      <line x1="270" y1="270" x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      {/* Label outside circle */}
                      <text
                        x={270 + 235 * Math.cos(rad)}
                        y={270 + 235 * Math.sin(rad) + 4}
                        fill="rgba(255,255,255,0.6)"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="Inter, sans-serif"
                      >
                        {sec.label}
                      </text>
                    </g>
                  );
                })}

                {/* Center Pitch */}
                <rect x="264" y="246" width="12" height="48" fill="#a16207" rx="2" stroke="#ca8a04" strokeWidth="1" />
                {/* Batting Crease & Bowling Crease */}
                <line x1="262" y1="256" x2="278" y2="256" stroke="#ffffff" strokeWidth="1.2" />
                <line x1="262" y1="284" x2="278" y2="284" stroke="#ffffff" strokeWidth="1.2" />

                {/* Shot Vectors Plotted */}
                {filteredDeliveries.map((del, idx) => {
                  if (del.runsBat === 0 && !del.wicket) return null; // Hide pure dots in wheel

                  const zone = resolveDeliveryShotZone(del, idx);
                  const coords = calculateShotCoordinates(
                    270,
                    270,
                    220,
                    zone,
                    del.runsBat,
                    del.isFour,
                    del.isSix,
                    idx * 17
                  );

                  let strokeColor = '#cbd5e1';
                  let strokeWidth = 1.5;
                  let filter = undefined;

                  if (del.isSix) {
                    strokeColor = '#facc15';
                    strokeWidth = 3;
                    filter = 'url(#glowGold)';
                  } else if (del.isFour) {
                    strokeColor = '#38bdf8';
                    strokeWidth = 2.5;
                    filter = 'url(#glowBlue)';
                  } else if (del.wicket) {
                    strokeColor = '#ef4444';
                    strokeWidth = 2;
                  }

                  return (
                    <g key={del.id}>
                      <line
                        x1="270"
                        y1="270"
                        x2={coords.x}
                        y2={coords.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        filter={filter}
                        opacity={del.isSix || del.isFour ? 0.95 : 0.65}
                      />
                      {/* End marker dot or Wicket X */}
                      {del.wicket ? (
                        <circle cx={coords.x} cy={coords.y} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                      ) : (
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={del.isSix ? 4 : del.isFour ? 3 : 2}
                          fill={strokeColor}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend Bar */}
              <div className="flex items-center space-x-6 mt-4 text-xs font-bold text-white">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,1)]" />
                  <span className="text-yellow-400">Sixes (6)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]" />
                  <span className="text-white">Fours (4)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-1 bg-yellow-200 rounded-full" />
                  <span className="text-yellow-200">Singles / 2s / 3s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <span className="text-white">Wickets</span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: PITCH MAP ── */}
          {activeTab === 'pitch' && (
            <div className="flex flex-col items-center w-full max-w-xl">
              <div className="w-full bg-[#081026] border border-yellow-500/30 rounded-2xl p-4 shadow-xl">
                <div className="text-center font-bold text-sm text-yellow-400 font-['Teko'] uppercase text-xl mb-2">
                  PITCH LANDING LENGTH & LINE DISTRIBUTION
                </div>

                <svg viewBox="0 0 300 480" className="w-full h-auto max-h-[380px] mx-auto">
                  {/* Pitch Turf */}
                  <rect x="50" y="20" width="200" height="440" fill="#78350f" rx="8" stroke="#d97706" strokeWidth="2" />

                  {/* Pitch Length Zones */}
                  {/* 1. Bouncer / Short */}
                  <rect x="50" y="40" width="200" height="80" fill="rgba(239, 68, 68, 0.25)" />
                  <text x="60" y="85" fill="#fca5a5" fontSize="11" fontWeight="bold">SHORT / BOUNCER</text>

                  {/* 2. Back of Length */}
                  <rect x="50" y="120" width="200" height="90" fill="rgba(249, 115, 22, 0.25)" />
                  <text x="60" y="170" fill="#fdba74" fontSize="11" fontWeight="bold">BACK OF LENGTH</text>

                  {/* 3. Good Length */}
                  <rect x="50" y="210" width="200" height="110" fill="rgba(34, 197, 94, 0.25)" />
                  <text x="60" y="270" fill="#86efac" fontSize="11" fontWeight="bold">GOOD LENGTH (CORRIDOR)</text>

                  {/* 4. Full Length */}
                  <rect x="50" y="320" width="200" height="80" fill="rgba(56, 189, 248, 0.25)" />
                  <text x="60" y="365" fill="#7dd3fc" fontSize="11" fontWeight="bold">FULL / DRIVING ZONE</text>

                  {/* 5. Yorker */}
                  <rect x="50" y="400" width="200" height="50" fill="rgba(168, 85, 247, 0.3)" />
                  <text x="60" y="430" fill="#d8b4fe" fontSize="11" fontWeight="bold">YORKER / TOECRUSHER</text>

                  {/* Creases */}
                  <line x1="50" y1="40" x2="250" y2="40" stroke="#ffffff" strokeWidth="2" />
                  <line x1="50" y1="440" x2="250" y2="440" stroke="#ffffff" strokeWidth="2" />

                  {/* Stumps */}
                  <circle cx="140" cy="445" r="2.5" fill="#ffffff" />
                  <circle cx="150" cy="445" r="2.5" fill="#ffffff" />
                  <circle cx="160" cy="445" r="2.5" fill="#ffffff" />

                  {/* Plotted Pitch Landing Dots */}
                  {filteredDeliveries.map((del, idx) => {
                    const len = resolveDeliveryPitchLength(del, idx);
                    let y = 260; // good length default
                    if (len === 'short') y = 70 + (idx % 45);
                    else if (len === 'back_of_length') y = 145 + (idx % 50);
                    else if (len === 'good_length') y = 235 + (idx % 65);
                    else if (len === 'full') y = 345 + (idx % 45);
                    else if (len === 'yorker') y = 415 + (idx % 25);

                    // X coordinate across off/stump/leg corridor
                    const x = 110 + ((idx * 29) % 80);

                    const dotColor = del.wicket
                      ? '#ef4444'
                      : del.isSix
                      ? '#facc15'
                      : del.isFour
                      ? '#38bdf8'
                      : del.runsBat > 0
                      ? '#ffffff'
                      : '#94a3b8';

                    return (
                      <g key={del.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill={dotColor}
                          stroke="#000"
                          strokeWidth="1"
                          opacity="0.85"
                        />
                        <text
                          x={x}
                          y={y + 3}
                          fill="#000"
                          fontSize="7"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {del.wicket ? 'W' : del.runsBat}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* ── TAB 3: MANHATTAN CHART ── */}
          {activeTab === 'manhattan' && (
            <div className="w-full max-w-4xl bg-[#081026] border border-yellow-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-black text-yellow-400 font-['Teko'] uppercase">
                  MANHATTAN OVER-BY-OVER PROGRESSION
                </div>
                <div className="text-xs text-white">
                  Total Innings Runs: <span className="text-yellow-400 font-bold">{innings.totalRuns}/{innings.totalWickets}</span>
                </div>
              </div>

              {/* Manhattan Bars Container */}
              <div className="h-64 flex items-end justify-between gap-1.5 px-4 pb-2 border-b border-yellow-500/20">
                {overRuns.map((ov) => {
                  const maxChartHeight = 220;
                  const barHeight = Math.max(12, Math.min(maxChartHeight, ov.runs * 9));
                  return (
                    <div key={ov.overIndex} className="flex-1 flex flex-col items-center justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[#050914] border border-yellow-500/40 text-yellow-300 text-[10px] font-bold px-2 py-1 rounded shadow pointer-events-none transition">
                        Over {ov.overIndex}: {ov.runs}r {ov.wickets > 0 ? `(${ov.wickets}w)` : ''}
                      </div>

                      {/* Wicket Marker */}
                      {ov.wickets > 0 && (
                        <div className="w-4 h-4 rounded-full bg-red-600 border border-yellow-400 text-white text-[9px] font-black flex items-center justify-center mb-1 shadow animate-bounce">
                          {ov.wickets}W
                        </div>
                      )}

                      {/* Runs label on top */}
                      <span className="text-[10px] font-bold text-yellow-300 mb-0.5">
                        {ov.runs}
                      </span>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          ov.runs >= 15
                            ? 'bg-gradient-to-t from-yellow-600 to-yellow-400'
                            : ov.runs >= 10
                            ? 'bg-gradient-to-t from-blue-900 to-blue-600'
                            : 'bg-gradient-to-t from-red-950 to-red-800'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />

                      {/* Over number label */}
                      <span className="text-[10px] font-bold text-white/70 mt-1.5">
                        {ov.overIndex}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-white/80 mt-3 pt-2">
                <span>Horizontal Axis: Overs 1 to {maxOvers}</span>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-yellow-400" />
                    <span className="text-yellow-400">Big Over (15+ runs)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-red-600" />
                    <span className="text-white">Wickets</span>
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
