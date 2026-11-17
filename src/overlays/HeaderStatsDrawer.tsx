// GuffBox Cricket Studio — Premium Broadcast Header Infographics Drawer v2.0

import React from 'react';
import { Partnership, InningsState, Team } from '../core/types';

interface HeaderStatsDrawerProps {
  partnership: Partnership;
  innings: InningsState;
  battingTeam: Team;
  isVisible: boolean;
  milestoneMessage?: string | null;
}

export const HeaderStatsDrawer: React.FC<HeaderStatsDrawerProps> = ({
  partnership,
  innings,
  battingTeam,
  isVisible,
  milestoneMessage,
}) => {
  const batter1 = innings.batterStats[partnership.batter1Id];
  const batter2 = innings.batterStats[partnership.batter2Id];

  if (!isVisible && !innings.isFreeHitActive && !milestoneMessage) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center pointer-events-none transition-all duration-500 animate-slide-down">

      {/* ── FREE HIT ALERT ── */}
      {innings.isFreeHitActive && (
        <div
          className="relative overflow-hidden rounded-b-2xl px-8 py-2 shadow-2xl flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 40%, #ef4444 50%, #dc2626 60%, #7f1d1d 100%)',
            boxShadow: '0 8px 40px rgba(220,38,38,0.7), 0 0 0 1px rgba(250,204,21,0.4)',
            border: '1px solid rgba(250,204,21,0.5)',
          }}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          />
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span
            className="relative z-10 font-black uppercase tracking-widest"
            style={{
              fontFamily: "'Teko', sans-serif",
              fontSize: '1.3rem',
              color: '#fef3c7',
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
              letterSpacing: '0.15em',
            }}
          >
            FREE HIT
          </span>
          <div
            className="relative z-10 px-3 py-1 rounded-lg text-xs font-bold"
            style={{
              background: 'rgba(250,204,21,0.9)',
              color: '#7f1d1d',
              letterSpacing: '0.05em',
            }}
          >
            Bowler Cannot Dismiss via Bowled · Caught · LBW
          </div>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
        </div>
      )}

      {/* ── MILESTONE BANNER ── */}
      {milestoneMessage && (
        <div
          className="relative overflow-hidden mt-2 rounded-xl px-10 py-2 shadow-2xl flex items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, #78350f 0%, #d97706 20%, #facc15 40%, #fde68a 50%, #facc15 60%, #d97706 80%, #78350f 100%)',
            boxShadow: '0 0 50px rgba(250,204,21,0.7), 0 8px 30px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          {/* Shimmer */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s linear infinite',
            }}
          />
          <span className="relative z-10 text-xl">🏆</span>
          <span
            className="relative z-10 font-black uppercase tracking-widest"
            style={{
              fontFamily: "'Teko', sans-serif",
              fontSize: '1.5rem',
              color: '#1c1917',
              textShadow: '0 1px 4px rgba(255,255,255,0.3)',
              letterSpacing: '0.12em',
            }}
          >
            {milestoneMessage.toUpperCase()}
          </span>
          <span className="relative z-10 text-xl">🏆</span>
        </div>
      )}

      {/* ── PARTNERSHIP STATS CARD ── */}
      {isVisible && (
        <div
          className="mt-2 relative overflow-hidden rounded-xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(4,8,18,0.96) 0%, rgba(10,16,32,0.94) 100%)',
            border: '1px solid rgba(250,204,21,0.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(250,204,21,0.1)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[1px] w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.6), transparent)',
            }}
          />

          <div className="flex items-stretch px-5 py-3 gap-5">
            {/* Partnership total */}
            <div
              className="flex flex-col border-r pr-5"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: '#facc15', letterSpacing: '0.18em' }}
              >
                Partnership
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  style={{
                    fontFamily: "'Teko', sans-serif",
                    fontSize: '2.2rem',
                    lineHeight: 1,
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 0 20px rgba(250,204,21,0.4)',
                  }}
                >
                  {partnership.runs}
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: '#ffffff', paddingBottom: '4px' }}
                >
                  ({partnership.balls}b)
                </span>
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                style={{ color: '#fde047' }}
              >
                {battingTeam.shortName}
              </span>
            </div>

            {/* Batsmen splits */}
            <div className="flex items-center gap-4">
              {batter1 && (
                <div className="flex flex-col leading-none">
                  <span
                    className="font-bold text-[13px]"
                    style={{ color: '#fde68a', textShadow: '0 0 10px rgba(250,204,21,0.4)' }}
                  >
                    {batter1.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      style={{
                        fontFamily: "'Teko', sans-serif",
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#fff',
                        lineHeight: 1,
                      }}
                    >
                      {partnership.batter1Runs}
                    </span>
                    <span className="text-[9px]" style={{ color: '#fef08a' }}>runs</span>
                  </div>
                </div>
              )}

              <div
                className="text-xs font-black"
                style={{ color: '#facc15', fontSize: '1.1rem' }}
              >
                •
              </div>

              {batter2 && (
                <div className="flex flex-col leading-none">
                  <span
                    className="font-bold text-[13px]"
                    style={{ color: '#fde68a', textShadow: '0 0 10px rgba(250,204,21,0.4)' }}
                  >
                    {batter2.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      style={{
                        fontFamily: "'Teko', sans-serif",
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#fff',
                        lineHeight: 1,
                      }}
                    >
                      {partnership.batter2Runs}
                    </span>
                    <span className="text-[9px]" style={{ color: '#fef08a' }}>runs</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            className="h-[1px] w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.3), transparent)',
            }}
          />
        </div>
      )}

    </div>
  );
};
