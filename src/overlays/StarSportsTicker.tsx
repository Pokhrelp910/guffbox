// GuffBox Cricket Studio — Star Sports Broadcast Lower-Third Ticker

import React from 'react';
import { InningsState, Team, MatchMetadata, BallDeliveryEvent } from '../core/types';
import { calculateMatchRates } from '../core/target-calculator';

interface StarSportsTickerProps {
  battingTeam: Team;
  bowlingTeam: Team;
  innings: InningsState;
  metadata: MatchMetadata;
  isSecondInnings: boolean;
  target?: number;
  highlightNewBallId?: string;
}

export const StarSportsTicker: React.FC<StarSportsTickerProps> = ({
  battingTeam,
  bowlingTeam,
  innings,
  metadata,
  isSecondInnings,
  target,
  highlightNewBallId,
}) => {
  const striker = innings.batterStats[innings.strikerId];
  const nonStriker = innings.batterStats[innings.nonStrikerId];
  const bowler = innings.bowlerStats[innings.currentBowlerId];

  const maxOvers = metadata.curtailedOvers || metadata.scheduledOvers;
  const matchRates = calculateMatchRates({
    currentRuns: innings.totalRuns,
    legalBallsBowled: innings.legalBalls,
    maxOvers,
    target: target || metadata.targetRuns,
    wickets: innings.totalWickets,
    battingTeamName: battingTeam.name,
    bowlingTeamName: bowlingTeam.name,
    isFirstInnings: !isSecondInnings,
  });

  const getBadgeColor = (ball: BallDeliveryEvent) => {
    if (ball.wicket) return 'bg-red-600 text-white font-bold border-red-400';
    if (ball.isSix) return 'bg-purple-600 text-white font-bold border-purple-400';
    if (ball.isFour) return 'bg-blue-600 text-white font-bold border-blue-400';
    if (ball.extraType === 'wide' || ball.extraType === 'noball') return 'bg-amber-600 text-white font-semibold border-amber-400';
    if (ball.extraType === 'penalty') return 'bg-emerald-600 text-white font-semibold border-emerald-400';
    if (ball.runsBat === 0 && ball.runsExtras === 0) return 'bg-slate-800 text-slate-300 border-slate-700';
    return 'bg-slate-700 text-slate-100 border-slate-600';
  };

  return (
    <div className="w-full font-sans select-none drop-shadow-2xl">
      {/* Lower-Third Container */}
      <div className="flex items-stretch h-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t-2 border-cricket-gold text-white overflow-hidden shadow-2xl">
        
        {/* SECTION 1: Team Crest & Scoreboard */}
        <div 
          className="flex items-center px-4 space-x-3 border-r border-slate-700 relative"
          style={{ background: `linear-gradient(135deg, ${battingTeam.color || '#1e3a8a'}ee, #090d16)` }}
        >
          {battingTeam.logoUrl ? (
            <img src={battingTeam.logoUrl} alt={battingTeam.shortName} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-cricket-gold flex items-center justify-center font-black tracking-wider text-sm text-yellow-400">
              {battingTeam.shortName.substring(0, 3)}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black font-['Teko'] tracking-wider text-yellow-400">
                {battingTeam.shortName}
              </span>
              <span className="text-3xl font-black font-['Teko'] tracking-tight text-white">
                {innings.totalRuns}/{innings.totalWickets}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
              <span>OVERS:</span>
              <span className="text-yellow-400 font-bold">{innings.oversFormatted}</span>
              <span className="text-slate-400">/ {maxOvers}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Target & Run Rates */}
        <div className="flex flex-col justify-center px-4 border-r border-slate-800 bg-slate-900/80 min-w-[130px]">
          <div className="text-xs text-slate-400 font-medium">CRR: <span className="text-white font-bold">{matchRates.crrFormatted}</span></div>
          {isSecondInnings && matchRates.targetRuns ? (
            <>
              <div className="text-xs text-amber-400 font-bold">TARGET: {matchRates.targetRuns}</div>
              <div className="text-xs text-yellow-300 font-extrabold">
                RRR: {matchRates.rrrFormatted}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              {metadata.matchStage || '1st INNINGS'}
            </div>
          )}
        </div>

        {/* SECTION 3: Current Batsmen (Striker & Non-Striker) */}
        <div className="flex flex-1 items-center px-4 space-x-6 bg-slate-950/70 border-r border-slate-800">
          {/* Striker */}
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" title="On Strike" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                {striker?.name || 'Striker'} *
              </span>
              <div className="text-xs text-slate-300 font-semibold space-x-2">
                <span><strong className="text-white text-sm">{striker?.runs ?? 0}</strong> ({striker?.ballsFaced ?? 0})</span>
                <span className="text-slate-400">4s: {striker?.fours ?? 0}</span>
                <span className="text-slate-400">6s: {striker?.sixes ?? 0}</span>
                <span className="text-slate-400">SR: {striker?.strikeRate ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-800" />

          {/* Non-Striker */}
          <div className="flex items-center space-x-2 opacity-85">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-300">
                {nonStriker?.name || 'Non-Striker'}
              </span>
              <div className="text-xs text-slate-400 font-medium space-x-2">
                <span><strong className="text-slate-200">{nonStriker?.runs ?? 0}</strong> ({nonStriker?.ballsFaced ?? 0})</span>
                <span>4s: {nonStriker?.fours ?? 0}</span>
                <span>6s: {nonStriker?.sixes ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Current Bowler Spell */}
        <div className="flex items-center px-4 border-r border-slate-800 bg-slate-900/60 min-w-[170px]">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Bowling</span>
            <span className="text-sm font-bold text-yellow-300 truncate max-w-[140px]">
              {bowler?.name || 'Bowler'}
            </span>
            <div className="text-xs text-slate-300 font-mono font-bold">
              {bowler?.oversFormatted ?? '0.0'}-{bowler?.maidens ?? 0}-{bowler?.runsConceded ?? 0}-{bowler?.wickets ?? 0}
              <span className="ml-1 text-[11px] font-normal text-slate-400">({bowler?.economyRate ?? 0} econ)</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: Recent Deliveries in Current Over */}
        <div className="flex items-center px-4 bg-slate-950/90 space-x-1.5 min-w-[210px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">THIS OVER</span>
          <div className="flex items-center space-x-1.5">
            {innings.recentBalls.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Starting over...</span>
            ) : (
              innings.recentBalls.map((ball) => {
                const isJustDocked = ball.id === highlightNewBallId;
                return (
                  <div
                    key={ball.id}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border shadow-md transition-all duration-300 ${getBadgeColor(ball)} ${
                      isJustDocked ? 'scale-125 ring-2 ring-yellow-400 animate-dock-ball' : ''
                    }`}
                  >
                    {ball.displayBadge}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Target Tracker Sub-bar for Innings 2 */}
      {isSecondInnings && matchRates.runsNeeded !== null && (
        <div className="bg-yellow-500 text-slate-950 px-4 py-1 text-xs font-black tracking-wider flex items-center justify-between">
          <span>{battingTeam.name.toUpperCase()} NEED {matchRates.runsNeeded} RUNS IN {matchRates.ballsRemaining} BALLS</span>
          {innings.isFreeHitActive && (
            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] animate-pulse">
              ⚡ FREE HIT NEXT BALL ⚡
            </span>
          )}
          <span>TARGET: {matchRates.targetRuns} ({maxOvers} OVERS)</span>
        </div>
      )}
    </div>
  );
};
