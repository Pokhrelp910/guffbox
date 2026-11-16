// GuffBox Cricket Studio — TV Broadcast Full Scoreboard

import React from 'react';
import { InningsState, Team, MatchMetadata } from '../core/types';

interface FullScorecardProps {
  battingTeam: Team;
  bowlingTeam: Team;
  innings: InningsState;
  metadata: MatchMetadata;
  onClose?: () => void;
}

export const FullScorecard: React.FC<FullScorecardProps> = ({
  battingTeam,
  bowlingTeam,
  innings,
  metadata,
  onClose,
}) => {
  const maxOvers = metadata.curtailedOvers || metadata.scheduledOvers;
  const battersList = Object.values(innings.batterStats);
  const bowlersList = Object.values(innings.bowlerStats);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-8 overflow-y-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-cricket-gold pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black font-['Teko'] tracking-wider text-yellow-400">
            {metadata.tournamentName.toUpperCase()} — {metadata.matchStage.toUpperCase()}
          </h1>
          <p className="text-sm text-slate-300 font-medium">
            {battingTeam.name} vs {bowlingTeam.name} • {metadata.venue} • {metadata.date}
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-4xl font-black font-['Teko'] text-white">
              {battingTeam.shortName} {innings.totalRuns} / {innings.totalWickets}
            </div>
            <div className="text-xs text-yellow-400 font-bold">
              {innings.oversFormatted} / {maxOvers} OVERS (RR: {(innings.totalRuns / Math.max(1, innings.legalBalls / 6)).toFixed(2)})
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-bold text-sm border border-slate-600 transition"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Batting Card (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-yellow-400 tracking-wider flex items-center gap-2">
            <span>🏏</span> BATTING SCORECARD — {battingTeam.name.toUpperCase()}
          </h2>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Batter</th>
                  <th className="py-2.5 px-3">Dismissal</th>
                  <th className="py-2.5 px-3 text-right">R</th>
                  <th className="py-2.5 px-3 text-right">B</th>
                  <th className="py-2.5 px-3 text-right">4s</th>
                  <th className="py-2.5 px-3 text-right">6s</th>
                  <th className="py-2.5 px-4 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {battersList.map((b) => (
                  <tr key={b.playerId} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-yellow-200">
                      {b.name}
                      {b.playerId === innings.strikerId && <span className="text-yellow-400 ml-1 font-black">*</span>}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-400 italic">
                      {b.isOut ? (b.dismissalDescription || 'out') : (b.ballsFaced > 0 ? 'not out' : 'yet to bat')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-white">{b.runs}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{b.ballsFaced}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{b.fours}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{b.sixes}</td>
                    <td className="py-2.5 px-4 text-right text-yellow-400 font-bold">{b.strikeRate.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extras and Total Row */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-300">
            <div>
              <span className="text-slate-400 uppercase font-bold mr-2">Extras:</span>
              <span>
                <strong>{innings.extras.total}</strong> (w {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes}, pen {innings.extras.penalties})
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              TOTAL: <span className="text-yellow-400 font-black text-lg">{innings.totalRuns}</span> ({innings.totalWickets} wkts, {innings.oversFormatted} ov)
            </div>
          </div>

          {/* Fall of Wickets */}
          {innings.fallOfWickets.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">FALL OF WICKETS</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {innings.fallOfWickets.map((fow) => (
                  <span key={fow.wicketNumber} className="bg-slate-800 px-2.5 py-1 rounded text-slate-200 border border-slate-700">
                    <strong>{fow.wicketNumber}-{fow.score}</strong> ({fow.playerName}, {fow.overs} ov)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bowling Card (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-yellow-400 tracking-wider flex items-center gap-2">
            <span>🎯</span> BOWLING FIGURES — {bowlingTeam.name.toUpperCase()}
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Bowler</th>
                  <th className="py-2.5 px-3 text-right">O</th>
                  <th className="py-2.5 px-3 text-right">M</th>
                  <th className="py-2.5 px-3 text-right">R</th>
                  <th className="py-2.5 px-3 text-right">W</th>
                  <th className="py-2.5 px-4 text-right">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {bowlersList.map((bw) => (
                  <tr key={bw.playerId} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-200">{bw.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{bw.oversFormatted}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{bw.maidens}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{bw.runsConceded}</td>
                    <td className="py-2.5 px-3 text-right font-black text-yellow-400 text-base">{bw.wickets}</td>
                    <td className="py-2.5 px-4 text-right text-slate-300 font-mono">{bw.economyRate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
