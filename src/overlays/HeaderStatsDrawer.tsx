// GuffBox Cricket Studio — Top Contextual Infographics Drawer

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
    <div className="w-full flex flex-col items-center pointer-events-none transition-all duration-500 transform animate-slide-down">
      
      {/* Free Hit Alert Banner */}
      {innings.isFreeHitActive && (
        <div className="bg-red-600 border-b-2 border-yellow-400 text-white font-black tracking-widest text-sm px-8 py-1 rounded-b-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>⚡ FREE HIT ⚡</span>
          <span className="text-xs bg-yellow-400 text-red-950 px-2 py-0.5 rounded font-extrabold uppercase">
            Bowler Cannot Dismiss via Bowled/Caught/LBW
          </span>
        </div>
      )}

      {/* Milestone Alert Banner */}
      {milestoneMessage && (
        <div className="mt-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base px-8 py-1.5 rounded-xl shadow-2xl border-2 border-white flex items-center space-x-2">
          <span>🏆</span>
          <span>{milestoneMessage.toUpperCase()}</span>
          <span>🏆</span>
        </div>
      )}

      {/* Current Partnership Drawer */}
      {isVisible && (
        <div className="mt-2 bg-slate-950/90 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-white max-w-xl flex items-center space-x-6">
          <div className="flex flex-col border-r border-slate-800 pr-4">
            <span className="text-[10px] text-yellow-400 font-bold tracking-widest uppercase">PARTNERSHIP</span>
            <div className="text-2xl font-black font-['Teko'] text-white">
              {partnership.runs} <span className="text-xs font-sans text-slate-400 font-normal">({partnership.balls}b)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">{battingTeam.shortName}</span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            {batter1 && (
              <div className="flex flex-col">
                <span className="text-yellow-300">{batter1.name}</span>
                <span className="text-slate-300 font-bold">{partnership.batter1Runs} runs</span>
              </div>
            )}
            <span className="text-slate-600 font-bold">vs</span>
            {batter2 && (
              <div className="flex flex-col">
                <span className="text-yellow-300">{batter2.name}</span>
                <span className="text-slate-300 font-bold">{partnership.batter2Runs} runs</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
