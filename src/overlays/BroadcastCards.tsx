// GuffBox Cricket Studio — TV Broadcast Presentation Cards Suite
// Features: Toss Presentation, Playing XI Lineup, Innings Break Summary, and Match Victory Card

import React from 'react';
import { MatchState } from '../core/types';
import { calculateMatchRates } from '../core/target-calculator';
import { Trophy, Users, X, Flame, Sparkles } from 'lucide-react';

export type PresentationCardType = 'none' | 'toss' | 'playing11' | 'interval' | 'victory' | 'milestone';

interface BroadcastCardsProps {
  cardType: PresentationCardType;
  match: MatchState;
  onClose: () => void;
}

export const BroadcastCards: React.FC<BroadcastCardsProps> = ({
  cardType,
  match,
  onClose,
}) => {
  if (cardType === 'none') return null;

  const currentInnings = match.currentInningsNumber === 2 && match.innings2 ? match.innings2 : match.innings1;
  const battingTeam = currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const isSecondInnings = match.currentInningsNumber === 2;
  const maxOvers = match.metadata.curtailedOvers || match.metadata.scheduledOvers;

  const matchRates = calculateMatchRates({
    currentRuns: currentInnings.totalRuns,
    legalBallsBowled: currentInnings.legalBalls,
    maxOvers,
    target: match.metadata.targetRuns,
    wickets: currentInnings.totalWickets,
    battingTeamName: battingTeam.name,
    bowlingTeamName: bowlingTeam.name,
    isFirstInnings: !isSecondInnings,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        background: 'rgba(2, 4, 12, 0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="w-full max-w-4xl border rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
        style={{
          background: 'linear-gradient(145deg, #070d1e 0%, #1c050a 100%)',
          borderColor: '#facc15',
          boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 40px rgba(250,204,21,0.2)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-red-950 hover:bg-red-900 text-yellow-300 hover:text-white flex items-center justify-center transition border border-yellow-500/40 cursor-pointer shadow-md"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* ════ CARD 1: TOSS PRESENTATION ════ */}
        {cardType === 'toss' && (
          <div className="p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background lighting */}
            <div className="absolute top-0 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/40 px-4 py-1.5 rounded-2xl mb-4 shadow">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-['Teko'] text-xl font-bold tracking-widest text-yellow-400 uppercase">
                OFFICIAL TOSS PRESENTATION
              </span>
            </div>

            <div className="text-sm font-bold uppercase tracking-widest text-white/80 mb-6">
              {match.metadata.tournamentName} • {match.metadata.matchStage} • {match.metadata.venue}
            </div>

            {/* Duel Badges */}
            <div className="flex items-center justify-center space-x-8 mb-8">
              {/* Team A */}
              <div className="flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl border-2 shadow-2xl"
                  style={{
                    backgroundColor: match.teamA.color,
                    borderColor: '#facc15',
                    color: '#fff',
                    fontFamily: "'Teko', sans-serif",
                  }}
                >
                  {match.teamA.shortName}
                </div>
                <span className="mt-2 font-black text-lg text-white">{match.teamA.name}</span>
                <span className="text-xs text-yellow-300">
                  Capt: {match.teamA.squad.find((p) => p.isCaptain)?.name || match.teamA.squad[0]?.name}
                </span>
              </div>

              {/* Coin */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-yellow-100 flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg animate-bounce">
                  🪙
                </div>
                <span className="text-xs font-bold text-yellow-400 mt-2 uppercase tracking-wider">
                  COIN FLIP
                </span>
              </div>

              {/* Team B */}
              <div className="flex flex-col items-center">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl border-2 shadow-2xl"
                  style={{
                    backgroundColor: match.teamB.color,
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#fff',
                    fontFamily: "'Teko', sans-serif",
                  }}
                >
                  {match.teamB.shortName}
                </div>
                <span className="mt-2 font-black text-lg text-white">{match.teamB.name}</span>
                <span className="text-xs text-yellow-300">
                  Capt: {match.teamB.squad.find((p) => p.isCaptain)?.name || match.teamB.squad[0]?.name}
                </span>
              </div>
            </div>

            {/* Toss Decision Banner */}
            <div
              className="w-full max-w-xl rounded-2xl p-5 border shadow-xl"
              style={{
                background: 'linear-gradient(145deg, rgba(10,18,44,0.96) 0%, rgba(38,6,14,0.95) 100%)',
                borderColor: '#facc15',
              }}
            >
              <div className="text-2xl font-black text-white font-['Teko'] tracking-wider leading-snug">
                <span className="text-yellow-400">
                  {match.toss.winnerTeamId === match.teamA.id ? match.teamA.name.toUpperCase() : match.teamB.name.toUpperCase()}
                </span>{' '}
                WON THE TOSS AND ELECTED TO{' '}
                <span className="text-yellow-300 underline decoration-yellow-400 decoration-2 underline-offset-4">
                  {match.toss.electedTo.toUpperCase()} FIRST
                </span>
              </div>
              <p className="text-xs text-white/80 mt-2 font-medium">
                Scheduled: {maxOvers} Overs per side • Powerplay: 6 Overs
              </p>
            </div>
          </div>
        )}

        {/* ════ CARD 2: PLAYING XI LINEUPS ════ */}
        {cardType === 'playing11' && (
          <div className="p-6">
            <div className="text-center mb-5">
              <div className="inline-flex items-center space-x-2 bg-yellow-400/10 border border-yellow-400/40 px-4 py-1 rounded-2xl mb-1 shadow">
                <Users className="w-4 h-4 text-yellow-400" />
                <span className="font-['Teko'] text-xl font-bold tracking-widest text-yellow-400 uppercase">
                  CONFIRMED PLAYING XI LINEUPS
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">
                {match.metadata.tournamentName} • {match.metadata.matchStage}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Team A XI */}
              <div className="bg-[#081026] rounded-2xl p-4 border border-yellow-500/25">
                <div className="flex items-center space-x-3 pb-3 border-b border-yellow-500/20 mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: match.teamA.color, color: '#fff' }}
                  >
                    {match.teamA.shortName}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{match.teamA.name}</h3>
                    <p className="text-[10px] text-yellow-400 uppercase font-semibold">Playing XI</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {match.teamA.squad.slice(0, 11).map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-[#050914] border border-yellow-500/15 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-white/60 w-4">{idx + 1}.</span>
                        <span className="font-bold text-white">{p.name}</span>
                        {p.isCaptain && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-yellow-400 text-slate-950">
                            C
                          </span>
                        )}
                        {p.isWicketKeeper && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-700 text-yellow-300">
                            WK
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-yellow-300 capitalize">{p.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B XI */}
              <div className="bg-[#081026] rounded-2xl p-4 border border-yellow-500/25">
                <div className="flex items-center space-x-3 pb-3 border-b border-yellow-500/20 mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: match.teamB.color, color: '#fff' }}
                  >
                    {match.teamB.shortName}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{match.teamB.name}</h3>
                    <p className="text-[10px] text-yellow-400 uppercase font-semibold">Playing XI</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {match.teamB.squad.slice(0, 11).map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-[#050914] border border-yellow-500/15 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-white/60 w-4">{idx + 1}.</span>
                        <span className="font-bold text-white">{p.name}</span>
                        {p.isCaptain && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-yellow-400 text-slate-950">
                            C
                          </span>
                        )}
                        {p.isWicketKeeper && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-700 text-yellow-300">
                            WK
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-yellow-300 capitalize">{p.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ CARD 3: INNINGS BREAK / INTERVAL CARD ════ */}
        {cardType === 'interval' && (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 bg-red-950/80 border border-yellow-500/40 px-4 py-1.5 rounded-2xl mb-2 shadow">
              <Flame className="w-4 h-4 text-yellow-400" />
              <span className="font-['Teko'] text-2xl font-bold tracking-widest text-yellow-400 uppercase">
                INNINGS BREAK — TARGET EQUATION
              </span>
            </div>

            <div className="text-xs text-white/80 mb-6 font-medium">
              1st Innings Concluded • {match.metadata.tournamentName}
            </div>

            {/* Innings 1 Summary Score */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border-2"
                style={{ backgroundColor: match.innings1.battingTeamId === match.teamA.id ? match.teamA.color : match.teamB.color, color: '#fff' }}
              >
                {match.innings1.battingTeamId === match.teamA.id ? match.teamA.shortName : match.teamB.shortName}
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white">
                  {match.innings1.battingTeamId === match.teamA.id ? match.teamA.name : match.teamB.name}
                </div>
                <div className="text-4xl font-black font-['Teko'] text-white">
                  {match.innings1.totalRuns} / <span className="text-yellow-400">{match.innings1.totalWickets}</span>{' '}
                  <span className="text-lg text-yellow-300 font-sans font-bold">
                    ({match.innings1.oversFormatted} ov)
                  </span>
                </div>
              </div>
            </div>

            {/* Target Chase Banner */}
            <div
              className="w-full max-w-lg rounded-2xl p-5 border shadow-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(38,6,14,0.96) 0%, rgba(18,3,7,0.98) 100%)',
                borderColor: '#facc15',
              }}
            >
              <div className="text-3xl font-black font-['Teko'] text-white tracking-wider">
                {bowlingTeam.name.toUpperCase()} NEED{' '}
                <span className="text-yellow-400 text-4xl">{match.innings1.totalRuns + 1}</span> RUNS TO WIN
              </div>
              <div className="mt-2 flex items-center justify-center space-x-6 text-xs text-white font-semibold">
                <span>Total Overs: <strong className="text-yellow-300">{maxOvers}</strong></span>
                <span>Required Run Rate: <strong className="text-yellow-300">{((match.innings1.totalRuns + 1) / maxOvers).toFixed(2)}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ════ CARD 4: MATCH VICTORY PRESENTATION ════ */}
        {cardType === 'victory' && (
          <div className="p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-yellow-500/20 border border-yellow-500 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-bounce">
              <Trophy className="w-9 h-9 text-yellow-400" />
            </div>

            <div className="text-xs uppercase font-extrabold tracking-widest text-yellow-400 mb-1">
              GRAND FINAL • MATCH RESULT
            </div>

            <h1
              className="text-4xl font-black text-white font-['Teko'] tracking-wider mb-4"
              style={{ textShadow: '0 0 25px rgba(250,204,21,0.6)' }}
            >
              {matchRates.matchResult || `${battingTeam.name.toUpperCase()} ARE THE CHAMPIONS!`}
            </h1>

            {/* Score Summary Box */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg bg-[#081026] rounded-2xl p-4 border border-yellow-500/30 mb-5">
              <div className="text-center border-r border-yellow-500/20 pr-2">
                <div className="text-xs font-bold text-yellow-400 uppercase">{match.teamA.name}</div>
                <div className="text-2xl font-black text-white font-['Teko'] mt-1">
                  {match.innings1.battingTeamId === match.teamA.id
                    ? `${match.innings1.totalRuns}/${match.innings1.totalWickets} (${match.innings1.oversFormatted})`
                    : match.innings2
                    ? `${match.innings2.totalRuns}/${match.innings2.totalWickets} (${match.innings2.oversFormatted})`
                    : '—'}
                </div>
              </div>

              <div className="text-center pl-2">
                <div className="text-xs font-bold text-yellow-400 uppercase">{match.teamB.name}</div>
                <div className="text-2xl font-black text-white font-['Teko'] mt-1">
                  {match.innings1.battingTeamId === match.teamB.id
                    ? `${match.innings1.totalRuns}/${match.innings1.totalWickets} (${match.innings1.oversFormatted})`
                    : match.innings2
                    ? `${match.innings2.totalRuns}/${match.innings2.totalWickets} (${match.innings2.oversFormatted})`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="text-xs text-white/80 font-medium">
              Thank you for watching GuffBox Cricket Live Broadcast! 🏏
            </div>
          </div>
        )}

        {/* ════ CARD 5: PLAYER SPOTLIGHT & MILESTONE ════ */}
        {cardType === 'milestone' && (
          <div className="p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="flex items-center space-x-2 bg-yellow-400/10 border border-yellow-400/40 px-4 py-1.5 rounded-2xl mb-4 shadow">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-['Teko'] text-xl font-bold tracking-widest text-yellow-400 uppercase">
                ★ PLAYER SPOTLIGHT & MILESTONE ★
              </span>
            </div>

            {(() => {
              const striker = currentInnings.batterStats[currentInnings.strikerId];
              const topBatter = Object.values(currentInnings.batterStats).sort((a, b) => b.runs - a.runs)[0] || striker;
              const topBowler = Object.values(currentInnings.bowlerStats).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0];

              return (
                <div className="w-full max-w-2xl bg-[#081026] border border-yellow-500/40 rounded-3xl p-6 shadow-2xl relative">
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                    {/* Player Badge / Avatar */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black border-2 shadow-2xl"
                        style={{
                          backgroundColor: battingTeam.color,
                          borderColor: '#facc15',
                          color: '#fff',
                          fontFamily: "'Teko', sans-serif",
                        }}
                      >
                        {topBatter?.name.split(' ').map((n) => n[0]).join('') || 'BAT'}
                      </div>
                      <div className="mt-2 text-xl font-black text-white font-['Teko'] tracking-wider">
                        {topBatter?.name || 'Striker Batter'}
                      </div>
                      <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
                        {battingTeam.name}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 flex-1 text-center">
                      <div className="bg-[#050914] p-3 rounded-2xl border border-yellow-500/20">
                        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">RUNS</div>
                        <div className="text-3xl font-black font-['Teko'] text-yellow-400 leading-tight">
                          {topBatter?.runs ?? 0}
                        </div>
                        <div className="text-[10px] text-white/80">({topBatter?.ballsFaced ?? 0} balls)</div>
                      </div>

                      <div className="bg-[#050914] p-3 rounded-2xl border border-yellow-500/20">
                        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">BOUNDARIES</div>
                        <div className="text-2xl font-black font-['Teko'] text-white leading-tight mt-1">
                          {topBatter?.fours ?? 0} <span className="text-xs text-white/70">fours</span>
                        </div>
                        <div className="text-xs font-bold text-yellow-300">
                          {topBatter?.sixes ?? 0} <span className="text-[10px] text-yellow-200">sixes</span>
                        </div>
                      </div>

                      <div className="bg-[#050914] p-3 rounded-2xl border border-yellow-500/20">
                        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">STRIKE RATE</div>
                        <div className="text-2xl font-black font-mono text-white leading-tight mt-1">
                          {topBatter?.strikeRate ?? 0}
                        </div>
                        <div className="text-[10px] text-white/80">Per 100 balls</div>
                      </div>
                    </div>
                  </div>

                  {/* Leading Bowler Spotlight Footer */}
                  {topBowler && topBowler.wickets > 0 && (
                    <div className="mt-4 pt-3 border-t border-yellow-500/20 flex items-center justify-between text-xs px-2">
                      <span className="text-white">
                        🎯 Leading Bowler: <strong className="text-yellow-300">{topBowler.name}</strong>
                      </span>
                      <span className="font-mono font-bold text-white">
                        {topBowler.wickets}/{topBowler.runsConceded} ({topBowler.oversFormatted} ov • Econ: {topBowler.economyRate})
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
};
